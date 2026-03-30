// src/app/api/facebook/publish-campaign/route.ts
// Publishes a full Meta Ads campaign structure: Campaign → Ad Sets → Ad Creatives → Ads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AdSetItem, AdCopyItem, CampaignStructure } from '@/types'

const GRAPH = 'https://graph.facebook.com/v20.0'

// ── Valid Meta placement whitelists ───────────────────────────────────────
const VALID_PUBLISHER_PLATFORMS = new Set([
  'facebook', 'instagram', 'audience_network', 'messenger',
])
const VALID_FACEBOOK_POSITIONS = new Set([
  'feed', 'right_hand_column', 'marketplace', 'video_feeds',
  'story', 'search', 'groups_feed', 'profile_feed',
  'facebook_reels', 'instream_video', 'instant_article',
])
const VALID_INSTAGRAM_POSITIONS = new Set([
  'stream', 'story', 'explore', 'explore_home', 'reels',
  'profile_feed', 'ig_search', 'profile_reels',
])

const FB_POSITION_RENAMES: Record<string, string> = {
  reels: 'facebook_reels',
  reels_overlay: 'facebook_reels',
  reel: 'facebook_reels',
}

function sanitizePlacements(t: {
  publisher_platforms?: string[]
  facebook_positions?: string[]
  instagram_positions?: string[]
}): {
  publisher_platforms?: string[]
  facebook_positions?: string[]
  instagram_positions?: string[]
} | null {
  if (!t.publisher_platforms?.length) return null
  const platforms = t.publisher_platforms.filter(p => VALID_PUBLISHER_PLATFORMS.has(p))
  if (!platforms.length) return null
  const result: { publisher_platforms?: string[]; facebook_positions?: string[]; instagram_positions?: string[] } = { publisher_platforms: platforms }
  if (t.facebook_positions?.length) {
    const fbPos = t.facebook_positions.map(p => FB_POSITION_RENAMES[p] ?? p).filter(p => VALID_FACEBOOK_POSITIONS.has(p))
    if (fbPos.length) result.facebook_positions = fbPos
  }
  if (t.instagram_positions?.length) {
    const igPos = t.instagram_positions.filter(p => VALID_INSTAGRAM_POSITIONS.has(p))
    if (igPos.length) result.instagram_positions = igPos
  }
  return result
}

// ── Country name → ISO 2-letter code ──────────────────────────────────────
const COUNTRY_MAP: Record<string, string> = {
  argentina: 'AR', méxico: 'MX', mexico: 'MX', chile: 'CL',
  colombia: 'CO', perú: 'PE', peru: 'PE', venezuela: 'VE',
  ecuador: 'EC', bolivia: 'BO', uruguay: 'UY', paraguay: 'PY',
  brasil: 'BR', brazil: 'BR', españa: 'ES', spain: 'ES',
  'estados unidos': 'US', usa: 'US', 'united states': 'US',
  'costa rica': 'CR', guatemala: 'GT', honduras: 'HN', 'el salvador': 'SV',
  nicaragua: 'NI', panamá: 'PA', panama: 'PA', cuba: 'CU',
  'república dominicana': 'DO', 'dominican republic': 'DO',
  'puerto rico': 'PR',
}

function toCountryCode(s: string): string {
  const lower = s.toLowerCase().trim()
  if (COUNTRY_MAP[lower]) return COUNTRY_MAP[lower]
  if (/^[a-z]{2}$/i.test(s)) return s.toUpperCase()
  return s.toUpperCase().slice(0, 2)
}

