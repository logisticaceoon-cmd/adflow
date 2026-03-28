// src/lib/strategy-engine.ts
// Campaign Strategy Decision Engine:
//   - CTA options per Meta objective
//   - CBO vs ABO budget mode decision
//   - Pre-publish payload validation

export type BudgetMode = 'CBO' | 'ABO'

export interface CampaignBlueprint {
  mode: BudgetMode
  reason: string
}

// ── CTA Options ───────────────────────────────────────────────────────────────

export interface CTAOption {
  type: string   // Meta API constant  (e.g. SHOP_NOW)
  label: string  // Spanish display label
}

/**
 * Full list of supported Meta CTA types with their Spanish labels.
 * Used as fallback when no objective-specific filter is available.
 */
export const CTA_OPTIONS: CTAOption[] = [
  { type: 'LEARN_MORE',   label: 'Más información' },
  { type: 'SHOP_NOW',     label: 'Comprar ahora' },
  { type: 'SIGN_UP',      label: 'Registrarte' },
  { type: 'APPLY_NOW',    label: 'Solicitar ahora' },
  { type: 'GET_OFFER',    label: 'Obtener oferta' },
  { type: 'CONTACT_US',   label: 'Contactarnos' },
  { type: 'MESSAGE_PAGE', label: 'Enviar mensaje' },
  { type: 'BOOK_TRAVEL',  label: 'Reservar ahora' },
  { type: 'DOWNLOAD',     label: 'Descargar' },
  { type: 'SEE_MORE',     label: 'Ver más' },
]

// Allowed CTA types per Meta campaign objective
const CTA_BY_OBJECTIVE: Record<string, string[]> = {
  OUTCOME_SALES:      ['SHOP_NOW', 'LEARN_MORE', 'GET_OFFER', 'SEE_MORE'],
  OUTCOME_LEADS:      ['SIGN_UP', 'APPLY_NOW', 'CONTACT_US', 'LEARN_MORE'],
  OUTCOME_TRAFFIC:    ['LEARN_MORE', 'SHOP_NOW', 'SEE_MORE', 'DOWNLOAD'],
  OUTCOME_ENGAGEMENT: ['LEARN_MORE', 'SIGN_UP', 'SEE_MORE', 'CONTACT_US'],
  OUTCOME_AWARENESS:  ['LEARN_MORE', 'SEE_MORE', 'SHOP_NOW'],
  // legacy objectives
  CONVERSIONS:        ['SHOP_NOW', 'LEARN_MORE', 'GET_OFFER'],
  LEAD_GENERATION:    ['SIGN_UP', 'APPLY_NOW', 'CONTACT_US', 'LEARN_MORE'],
  TRAFFIC:            ['LEARN_MORE', 'SHOP_NOW', 'SEE_MORE'],
  REACH:              ['LEARN_MORE', 'SEE_MORE', 'SHOP_NOW'],
}

/**
 * Returns the CTA options valid for the given Meta campaign objective.
 * Falls back to the full CTA_OPTIONS list if objective is unknown.
 */
export function getCTAOptionsForObjective(objective?: string | null): CTAOption[] {
  const allowed = objective ? CTA_BY_OBJECTIVE[objective] : null
  if (!allowed) return CTA_OPTIONS
  return CTA_OPTIONS.filter(o => allowed.includes(o.type))
}

/** Returns the Spanish label for a given Meta CTA type constant. */
export function getLabelForCTAType(type: string): string {
  return CTA_OPTIONS.find(o => o.type === type)?.label ?? 'Más información'
}

// ── Budget Mode Decision ──────────────────────────────────────────────────────

interface DecisionParams {
  objective: string
  ad_set_count: number
  has_pixel: boolean
  /** TOFU | MOFU | BOFU — from campaign.strategy_type */
  strategy_type?: string | null
}

