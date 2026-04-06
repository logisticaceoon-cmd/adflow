// src/app/api/ai/generate-copies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkCredits, resetCreditsIfNeeded, consumeCredits } from '@/lib/credits'
import { ACTION_COSTS } from '@/lib/credit-costs'
import type { StrategyType } from '@/types'

const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type SupportedImageType = typeof SUPPORTED_IMAGE_TYPES[number]

function objectiveToStrategy(objective: string): StrategyType {
  if (['OUTCOME_SALES', 'CONVERSIONS'].includes(objective)) return 'BOFU'
  if (['OUTCOME_LEADS', 'OUTCOME_ENGAGEMENT', 'LEAD_GENERATION'].includes(objective)) return 'MOFU'
  return 'TOFU'
}

const STRATEGY_CONFIG = {
  TOFU: {
    label: 'Top of Funnel — Reconocimiento',
    structure: `2 conjuntos de anuncios:
    - Ad Set 1 "Audiencia Amplia": audience_type "broad", advantage_plus DEBE ser true. NO pongas intereses (interests: []). Solo geo, edad y género. Dejar que Meta optimice con Advantage+.
    - Ad Set 2 "Intereses Específicos": audience_type "interest", advantage_plus false. OBLIGATORIO: incluir 5-10 intereses REALES de Meta Business Manager (nombres exactos como aparecen en la plataforma) en el array "interests". Cada uno con shape {"name": "Nombre exacto del interés"}. Ejemplos válidos: "Emprendimiento", "Marketing digital", "Facebook for Business", "Shopify", "Mercado Libre", "Comercio electrónico", "Pequeña empresa", "Negocios desde casa", "Marketing en línea", "Publicidad en línea". Adaptá los nombres al producto/nicho del cliente.
    3 ads por conjunto con ángulos: emocional, informativo, social_proof`,
  },
  MOFU: {
    label: 'Middle of Funnel — Consideración',
    structure: `2 conjuntos de anuncios:
    - Ad Set 1 "Retargeting Web": audience_type "retargeting". IMPORTANTE: incluir nota que requiere Pixel de Meta instalado. optimization_goal: LINK_CLICKS o LEAD_GENERATION.
    - Ad Set 2 "Lookalike 1%": audience_type "lookalike". IMPORTANTE: incluir nota que requiere audiencia fuente mínima de 100 personas. optimization_goal: LINK_CLICKS.
    3 ads por conjunto con ángulos: social_proof, urgencia, informativo`,
  },
  BOFU: {
    label: 'Bottom of Funnel — Conversión',
    structure: `3 conjuntos de anuncios:
    - Ad Set 1 "Retargeting Caliente": audience_type "retargeting". Carrito abandonado + vistas de producto últimos 7 días. Requiere Pixel. optimization_goal: OFFSITE_CONVERSIONS.
    - Ad Set 2 "Retargeting Tibio": audience_type "retargeting". Visitantes web últimos 14-30 días. Requiere Pixel. optimization_goal: OFFSITE_CONVERSIONS.
    - Ad Set 3 "Lookalike Compradores": audience_type "lookalike". Similar a compradores existentes. Requiere audiencia fuente. optimization_goal: OFFSITE_CONVERSIONS.
    3 ads por conjunto con ángulos: urgencia, social_proof, emocional`,
  },
}

interface PixelContext {
  level: number
  levelName: string
  canRetargetViewContent: boolean
  canRetargetAddToCart: boolean
  canRetargetPurchase: boolean
  canCreateLookalike: boolean
}