// ── CTA label → Meta CTA type ──────────────────────────────────────────────
const CTA_MAP: Record<string, string> = {
  'comprar ahora': 'SHOP_NOW', comprar: 'SHOP_NOW', compra: 'SHOP_NOW', 'shop now': 'SHOP_NOW',
  'finalizar compra': 'SHOP_NOW', 'completar compra': 'SHOP_NOW', 'completa tu compra': 'SHOP_NOW',
  'agregar al carrito': 'SHOP_NOW', 'añadir al carrito': 'SHOP_NOW',
  'ver en la tienda': 'SHOP_NOW', 'ir a la tienda': 'SHOP_NOW', 'visitar tienda': 'SHOP_NOW',
  'ver producto': 'SHOP_NOW', 'ver productos': 'SHOP_NOW',
  'proteger ahora': 'SHOP_NOW', 'pedir ahora': 'SHOP_NOW', 'ordenar ahora': 'SHOP_NOW',
  'más información': 'LEARN_MORE', 'mas informacion': 'LEARN_MORE', 'más info': 'LEARN_MORE', 'learn more': 'LEARN_MORE',
  'saber más': 'LEARN_MORE', 'conocer más': 'LEARN_MORE', 'conocé más': 'LEARN_MORE',
  contactar: 'CONTACT_US', contactarnos: 'CONTACT_US', 'contact us': 'CONTACT_US',
  'enviar mensaje': 'MESSAGE_PAGE', mensaje: 'MESSAGE_PAGE',
  whatsapp: 'WHATSAPP_MESSAGE', escribinos: 'WHATSAPP_MESSAGE',
  registrarse: 'SIGN_UP', registrarme: 'SIGN_UP', registrarte: 'SIGN_UP', 'sign up': 'SIGN_UP',
  'obtener oferta': 'GET_OFFER', 'get offer': 'GET_OFFER', 'ver oferta': 'GET_OFFER',
  'ver más': 'SEE_MORE', 'see more': 'SEE_MORE',
  descargar: 'DOWNLOAD', download: 'DOWNLOAD',
  reservar: 'BOOK_TRAVEL', 'reservar ahora': 'BOOK_TRAVEL',
  solicitar: 'APPLY_NOW', 'solicitar ahora': 'APPLY_NOW', aplicar: 'APPLY_NOW',
  suscribirse: 'SUBSCRIBE', suscribirme: 'SUBSCRIBE', subscribe: 'SUBSCRIBE',
}

function toCTAType(label: string, ctaType?: string, objective?: string): string {
  if (ctaType && /^[A-Z_]+$/.test(ctaType)) return ctaType
  const lower = (label || '').toLowerCase()
  for (const [key, val] of Object.entries(CTA_MAP)) {
    if (lower.includes(key)) return val
  }
  if (objective === 'OUTCOME_SALES' || objective === 'CONVERSIONS') return 'SHOP_NOW'
  if (objective === 'OUTCOME_LEADS' || objective === 'LEAD_GENERATION') return 'SIGN_UP'
  return 'LEARN_MORE'
}

// ── Resolve optimization_goal + promoted_object from campaign objective ────
function resolveOptGoalForObjective(
  campaignObjective: string,
  pixelId: string | null,
): { optimization_goal: string; promoted_object: Record<string, unknown> | null } {
  switch (campaignObjective) {
    case 'OUTCOME_AWARENESS':
    case 'REACH':
      return { optimization_goal: 'REACH', promoted_object: null }
    case 'OUTCOME_TRAFFIC':
    case 'TRAFFIC':
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_ENGAGEMENT':
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_LEADS':
    case 'LEAD_GENERATION':
      if (pixelId) return { optimization_goal: 'LEAD_GENERATION', promoted_object: { pixel_id: pixelId, custom_event_type: 'LEAD' } }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      if (pixelId) return { optimization_goal: 'OFFSITE_CONVERSIONS', promoted_object: { pixel_id: pixelId, custom_event_type: 'PURCHASE' } }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
    default:
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
  }
}