/**
 * Decides whether to use CBO (Campaign Budget Optimization) or
 * ABO (Ad Set Budget Optimization) based on campaign parameters.
 *
 * CBO: Meta distributes the budget automatically across ad sets.
 *   → Best for: BOFU campaigns, OUTCOME_SALES, 3+ ad sets, pixel configured.
 *
 * ABO: Each ad set has its own fixed budget.
 *   → Best for: testing, TOFU/MOFU, remarketing, no pixel, low ad-set count.
 *
 * The engine only chooses CBO when ALL of these are true:
 *   1. BOFU strategy with OUTCOME_SALES objective
 *   2. Pixel is configured (required for OFFSITE_CONVERSIONS)
 *   3. 3 or more ad sets (CBO is meaningless with 1)
 * All other configurations default to ABO for predictability.
 */
export function decideBudgetMode(params: DecisionParams): CampaignBlueprint {
  const { objective, ad_set_count, has_pixel, strategy_type } = params

  // CBO requires at least 2 ad sets to have any effect
  if (ad_set_count < 2) {
    return { mode: 'ABO', reason: 'Un solo ad set — ABO para control directo de presupuesto' }
  }

  // BOFU + conversion objective + pixel + 3 ad sets → CBO
  // This is the only case where Meta's automatic budget distribution helps significantly
  if (
    strategy_type === 'BOFU' &&
    objective === 'OUTCOME_SALES' &&
    has_pixel &&
    ad_set_count >= 3
  ) {
    return {
      mode: 'CBO',
      reason: 'BOFU con OUTCOME_SALES, Pixel configurado y 3+ ad sets → CBO para distribución automática de presupuesto entre audiencias',
    }
  }

  // TOFU / MOFU → always ABO (still building audience, need per-set control)
  if (strategy_type === 'TOFU') {
    return { mode: 'ABO', reason: 'Estrategia TOFU (audiencia fría) → ABO para control por conjunto' }
  }
  if (strategy_type === 'MOFU') {
    return { mode: 'ABO', reason: 'Estrategia MOFU (consideración) → ABO para control por audiencia' }
  }

  // No pixel + conversion objective → ABO (will fall back to LINK_CLICKS anyway)
  if ((objective === 'OUTCOME_SALES' || objective === 'OUTCOME_LEADS') && !has_pixel) {
    return { mode: 'ABO', reason: 'Sin Pixel configurado → ABO con fallback a LINK_CLICKS' }
  }

  // Default: ABO for predictability and debuggability
  return { mode: 'ABO', reason: 'Configuración estándar → ABO para control granular de presupuesto' }
}

// ── Pre-publish Validation ────────────────────────────────────────────────────

export interface ValidationWarning {
  level: 'error' | 'warning'
  message: string
}

/**
 * Validates the campaign payload before sending to Meta Ads API.
 * Returns an array of warnings/errors to log or surface to the user.
 */
export function validateBeforePublish(params: {
  objective: string
  ad_sets: Array<{
    name: string
    ads: Array<{ name: string; headline?: string; primary_text?: string; call_to_action?: string }>
  }>
  has_pixel: boolean
  link_url: string
  mode: BudgetMode
}): ValidationWarning[] {
  const warnings: ValidationWarning[] = []
  const { objective, ad_sets, has_pixel, link_url, mode } = params

  if (!link_url || link_url === 'https://example.com') {
    warnings.push({
      level: 'warning',
      message: 'URL de destino no configurada — los anuncios usarán una URL de ejemplo',
    })
  }

  if ((objective === 'OUTCOME_SALES') && !has_pixel) {
    warnings.push({
      level: 'warning',
      message: 'Objetivo OUTCOME_SALES sin Pixel de Meta — se optimizará por LINK_CLICKS en su lugar',
    })
  }

  if (mode === 'CBO' && !has_pixel) {
    warnings.push({
      level: 'warning',
      message: 'Modo CBO seleccionado sin Pixel — considera usar ABO para más control',
    })
  }

  for (const adSet of ad_sets) {
    if (!adSet.ads?.length) {
      warnings.push({ level: 'error', message: `Ad Set "${adSet.name}": sin anuncios` })
      continue
    }
    for (const ad of adSet.ads) {
      if (!ad.headline?.trim()) {
        warnings.push({ level: 'warning', message: `"${ad.name}": headline vacío` })
      }
      if (!ad.primary_text?.trim()) {
        warnings.push({ level: 'warning', message: `"${ad.name}": texto principal vacío` })
      }
    }
  }

  return warnings
}