function buildPrompt(
  strategyType: StrategyType,
  productDescription: string,
  dailyBudget: number,
  targetCountry: string,
  targetAudience?: string,
  existingCopy?: string,
  videoName?: string,
  businessType?: string,
  advertisingStatus?: string,
  mainObjective?: string,
  monthlyBudget?: string,
  currentRoas?: string,
  currency = 'USD',
  destinationUrl?: string,
  whatsappNumber?: string,
  pixelCtx?: PixelContext,
): string {
  const cfg = STRATEGY_CONFIG[strategyType]
  const budgetCents = dailyBudget * 100
  const numAdSets   = strategyType === 'BOFU' ? 3 : 2
  const budgetPerSet = Math.floor(budgetCents / numAdSets)

  const geoMap: Record<string, string> = {
    argentina: 'AR', 'buenos aires': 'AR',
    méxico: 'MX', mexico: 'MX',
    colombia: 'CO', chile: 'CL', perú: 'PE', peru: 'PE',
    españa: 'ES', spain: 'ES',
    'estados unidos': 'US', usa: 'US', 'united states': 'US',
    brasil: 'BR', brazil: 'BR',
    uruguay: 'UY', paraguay: 'PY', bolivia: 'BO', ecuador: 'EC',
    venezuela: 'VE', 'costa rica': 'CR', panamá: 'PA', panama: 'PA',
  }
  const countryCode = geoMap[targetCountry.toLowerCase()] || targetCountry.toUpperCase().slice(0, 2)

  // Determine the link URL for CTA context
  let linkContext = ''
  if (destinationUrl) {
    linkContext = `- URL de destino de los anuncios: ${destinationUrl}`
  } else if (whatsappNumber) {
    linkContext = `- Canal de contacto: WhatsApp ${whatsappNumber} (los CTAs deben llevar a WhatsApp)`
  }

  // CTA guidance based on objective
  let ctaGuidance = ''
  if (mainObjective === 'whatsapp' || whatsappNumber) {
    ctaGuidance = 'Los botones CTA deben ser "Enviar mensaje", "Escribir por WhatsApp" o similar. cta_type: "WHATSAPP_MESSAGE" o "MESSAGE_PAGE".'
  } else if (mainObjective === 'sales' || businessType === 'ecommerce') {
    ctaGuidance = 'Los CTAs deben ser de compra directa: "Comprar ahora", "Ver precio", "Obtener descuento". cta_type: "SHOP_NOW" o "GET_OFFER".'
  } else if (mainObjective === 'leads') {
    ctaGuidance = 'Los CTAs deben capturar leads: "Solicitar info", "Quiero saber más", "Registrarme". cta_type: "GET_QUOTE" o "SIGN_UP".'
  }

  // Pixel context block — tells the AI what audience types are realistically possible
  const pixelBlock = pixelCtx ? `
CAPACIDAD DEL PIXEL DEL CLIENTE (CRÍTICO — RESPETAR ESTAS LIMITACIONES):
- Nivel del pixel: ${pixelCtx.level} (${pixelCtx.levelName})
- Puede hacer retargeting de visitantes (ViewContent): ${pixelCtx.canRetargetViewContent ? 'SÍ' : 'NO'}
- Puede hacer retargeting de carrito (AddToCart): ${pixelCtx.canRetargetAddToCart ? 'SÍ' : 'NO'}
- Puede hacer retargeting de compradores (Purchase): ${pixelCtx.canRetargetPurchase ? 'SÍ' : 'NO'}
- Puede crear Lookalikes (necesita 100+ compras): ${pixelCtx.canCreateLookalike ? 'SÍ' : 'NO'}

REGLAS DE AUDIENCIA OBLIGATORIAS SEGÚN EL PIXEL:
${!pixelCtx.canRetargetViewContent ? '- NO generes ad sets con audience_type "retargeting" (el pixel no tiene datos suficientes). Usá "broad" o "interest" en su lugar.' : ''}
${!pixelCtx.canCreateLookalike ? '- NO generes ad sets con audience_type "lookalike" (el pixel no tiene 100+ compras). Usá "interest" en su lugar.' : ''}
${!pixelCtx.canRetargetAddToCart ? '- NO menciones retargeting de carrito abandonado en los nombres de ad sets.' : ''}
${pixelCtx.level < 3 ? '- El pixel está vacío. TODOS los ad sets deben ser "broad" o "interest" — generá nombres descriptivos basados en audiencias frías y comportamientos, NO en eventos del pixel.' : ''}
` : ''

  return `Sos el mejor estratega de Meta Ads del mundo hispanohablante, con experiencia en más de 500 negocios de Latinoamérica y España.
${pixelBlock}
CONTEXTO DEL NEGOCIO:
- Descripción: ${productDescription}
- Tipo de negocio: ${businessType || 'No especificado'}
- Situación publicitaria: ${advertisingStatus || 'No especificado'}
- Objetivo principal: ${mainObjective || 'No especificado'}
- Inversión mensual estimada: ${monthlyBudget || 'No especificada'}
- ROAS/CPL actual: ${currentRoas || 'Primera vez / No disponible'}
- País/Ciudad: ${targetCountry} (código: ${countryCode})
- Presupuesto diario: $${dailyBudget} ${currency} (${budgetCents} centavos)
- Moneda: ${currency}
- Fase recomendada: ${strategyType} — ${cfg.label}
${linkContext}
${targetAudience ? `- Audiencia indicada: ${targetAudience}` : ''}
${existingCopy ? `- Copy de referencia del cliente: ${existingCopy}` : ''}
${videoName ? `- Video del producto disponible: "${videoName}" (no tengo acceso al video pero el cliente lo tiene)` : ''}

REGLAS ABSOLUTAS:
1. Solo usar intereses que EXISTEN EXACTAMENTE en Meta Ads Business Manager 2024-2025
2. Los intereses deben ser nombres de páginas reales, comportamientos verificados o categorías oficiales de Meta
3. Presupuestos en centavos de ${currency}
4. Copies adaptados al dialecto de ${targetCountry}
5. Nunca prometer resultados que Meta no puede garantizar
6. Mejores prácticas Meta Ads 2025: máximo 3-5 intereses por ad set, usar Advantage+ en TOFU, Creative Diversity
7. ${ctaGuidance || 'Usar CTAs apropiados para el objetivo del negocio'}

ESTRUCTURA A GENERAR (${strategyType}):
${cfg.structure}

REGLAS DE COPY:
- Headlines: MÁXIMO 40 caracteres (impactante, con emoji opcional)
- Textos principales: MÁXIMO 125 caracteres (persuasivo, con 1-2 emojis naturales)
- Descripciones: MÁXIMO 30 caracteres
- Copy en el idioma/dialecto de ${targetCountry}
${destinationUrl ? `- Incluir referencias a ${new URL(destinationUrl).hostname} en copies donde sea natural` : ''}

Respondé ÚNICAMENTE con JSON válido, sin texto extra, sin backticks, sin markdown.

{
  "diagnosis": {
    "business_phase": "descripción de en qué fase está el negocio",
    "main_challenge": "desafío principal identificado para este negocio",
    "opportunity": "oportunidad clave detectada"
  },
  "strategy_type": "${strategyType}",
  "recommended_budget": ${dailyBudget},
  "budget_justification": "explicación breve de por qué este presupuesto es adecuado para ${targetCountry}",
  "estimated_results": {
    "daily_reach": "X-Y personas",
    "daily_clicks": "X-Y clics",
    "daily_conversions": "X-Y leads/ventas (o N/A para TOFU puro)",
    "estimated_cpm": "$X-Y ${currency}",
    "estimated_cpa": "$X-Y ${currency} (o N/A para TOFU)",
    "estimated_roas": "Xx-Xx (solo BOFU, si no aplica poner N/A)"
  },
  "campaign": {
    "name": "nombre descriptivo de la campaña (${strategyType} — tipo de negocio)",
    "objective": "OUTCOME_AWARENESS|OUTCOME_TRAFFIC|OUTCOME_ENGAGEMENT|OUTCOME_LEADS|OUTCOME_SALES",
    "ad_sets": [
      {
        "name": "nombre descriptivo del conjunto",
        "audience_type": "broad|interest|retargeting|lookalike",
        "targeting": {
          "age_min": 18,
          "age_max": 65,
          "genders": [0],
          "geo_locations": { "countries": ["${countryCode}"] },
          "interests": [],
          "advantage_plus": false,
          "publisher_platforms": ["facebook", "instagram"],
          "facebook_positions": ["feed", "story", "facebook_reels"],
          "instagram_positions": ["stream", "story", "reels"]
        },
        "optimization_goal": "REACH|LINK_CLICKS|LEAD_GENERATION|OFFSITE_CONVERSIONS|MESSAGES|IMPRESSIONS",
        "billing_event": "IMPRESSIONS",
        "daily_budget": ${budgetPerSet},
        "requires_pixel": false,
        "pixel_note": "",
        "ads": [
          {
            "name": "Ad — Ángulo 1",
            "copy_angle": "emocional|informativo|urgencia|social_proof",
            "headline": "máx 40 chars impactante",
            "primary_text": "máx 125 chars persuasivo con emoji natural",
            "description": "máx 30 chars",
            "call_to_action": "Texto del botón en español",
            "cta_type": "LEARN_MORE|SHOP_NOW|CONTACT_US|GET_QUOTE|SUBSCRIBE|MESSAGE_PAGE|SEND_MESSAGE|WHATSAPP_MESSAGE",
            "creative_suggestion": "descripción de qué imagen/video usar para este anuncio específico"
          }
        ]
      }
    ]
  },
  "headlines": ["headline del ad 1", "headline del ad 2", "headline del ad 3"],
  "primary_texts": ["texto del ad 1", "texto del ad 2", "texto del ad 3"],
  "description": "descripción principal máx 30 chars",
  "call_to_action": "CTA principal en español",
  "cta_type": "LEARN_MORE",
  "targeting": {
    "age_min": 18,
    "age_max": 65,
    "gender": "all",
    "interests": [{ "category": "Comportamientos", "interest": "Nombre Real en Meta" }],
    "geo": "${targetCountry}"
  },
  "recommended_placements": ["Facebook Feed", "Instagram Feed", "Instagram Reels"],
  "recommended_schedule": "descripción del mejor horario para ${targetCountry}",
  "budget_tip": "consejo específico sobre qué esperar con $${dailyBudget}/día en ${targetCountry}",
  "tone": "profesional",
  "pixel_warning": ${strategyType !== 'TOFU' ? '"⚠️ Esta estrategia requiere Pixel de Meta instalado en tu sitio web. Si no lo tenés, recomendamos comenzar con TOFU + Advantage+"' : 'null'},
  "additional_recommendations": [
    "recomendación accionable 1 específica",
    "recomendación accionable 2",
    "recomendación accionable 3"
  ]
}

Generá EXACTAMENTE la estructura ${strategyType}: ${numAdSets} ad sets con 3 ads cada uno. Total: ${numAdSets * 3} anuncios.`
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    let body: any
    try {
      body = await req.json()
    } catch (parseErr: any) {
      console.error('Error parsing request body:', parseErr?.message)
      return NextResponse.json(
        { error: 'Request inválido. Si subiste imágenes, intentá con menos imágenes o contactá soporte.' },
        { status: 400 }
      )
    }

    const {
      product_description,
      strategy_type,
      objective,
      daily_budget,
      target_country,
      existing_copy,
      target_audience,
      image_base64,
      image_media_type,
      image_base64s,
      image_media_types,
      video_name,
      business_type,
      advertising_status,
      main_objective,
      monthly_budget,
      current_roas,
      currency,
      destination_url,
      whatsapp_number,
    } = body

    if (!product_description?.trim()) {
      return NextResponse.json({ error: 'Se requiere descripción del producto' }, { status: 400 })
    }

    const strategyType: StrategyType = strategy_type
      || (objective ? objectiveToStrategy(objective) : 'TOFU')

    // ── Load pixel capabilities (server-side, not from client) ─────────────
    const { data: pa } = await supabase
      .from('pixel_analysis')
      .select('level, level_name, can_retarget_view_content, can_retarget_add_to_cart, can_retarget_purchase, can_create_lookalike')
      .eq('user_id', user.id)
      .maybeSingle()
    const pixelCtx = pa ? {
      level: pa.level ?? 0,
      levelName: pa.level_name ?? 'Sin Data',
      canRetargetViewContent: !!pa.can_retarget_view_content,
      canRetargetAddToCart: !!pa.can_retarget_add_to_cart,
      canRetargetPurchase: !!pa.can_retarget_purchase,
      canCreateLookalike: !!pa.can_create_lookalike,
    } : undefined

    // ── Credits check ──────────────────────────────────────────────────────
    await resetCreditsIfNeeded(user.id)
    const hasCredits = await checkCredits(user.id)
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Sin créditos disponibles. Actualizá tu plan.', code: 'NO_CREDITS', credits_remaining: 0 },
        { status: 403 }
      )
    }

    const promptText = buildPrompt(
      strategyType,
      product_description,
      daily_budget || 10,
      target_country || 'Argentina',
      target_audience,
      existing_copy,
      video_name,
      business_type,
      advertising_status,
      main_objective,
      monthly_budget,
      current_roas,
      currency || 'USD',
      destination_url,
      whatsapp_number,
      pixelCtx,
    )

    // ── Build message content ───────────────────────────────────────────────
    // Only send the FIRST image to Claude (cost + size optimization)
    // Videos are never sent - only the name/type is included in text
    let firstBase64: string | null = null
    let firstMediaType: string | null = null

    if (image_base64s?.length) {
      const mt = image_media_types?.[0] || 'image/jpeg'
      const mt2 = mt === 'image/jpg' ? 'image/jpeg' : mt
      if (SUPPORTED_IMAGE_TYPES.includes(mt2 as SupportedImageType)) {
        firstBase64 = image_base64s[0]
        firstMediaType = mt2
      }
    } else if (image_base64) {
      let mt = image_media_type || 'image/jpeg'
      if (mt === 'image/jpg') mt = 'image/jpeg'
      if (SUPPORTED_IMAGE_TYPES.includes(mt as SupportedImageType)) {
        firstBase64 = image_base64
        firstMediaType = mt
      }
    }

    let messageContent: Anthropic.MessageParam['content']

    if (firstBase64 && firstMediaType) {
      const imageNote = image_base64s?.length > 1
        ? `El cliente subió ${image_base64s.length} imágenes del producto (te muestro la primera para análisis visual). Adaptá el copy considerando que habrá múltiples creativos.`
        : 'Esta es la imagen del producto. Analizala y adaptá el copy según lo que ves (colores, estilo, producto, contexto visual).'

      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: firstMediaType as SupportedImageType,
            data: firstBase64,
          },
        },
        { type: 'text', text: `${imageNote}\n\n${promptText}` },
      ]
    } else {
      messageContent = promptText
    }

    const message = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages:   [{ role: 'user', content: messageContent }],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let copies
    try {
      let clean = responseText.trim()
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim()

      const firstBrace = clean.indexOf('{')
      const lastBrace  = clean.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        clean = clean.slice(firstBrace, lastBrace + 1)
      }

      copies = JSON.parse(clean)
    } catch (parseErr: any) {
      console.error('Claude response parse error:', parseErr?.message)
      console.error('Raw response preview:', responseText.slice(0, 800))
      return NextResponse.json({
        error: 'La IA devolvió una respuesta inesperada. Intentá de nuevo.',
        details: responseText.slice(0, 300),
      }, { status: 500 })
    }

    const { success, creditsRemaining } = await consumeCredits(
      user.id,
      'generate_copies',
      ACTION_COSTS.generate_copies,
      body.campaign_id,
    )

    // Edge case: credits ran out between pre-check and consumption (concurrent requests)
    if (!success) {
      return NextResponse.json(
        { error: 'Sin créditos disponibles. Actualizá tu plan.', code: 'NO_CREDITS', credits_remaining: 0 },
        { status: 403 },
      )
    }

    return NextResponse.json({ copies, credits_remaining: creditsRemaining })

  } catch (error: any) {
    console.error('Error en generate-copies:', error)
    return NextResponse.json({
      error: error.message || String(error),
    }, { status: 500 })
  }
}