// ── Graph API helpers ────────────────────────────────────────────────────────
async function graphPost(path: string, token: string, body: Record<string, unknown>) {
  console.log(`[publish-campaign] POST ${path}`, JSON.stringify(body, null, 2))
  const res = await fetch(`${GRAPH}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, access_token: token }),
  })
  const data = await res.json()
  if (data.error) {
    console.error(`[publish-campaign] Meta API error on ${path}:`, JSON.stringify(data.error))
    const parts: string[] = []
    if (data.error.error_user_msg) parts.push(data.error.error_user_msg)
    else if (data.error.message) parts.push(data.error.message)
    if (data.error.error_subcode) parts.push(`(subcode: ${data.error.error_subcode})`)
    if (data.error.fbtrace_id) parts.push(`[trace: ${data.error.fbtrace_id}]`)
    throw new Error(parts.join(' ') || JSON.stringify(data.error))
  }
  return data
}

async function uploadImageToMeta(adAccountId: string, token: string, imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${adAccountId}/adimages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: imageUrl, access_token: token }),
    })
    const data = await res.json()
    if (data.error) { console.warn(`[publish-campaign] Image upload failed:`, data.error.message); return null }
    const images = data.images || {}
    const first = Object.values(images)[0] as any
    return first?.hash ?? null
  } catch (err: any) {
    console.warn(`[publish-campaign] Image upload exception:`, err.message)
    return null
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const campaign_id: string | undefined = body?.campaign_id
  if (!campaign_id) return NextResponse.json({ error: 'campaign_id requerido' }, { status: 400 })

  // ── Load campaign ────────────────────────────────────────────────────────
  const { data: campaign, error: campaignErr } = await supabase
    .from('campaigns').select('*').eq('id', campaign_id).eq('user_id', user.id).single()
  if (campaignErr || !campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

  // ── Load business profile ────────────────────────────────────────────────
  const { data: biz } = await supabase
    .from('business_profiles')
    .select('selected_ad_account_id, fb_page_id, pixel_id, instagram_account_id, website_url, whatsapp_number')
    .eq('user_id', user.id).maybeSingle()

  const adAccountId = biz?.selected_ad_account_id
  const pageId = biz?.fb_page_id
  if (!adAccountId) return NextResponse.json({ error: 'No tenés una cuenta publicitaria configurada. Andá a Configuración → Activos de Meta.', code: 'NO_AD_ACCOUNT' }, { status: 400 })
  if (!pageId) return NextResponse.json({ error: 'No tenés una página de Facebook configurada. Andá a Configuración → Activos de Meta.', code: 'NO_PAGE' }, { status: 400 })

  // ── Load Facebook access token ───────────────────────────────────────────
  const { data: conn } = await supabase
    .from('facebook_connections').select('access_token, token_expires_at').eq('user_id', user.id).maybeSingle()
  if (!conn?.access_token) return NextResponse.json({ error: 'Facebook no está conectado. Conectá tu cuenta en Configuración.', code: 'NO_FB_TOKEN' }, { status: 400 })
  const token = conn.access_token

  // ── Verify token has permissions on the selected ad account ─────────────
  try {
    const verifyRes = await fetch(`${GRAPH}/${adAccountId}?fields=name,account_status,currency&access_token=${token}`)
    const verifyData = await verifyRes.json()
    if (verifyData.error) {
      console.error('[publish-campaign] Token verification failed:', JSON.stringify(verifyData.error))
      const errCode = verifyData.error.code
      const errMsg = errCode === 190
        ? 'El token de Facebook expiró o no es válido. Reconectá tu cuenta de Facebook en Configuración.'
        : errCode === 10 || errCode === 200 || errCode === 275
          ? `Tu token de Facebook no tiene permisos sobre la cuenta publicitaria ${adAccountId}. Reconectá Facebook en Configuración y asegurate de dar acceso a esa cuenta.`
          : `Error al verificar permisos de Facebook: ${verifyData.error.message}`
      return NextResponse.json({ error: errMsg, code: 'TOKEN_INVALID' }, { status: 400 })
    }
    console.log('[publish-campaign] ✓ Token verified for ad account:', verifyData.name, '| currency:', verifyData.currency, '| status:', verifyData.account_status)
  } catch (err: any) {
    console.error('[publish-campaign] Token verification exception:', err.message)
  }

  // ── Resolve campaign structure ────────────────────────────────────────────
  const rawStructure: CampaignStructure | null =
    campaign.campaign_structure || (campaign.ai_copies as any)?.campaign || null
  const structure = rawStructure?.ad_sets?.length ? rawStructure : null
  if (!structure) return NextResponse.json({ error: 'La campaña no tiene estructura de anuncios. Generá los copies con IA antes de publicar.', code: 'NO_STRUCTURE' }, { status: 400 })

  // ── Link URL ──────────────────────────────────────────────────────────────
  let linkUrl = campaign.destination_url?.trim() || ''
  if (!linkUrl && campaign.whatsapp_number) linkUrl = `https://wa.me/${campaign.whatsapp_number.replace(/\D/g, '')}`
  if (!linkUrl) linkUrl = biz?.website_url?.trim() || ''
  if (!linkUrl && biz?.whatsapp_number) linkUrl = `https://wa.me/${biz.whatsapp_number.replace(/\D/g, '')}`
  if (!linkUrl) linkUrl = 'https://example.com'

  const pixelId = biz?.pixel_id || null
  const creativeUrls: string[] = (campaign.creative_urls as string[]) || []

  // ── Pre-upload images to Meta ───────────────────────────────────────────
  const imageHashCache: Record<string, string | null> = {}
  for (const url of creativeUrls) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      imageHashCache[url] = await uploadImageToMeta(adAccountId, token, url)
    }
  }

  // ── Meta Ads API publishing ───────────────────────────────────────────────
  try {
    const campaignObjective = structure.objective || campaign.objective || 'OUTCOME_AWARENESS'
    const numAdSets = structure.ad_sets.length

    // Budget: campaign.daily_budget is in user currency, Meta wants cents
    const perAdSetCents = Math.max(Math.round((campaign.daily_budget / numAdSets) * 100), 100)
    const startTimeISO = new Date().toISOString()

    console.log('[publish-campaign] ===== STARTING PUBLISH =====')
    console.log('[publish-campaign]', JSON.stringify({
      adAccountId, pageId, pixelId, linkUrl, campaignObjective,
      numAdSets, perAdSetCents, strategy: campaign.strategy_type,
      images: creativeUrls.length,
      adsets: structure.ad_sets.map((s: any) => ({ name: s.name, ads: s.ads?.length })),
    }))

    // ══════════════════════════════════════════════════════════════════════
    // 1. CREATE CAMPAIGN
    //    - ABO mode: each ad set has its own daily_budget
    //    - is_adset_budget_sharing_enabled: false tells Meta this is ABO
    //    - NO bid_strategy here (it's not a campaign-level field for ABO)
    // ══════════════════════════════════════════════════════════════════════
    const metaCampaign = await graphPost(`/${adAccountId}/campaigns`, token, {
      name:                            structure.name || campaign.name,
      objective:                       campaignObjective,
      status:                          'PAUSED',
      special_ad_categories:           [],
      is_adset_budget_sharing_enabled: false,
    })
    const metaCampaignId: string = metaCampaign.id
    console.log('[publish-campaign] ✓ Campaign created:', metaCampaignId)

    const adSetIds: string[] = []
    const adIds: string[] = []
    const creativeIds: string[] = []
    const errors: string[] = []
    let globalAdIndex = 0

    // Resolve optimization goal once (same for all ad sets)
    const { optimization_goal, promoted_object } = resolveOptGoalForObjective(campaignObjective, pixelId)

    for (let si = 0; si < structure.ad_sets.length; si++) {
      const adSet = structure.ad_sets[si] as AdSetItem

      // ════════════════════════════════════════════════════════════════════
      // 2. BUILD TARGETING
      // ════════════════════════════════════════════════════════════════════
      const t = adSet.targeting || ({} as AdSetItem['targeting'])
      const countries = (t.geo_locations?.countries || [campaign.target_country || 'AR'])
        .map(toCountryCode).filter(Boolean)

      const targetingSpec: Record<string, unknown> = {
        geo_locations: { countries },
        age_min: t.age_min || campaign.target_age_min || 18,
        age_max: t.age_max || campaign.target_age_max || 65,
      }

      // Gender: use form value as source of truth
      const formGender = (campaign.target_gender as string || '').toLowerCase()
      if (formGender === 'female' || formGender === 'femenino' || formGender === 'mujer') {
        targetingSpec.genders = [2]
      } else if (formGender === 'male' || formGender === 'masculino' || formGender === 'hombre') {
        targetingSpec.genders = [1]
      } else if (t.genders?.length && !t.genders.includes(0)) {
        targetingSpec.genders = t.genders
      }
      // If formGender is "all"/empty/etc, omit genders → Meta targets all

      // Only include interests with valid numeric Meta IDs
      const validInterests = (t.interests || []).filter(
        (i: { id?: string }) => i.id && /^\d+$/.test(String(i.id))
      )
      if (validInterests.length) targetingSpec.interests = validInterests

      // Placements
      const placements = sanitizePlacements(t)
      if (placements) {
        targetingSpec.publisher_platforms = placements.publisher_platforms
        if (placements.facebook_positions?.length) targetingSpec.facebook_positions = placements.facebook_positions
        if (placements.instagram_positions?.length) targetingSpec.instagram_positions = placements.instagram_positions
      }

      // ════════════════════════════════════════════════════════════════════
      // 3. CREATE AD SET
      //    Meta API v20 requires bid_strategy on ad sets for ABO mode.
      //    LOWEST_COST_WITHOUT_CAP = Meta optimizes for lowest cost per result.
      // ════════════════════════════════════════════════════════════════════
      const adSetPayload: Record<string, unknown> = {
        name:              adSet.name,
        campaign_id:       metaCampaignId,
        daily_budget:      perAdSetCents,
        billing_event:     'IMPRESSIONS',
        optimization_goal: optimization_goal,
        bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
        targeting:         targetingSpec,
        status:            'PAUSED',
        start_time:        startTimeISO,
      }
      if (promoted_object) adSetPayload.promoted_object = promoted_object

      let adSetId: string
      try {
        const metaAdSet = await graphPost(`/${adAccountId}/adsets`, token, adSetPayload)
        adSetId = metaAdSet.id
        adSetIds.push(adSetId)
        console.log(`[publish-campaign] ✓ Ad set [${si + 1}/${numAdSets}] created: ${adSetId}`)
      } catch (err: any) {
        console.error(`[publish-campaign] ✗ Ad set "${adSet.name}" FAILED:`, err.message)
        errors.push(`Ad set "${adSet.name}": ${err.message}`)
        globalAdIndex += (adSet.ads as AdCopyItem[]).length
        continue
      }

      // ════════════════════════════════════════════════════════════════════
      // 4. CREATE CREATIVES + ADS
      // ════════════════════════════════════════════════════════════════════
      const adsInSet = adSet.ads as AdCopyItem[]
      for (let ai = 0; ai < adsInSet.length; ai++) {
        const ad = adsInSet[ai]
        try {
          const ctaType = toCTAType(ad.call_to_action || '', ad.cta_type, campaignObjective)
          const linkData: Record<string, unknown> = {
            message:     ad.primary_text || 'Conocé más',
            name:        ad.headline || 'Ver ahora',
            description: ad.description || '',
            link:        linkUrl,
            call_to_action: { type: ctaType, value: { link: linkUrl } },
          }

          // Assign image (round-robin)
          if (creativeUrls.length > 0) {
            const imageUrl = creativeUrls[globalAdIndex % creativeUrls.length]
            if (imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
              const hash = imageHashCache[imageUrl]
              if (hash) linkData.image_hash = hash
              else linkData.picture = imageUrl
            }
          }

          const uniqueName = `${adSet.name} | ${ad.name || `Ad ${ai + 1}`}`
          const objectStorySpec: Record<string, unknown> = { page_id: pageId, link_data: linkData }
          if (biz?.instagram_account_id) objectStorySpec.instagram_actor_id = biz.instagram_account_id

          const creative = await graphPost(`/${adAccountId}/adcreatives`, token, {
            name: uniqueName,
            object_story_spec: objectStorySpec,
          })
          creativeIds.push(creative.id)

          const metaAd = await graphPost(`/${adAccountId}/ads`, token, {
            name:        uniqueName,
            campaign_id: metaCampaignId,
            adset_id:    adSetId,
            creative:    { creative_id: creative.id },
            status:      'PAUSED',
          })
          adIds.push(metaAd.id)
          console.log(`[publish-campaign]   ✓ Ad "${uniqueName}" created: ${metaAd.id}`)
        } catch (err: any) {
          console.error(`[publish-campaign]   ✗ Ad "${ad.name}" FAILED:`, err.message)
          errors.push(`"${adSet.name}" → "${ad.name}": ${err.message}`)
        }
        globalAdIndex++
      }
    }

    // ══════════════════════════════════════════════════════════════════════
    // 5. SAVE RESULTS TO DB
    // ══════════════════════════════════════════════════════════════════════
    const isShellOnly = adSetIds.length === 0
    const isPartial = errors.length > 0 && adSetIds.length > 0

    // Save results + errors in metrics JSON for debugging (survives Vercel log truncation)
    await supabase.from('campaigns').update({
      meta_campaign_id:  metaCampaignId,
      meta_adset_ids:    adSetIds,
      meta_ad_ids:       adIds,
      meta_creative_ids: creativeIds,
      meta_status:       isShellOnly ? 'ERROR' : isPartial ? 'PARTIAL' : 'PAUSED',
      status:            isShellOnly ? 'error' : 'active',
      metrics:           { publish_errors: errors, publish_date: new Date().toISOString(), adsets_attempted: numAdSets, adsets_created: adSetIds.length, ads_created: adIds.length },
    }).eq('id', campaign_id)

    console.log('[publish-campaign] ✓ DONE:', { adSets: adSetIds.length, ads: adIds.length, errors: errors.length })

    const totalCents = perAdSetCents * numAdSets
    return NextResponse.json({
      success:          !isShellOnly,
      partial:          isPartial,
      meta_campaign_id: metaCampaignId,
      ad_set_ids:       adSetIds,
      ad_ids:           adIds,
      creative_ids:     creativeIds,
      partial_errors:   errors.length ? errors : undefined,
      summary: {
        campaign_name:   structure.name || campaign.name,
        ad_sets_created: adSetIds.length,
        ads_created:     adIds.length,
        total_budget_day: `$${(totalCents / 100).toFixed(2)}/día`,
        targeting:       structure.ad_sets.flatMap((s: AdSetItem) => s.targeting?.geo_locations?.countries || [campaign.target_country || 'AR']).map(toCountryCode).filter((v, i, a) => a.indexOf(v) === i).join(', '),
        status:          'PAUSED — activá desde Meta Ads Manager',
        meta_url:        `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`,
      },
    })
  } catch (err: any) {
    console.error('[publish-campaign] Fatal error:', err)
    await supabase.from('campaigns').update({ meta_status: 'ERROR', status: 'error' }).eq('id', campaign_id)
    return NextResponse.json({ error: err.message || 'Error al publicar en Meta Ads', code: 'META_API_ERROR' }, { status: 500 })
  }
}
