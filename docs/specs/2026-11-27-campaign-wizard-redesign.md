# Campaign Wizard Redesign — Spec

## Problem

The current wizard collects generic data (business description, budget, media) but the AI generates copies without enough context. It doesn't know the specific promotion, doesn't use the communication tone, hardcodes strategy to TOFU, only analyzes 1 image, and doesn't distinguish between selling via web vs WhatsApp vs driving Instagram traffic. The result: generic copies that don't feel tailored.

## Goal

Redesign the wizard so the AI generates copies that feel like they came from a real ad agency — specific to the product being promoted, the destination, the brand voice, and the visual content.

## User Flow

### Step 0 — Business Profile (skip if exists)

Same as today. First-time users fill: business name, website, goal. Returning users skip this step because the data lives in `business_profiles`.

### Step 1 — "Tu campaña" (single screen)

Four fields, vertically stacked:

1. **"¿Qué querés promocionar?"** — textarea, placeholder: "Ej: Promo 2x1 en remeras de verano hasta el domingo"
   - New field: `campaign_promo` (not reusing `product_description` which is about the business overall)
   - Required, min 10 characters

2. **"¿Cuál es tu objetivo?"** — 3 large selection cards:
   - 💰 **Vender por mi web** → maps to `sales_web`
   - 💬 **Vender por WhatsApp** → maps to `sales_whatsapp`
   - 📸 **Tráfico a Instagram** → maps to `instagram_traffic`

3. **"Presupuesto diario"** — number input + quick-pick chips ($5, $10, $15, $25, $50)
   - Shows currency symbol from profile
   - Shows approximate USD conversion for non-USD currencies

4. **"¿Por cuánto tiempo?"** — 4 cards: 7 días / 14 días / 30 días / Continua

### Step 2 — "Material visual" (single screen)

- Drag & drop zone for up to 10 images/videos
- Subtitle: "Subí fotos de tu producto. La IA las analiza para crear copies específicos."
- Same processing as today (compress, base64)
- Optional step — user can skip and AI generates without visual context

### Step 3 — AI Generating (loading animation)

Same animated loading as today. No changes.

### Step 4 — Review & Publish

Same as today with inline editing. No changes to this step's UI.

### Step 5 — Done

Same as today.

## AI Context Package

When generating, the AI receives everything it needs in one payload:

### From Business Profile (automatic, no user input needed)

| Field | Source | Used for |
|-------|--------|----------|
| `business_name` | business_profiles.business_name | Brand mentions in copy |
| `industry` | business_profiles.industry | Industry-specific language |
| `country` | business_profiles.country | Dialect (voseo/tuteo), CPM estimates |
| `currency` | business_profiles.currency | Budget context |
| `website_url` | business_profiles.website_url | Destination URL for web campaigns |
| `whatsapp_number` | business_profiles.whatsapp_number | WhatsApp destination |
| `communication_tone` | business_profiles.communication_tone | Copy voice: profesional/cercano/urgente/inspiracional |
| `default_whatsapp_cta` | business_profiles.default_whatsapp_cta | Custom WhatsApp CTA template |
| `fb_page_name` | business_profiles.fb_page_name | Page name for context |
| `instagram_account_name` | business_profiles.instagram_account_name | IG handle for traffic campaigns |
| `pixel_level` | pixel_analysis.level | Strategy selection (TOFU/MOFU/BOFU) |
| `pixel_data` | pixel_analysis.* | Retargeting/lookalike capabilities |

### From This Campaign (user fills in Step 1-2)

| Field | Source | Used for |
|-------|--------|----------|
| `campaign_promo` | Step 1 textarea | Specific product/offer for THIS campaign |
| `campaign_objective` | Step 1 cards | Determines Meta objective, CTA, destination |
| `daily_budget` | Step 1 input | Budget allocation, estimated results |
| `duration` | Step 1 cards | Urgency in copy, pacing recommendations |
| `images` (up to 5) | Step 2 uploads | Visual analysis — product, colors, style, context |

### Auto-Inferred (no user input)

| Inference | Logic |
|-----------|-------|
| Strategy type | pixel_level < 3 → TOFU. pixel_level 3-4 → MOFU. pixel_level 5+ → BOFU. Override: `instagram_traffic` always TOFU. |
| Meta campaign objective | `sales_web` → OUTCOME_SALES. `sales_whatsapp` → OUTCOME_ENGAGEMENT. `instagram_traffic` → OUTCOME_TRAFFIC. |
| Primary CTA | `sales_web` → SHOP_NOW. `sales_whatsapp` → WHATSAPP_MESSAGE. `instagram_traffic` → LEARN_MORE. |
| Destination URL | `sales_web` → website_url. `sales_whatsapp` → WhatsApp deep link. `instagram_traffic` → IG profile URL. |
| Copy dialect | country → Argentine voseo, Colombian tuteo, Mexican tuteo, etc. |

