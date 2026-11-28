// src/app/api/ai/generate-copies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { checkCredits, resetCreditsIfNeeded, consumeCredits } from '@/lib/credits'
import { ACTION_COSTS } from '@/lib/credit-costs'
import { checkRateLimit } from '@/lib/rate-limit'
import { validate, generateCopiesSchema } from '@/lib/validations'
import { AI_MODELS } from '@/lib/ai/models'
import { COPYWRITING_SYSTEM_RULES } from '@/lib/ai/copywriting-rules'
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
  // New enriched context fields
  campaignObjective?: string,
  duration?: number,
  businessName?: string,
  communicationTone?: string,
  defaultWhatsappCta?: string,
  fbPageName?: string,
  instagramAccountName?: string,
  imageCount?: number,
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

  // Determine destination and CTA based on campaign_objective (new) or legacy mainObjective
  let linkContext = ''
  let ctaGuidance = ''
  let objectiveLabel = mainObjective || 'No especificado'

  if (campaignObjective === 'sales_whatsapp' || mainObjective === 'whatsapp') {
    objectiveLabel = 'Ventas por WhatsApp'
    linkContext = whatsappNumber
      ? `- Destino: WhatsApp ${whatsappNumber}`
      : '- Destino: WhatsApp del negocio'
    ctaGuidance = `Los botones CTA deben ser "Enviar mensaje" o "Escribir por WhatsApp". cta_type: "WHATSAPP_MESSAGE".${defaultWhatsappCta ? ` Texto sugerido por el cliente: "${defaultWhatsappCta}"` : ''}`
  } else if (campaignObjective === 'instagram_traffic') {
    objectiveLabel = 'Tráfico a Instagram'
    linkContext = instagramAccountName
      ? `- Destino: Perfil de Instagram @${instagramAccountName}`
      : '- Destino: Perfil de Instagram del negocio'
    ctaGuidance = 'Los CTAs deben invitar a conocer más: "Ver perfil", "Conocer más", "Seguinos". cta_type: "LEARN_MORE".'
  } else if (campaignObjective === 'sales_web' || mainObjective === 'sales' || businessType === 'ecommerce') {
    objectiveLabel = 'Ventas por web'
    linkContext = destinationUrl
      ? `- Destino: ${destinationUrl}`
      : '- Destino: Sitio web del negocio'
    ctaGuidance = 'Los CTAs deben ser de compra directa: "Comprar ahora", "Ver precio", "Obtener descuento". cta_type: "SHOP_NOW" o "GET_OFFER".'
  } else if (mainObjective === 'leads') {
    objectiveLabel = 'Generación de leads'
    ctaGuidance = 'Los CTAs deben capturar leads: "Solicitar info", "Quiero saber más". cta_type: "GET_QUOTE" o "SIGN_UP".'
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

  // Tone instruction
  const toneBlock = communicationTone ? `
TONO DE COMUNICACIÓN: Escribí TODOS los copies en tono "${communicationTone}".
${communicationTone === 'profesional' ? '- Formal, datos, autoridad, sin emojis excesivos' : ''}
${communicationTone === 'cercano' ? '- Conversacional, empático, como un amigo que recomienda' : ''}
${communicationTone === 'urgente' ? '- Directo, FOMO, escasez, acción inmediata' : ''}
${communicationTone === 'inspiracional' ? '- Aspiracional, emocional, transformación personal' : ''}
` : ''

  // Image analysis instruction
  const imageBlock = (imageCount && imageCount > 0) ? `
IMÁGENES DEL PRODUCTO:
Se adjuntan ${imageCount} imagen${imageCount > 1 ? 'es' : ''} del producto/servicio. Analizá CADA imagen:
1. Qué producto/servicio se ve
2. Estilo visual (colores, iluminación, composición)
3. Contexto (lifestyle, producto solo, antes/después)

Usá lo que ves para adaptar el copy a lo que realmente muestra la imagen, referenciar detalles visuales en el texto, y sugerir qué imagen usar con cada ángulo de copy en el campo "creative_suggestion".
` : ''

  // Duration context
  const durationContext = duration ? (duration > 0 ? `${duration} días` : 'campaña continua') : 'no especificada'

  return `Sos el mejor estratega de Meta Ads del mundo hispanohablante, con experiencia en más de 500 negocios de Latinoamérica y España.

${COPYWRITING_SYSTEM_RULES}
${pixelBlock}
${businessName ? `MARCA: ${businessName}${fbPageName ? ` (Página: ${fbPageName})` : ''}${instagramAccountName ? ` · @${instagramAccountName}` : ''}` : ''}
${toneBlock}
CONTEXTO DE ESTA CAMPAÑA:
- Promoción: ${productDescription}
- Objetivo: ${objectiveLabel}
- Tipo de negocio: ${businessType || 'No especificado'}
- Situación publicitaria: ${advertisingStatus || 'No especificado'}
- Inversión mensual estimada: ${monthlyBudget || 'No especificada'}
- ROAS/CPL actual: ${currentRoas || 'Primera vez / No disponible'}
- País: ${targetCountry} (código: ${countryCode})
- Presupuesto diario: $${dailyBudget} ${currency} (${budgetCents} centavos)
- Duración: ${durationContext}
- Moneda: ${currency}
- Fase recomendada: ${strategyType} — ${cfg.label}
${linkContext}
${targetAudience ? `- Audiencia indicada: ${targetAudience}` : ''}
${existingCopy ? `- Copy de referencia del cliente: ${existingCopy}` : ''}
${videoName ? `- Video del producto disponible: "${videoName}" (no tengo acceso al video pero el cliente lo tiene)` : ''}
${imageBlock}
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

INSTRUCCIONES FINALES:
- Seguí las reglas de copywriting del sistema al pie de la letra.
- Escribí en el dialecto de ${targetCountry}. Si es Argentina, usá voseo natural.
- Los copies tienen que sonar a persona real, NO a marca. Si al leerlo decís "esto lo escribió una IA", reescribilo.
- El primary_text base ES la versión medium. Las 3 variantes (short/medium/long) van en "variants".
- Cada variante debe funcionar sola como anuncio completo.
${destinationUrl ? `- Podés mencionar ${new URL(destinationUrl).hostname} donde sea natural, sin forzar.` : ''}

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
            "name": "nombre descriptivo del anuncio",
            "copy_angle": "emocional|informativo|urgencia|social_proof",
            "image_analysis": "qué ves en la imagen: producto, texto, persona, emoción, contexto. Escribí los copies basándote en esto.",
            "headline": "frase corta que condensa la promesa. No repite el texto. Con 1 emoji. Máx 40 chars.",
            "primary_text": "copy versión mediana — el que va por defecto. Escribilo como si hablaras con la persona, no como template.",
            "description": "complemento breve de la oferta, máx 30 chars",
            "call_to_action": "texto del botón en español",
            "cta_type": "LEARN_MORE|SHOP_NOW|CONTACT_US|GET_QUOTE|SUBSCRIBE|MESSAGE_PAGE|SEND_MESSAGE|WHATSAPP_MESSAGE",
            "creative_suggestion": "tipo de imagen ideal para este copy (lifestyle, demo, testimonio, etc.)",
            "variants": {
              "medium": {
                "primary_text": "3-4 frases que fluyen natural. Hook + por qué pasa + qué hace el producto. 80-180 chars.",
                "headline": "headline con la promesa condensada"
              },
              "long": {
                "primary_text": "micro-historia o argumento completo. 5-7 frases, 180-350 chars. Que se lea como un mensaje de alguien que ya lo probó.",
                "headline": "headline intrigante que invite a leer"
              }
            }
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

    // Rate limit: la generación con IA es cara; 10/min por usuario (tier 'ai')
    const rl = await checkRateLimit(user.id, 'ai')
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Estás generando demasiado rápido. Esperá unos segundos.', code: 'RATE_LIMITED', retryAfter: rl.retryAfter },
        { status: 429 }
      )
    }

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

    // Validación de payload (evita abuso de costo/memoria y prompt-injection por campos libres)
    const parsed = validate(generateCopiesSchema, body)
    if (parsed.error) {
      return NextResponse.json({ error: `Datos inválidos: ${parsed.error}` }, { status: 400 })
    }
    body = parsed.data!

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
      pixel_data,
      // New enriched context fields
      campaign_objective,
      duration,
      business_name,
      communication_tone,
      default_whatsapp_cta,
      fb_page_name,
      instagram_account_name,
    } = body

    if (!product_description?.trim()) {
      return NextResponse.json({ error: 'Se requiere descripción del producto' }, { status: 400 })
    }

    // Auto-select strategy based on campaign_objective + pixel level
    function autoSelectStrategy(obj: string | undefined, pxLevel: number): StrategyType {
      if (obj === 'instagram_traffic') return 'TOFU'
      if (pxLevel >= 5) return 'BOFU'
      if (pxLevel >= 3) return 'MOFU'
      return 'TOFU'
    }

    const pixelLevelForStrategy = pixel_data?.level ?? 0
    const strategyType: StrategyType = strategy_type
      || (campaign_objective ? autoSelectStrategy(campaign_objective, pixelLevelForStrategy)
        : objective ? objectiveToStrategy(objective) : 'TOFU')

    // ── Pixel capabilities: prefer client-supplied pixel_data, fall back to DB ─
    let pixelCtx: {
      level: number
      levelName: string
      canRetargetViewContent: boolean
      canRetargetAddToCart: boolean
      canRetargetPurchase: boolean
      canCreateLookalike: boolean
    } | undefined

    if (pixel_data && typeof pixel_data.level === 'number') {
      pixelCtx = {
        level: pixel_data.level,
        levelName: pixel_data.levelName ?? 'Sin Data',
        canRetargetViewContent: !!pixel_data.canRetargetViewContent,
        canRetargetAddToCart: !!pixel_data.canRetargetAddToCart,
        canRetargetPurchase: !!pixel_data.canRetargetPurchase,
        canCreateLookalike: !!pixel_data.canCreateLookalike,
      }
    } else {
      const { data: pa } = await supabase
        .from('pixel_analysis')
        .select('level, level_name, can_retarget_view_content, can_retarget_add_to_cart, can_retarget_purchase, can_create_lookalike')
        .eq('user_id', user.id)
        .maybeSingle()
      if (pa) {
        pixelCtx = {
          level: pa.level ?? 0,
          levelName: pa.level_name ?? 'Sin Data',
          canRetargetViewContent: !!pa.can_retarget_view_content,
          canRetargetAddToCart: !!pa.can_retarget_add_to_cart,
          canRetargetPurchase: !!pa.can_retarget_purchase,
          canCreateLookalike: !!pa.can_create_lookalike,
        }
      }
    }

    // ── Credits check ──────────────────────────────────────────────────────
    await resetCreditsIfNeeded(user.id)
    const hasCredits = await checkCredits(user.id)
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Sin créditos disponibles. Actualizá tu plan.', code: 'NO_CREDITS', credits_remaining: 0 },
        { status: 403 }
      )
    }

    // Count valid images for prompt context
    const allBase64s = image_base64s?.length ? image_base64s : (image_base64 ? [image_base64] : [])
    const allMediaTypes = image_media_types?.length ? image_media_types : (image_media_type ? [image_media_type] : [])
    const validImageCount = allBase64s.filter(Boolean).length

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
      // New enriched context fields
      campaign_objective,
      duration,
      business_name,
      communication_tone,
      default_whatsapp_cta,
      fb_page_name,
      instagram_account_name,
      validImageCount,
    )

    // ── Build message content ───────────────────────────────────────────────
    // Send up to 5 images to Claude for visual analysis
    // Videos are never sent - only the name/type is included in text
    const imageBlocks: Anthropic.ImageBlockParam[] = []
    const maxImages = 5

    for (let i = 0; i < Math.min(allBase64s.length, maxImages); i++) {
      const b64 = allBase64s[i]
      if (!b64) continue
      let mt = (allMediaTypes[i] || 'image/jpeg')
      if (mt === 'image/jpg') mt = 'image/jpeg'
      if (SUPPORTED_IMAGE_TYPES.includes(mt as SupportedImageType)) {
        imageBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: mt as SupportedImageType, data: b64 },
        })
      }
    }

    let messageContent: Anthropic.MessageParam['content']

    if (imageBlocks.length > 0) {
      messageContent = [
        ...imageBlocks,
        { type: 'text', text: promptText },
      ]
    } else {
      messageContent = promptText
    }

    const message = await anthropic.messages.create({
      model:      AI_MODELS.fast,
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