## Objective → Meta Campaign Mapping

| AdFlow Objective | Meta Objective | Optimization Goal | CTA Type | Destination |
|-----------------|----------------|-------------------|----------|-------------|
| `sales_web` | OUTCOME_SALES | OFFSITE_CONVERSIONS (pixel 5+) or LINK_CLICKS (pixel <5) | SHOP_NOW | website_url |
| `sales_whatsapp` | OUTCOME_ENGAGEMENT | CONVERSATIONS | WHATSAPP_MESSAGE | wa.me/number |
| `instagram_traffic` | OUTCOME_TRAFFIC | LINK_CLICKS | LEARN_MORE | instagram.com/handle |

## AI Prompt Changes

### New context section at top of prompt

```
CONTEXTO DE MARCA:
- Negocio: {business_name}
- Industria: {industry}
- Tono de comunicación: {communication_tone}
- País: {country}
- WhatsApp CTA personalizado: {default_whatsapp_cta || "ninguno"}
- Página de Facebook: {fb_page_name}
- Instagram: @{instagram_account_name}

ESTA CAMPAÑA:
- Promoción: {campaign_promo}
- Objetivo: {campaign_objective_label}
- Presupuesto: {currency_symbol}{daily_budget}/día × {duration} días
- Destino: {destination_description}
```

### Image analysis instruction

```
Se adjuntan {N} imágenes del producto/servicio. Analizá CADA imagen:
1. Qué producto/servicio se ve
2. Estilo visual (colores, iluminación, composición)
3. Contexto (lifestyle, producto solo, antes/después)

Usá lo que ves para:
- Adaptar el copy a lo que realmente muestra la imagen
- Sugerir qué imagen usar con cada ángulo de copy
- Referenciar detalles visuales en el texto (colores, materiales, etc.)
```

### Tone instruction

```
TONO: Escribí TODOS los copies en tono {communication_tone}.
- profesional: formal, datos, autoridad, sin emojis excesivos
- cercano: conversacional, empático, como un amigo que recomienda
- urgente: directo, FOMO, escasez, acción inmediata
- inspiracional: aspiracional, emocional, transformación personal
```

## Technical Changes

### 1. WizardState type update

```typescript
export interface WizardState {
  // Step 1: Campaign
  campaign_promo: string          // NEW — what's being promoted this time
  campaign_objective: CampaignObjective  // NEW — sales_web | sales_whatsapp | instagram_traffic
  daily_budget: number
  duration: 7 | 14 | 30 | 0
  // Step 2: Media
  mediaFiles: File[]
  mediaPreviews: Array<string | null>
}

export type CampaignObjective = 'sales_web' | 'sales_whatsapp' | 'instagram_traffic'
```

Remove: `product_description`, `website_url`, `goal` from WizardState (these live in business_profiles).

### 2. Step components

- **Delete** `StepBusiness.tsx` → first-time flow handled by onboarding/settings, not wizard
- **Rename** `StepBudget.tsx` → `StepCampaign.tsx` — combines promo + objective + budget + duration
- **Keep** `StepMedia.tsx` — same but subtitle updated
- **Keep** `StepGenerating.tsx`, `StepPublish.tsx`, `StepDone.tsx`

### 3. API payload changes

Add to `generate-copies` request body:
- `campaign_promo` (string, required)
- `campaign_objective` (enum, required)
- `duration` (number)
- `business_name` (string)
- `communication_tone` (string)
- `default_whatsapp_cta` (string)
- `fb_page_name` (string)
- `instagram_account_name` (string)

Change:
- `image_base64s` → send up to 5 (was limited to 1 in API route)
- Remove 1-image limit in route handler

### 4. Strategy auto-selection

Move from client to API. Logic:

```typescript
function selectStrategy(objective: CampaignObjective, pixelLevel: number): StrategyType {
  if (objective === 'instagram_traffic') return 'TOFU'
  if (pixelLevel >= 5) return 'BOFU'
  if (pixelLevel >= 3) return 'MOFU'
  return 'TOFU'
}
```

### 5. Validation schema update

Update `generateCopiesSchema` in `src/lib/validations.ts` to accept new fields and validate `campaign_objective` enum.

## What Does NOT Change

- Database schema — no new tables or columns needed
- Campaign storage in `campaigns` table — `ai_copies` JSONB holds whatever the AI generates
- Publish to Meta flow — the AI output format stays the same
- Credit system — same cost per generation
- Settings/business profile pages — no changes
- Admin panel — no changes

## Migration

The old `goal` field (sales/leads/traffic) maps to the new objectives:
- `sales` → `sales_web`
- `leads` → `sales_web` (closest match)
- `traffic` → `instagram_traffic`

No database migration needed — the goal was only in the client-side wizard state, never persisted.
