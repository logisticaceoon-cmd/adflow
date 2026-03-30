// src/app/api/facebook/publish-campaign/route.ts
// Publishes a full Meta Ads campaign structure: Campaign → Ad Sets → Ad Creatives → Ads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AdSetItem, AdCopyItem, CampaignStructure } from '@/types'
import { decideBudgetMode, validateBeforePublish } from '@/lib/strategy-engine'

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

  const result: ReturnType<typeof sanitizePlacements> = { publisher_platforms: platforms }

  if (t.facebook_positions?.length) {
    const fbPos = t.facebook_positions
      .map(p => FB_POSITION_RENAMES[p] ?? p)
      .filter(p => VALID_FACEBOOK_POSITIONS.has(p))
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
  whatsapp: 'WHATSAPP_MESSAGE', 'escribinos': 'WHATSAPP_MESSAGE',
  registrarse: 'SIGN_UP', registrarme: 'SIGN_UP', registrarte: 'SIGN_UP', 'sign up': 'SIGN_UP',
  'obtener oferta': 'GET_OFFER', 'get offer': 'GET_OFFER', 'ver oferta': 'GET_OFFER',
  'ver más': 'SEE_MORE', 'see more': 'SEE_MORE',
  descargar: 'DOWNLOAD', download: 'DOWNLOAD',
  reservar: 'BOOK_TRAVEL', 'reservar ahora': 'BOOK_TRAVEL',
  solicitar: 'APPLY_NOW', 'solicitar ahora': 'APPLY_NOW', aplicar: 'APPLY_NOW',
  suscribirse: 'SUBSCRIBE', 'suscribirme': 'SUBSCRIBE', subscribe: 'SUBSCRIBE',
}

function toCTAType(label: string, ctaType?: string, objective?: string): string {
  if (ctaType && /^[A-Z_]+$/.test(ctaType)) return ctaType
  const lower = (label || '').toLowerCase()
  for (const [key, val] of Object.entries(CTA_MAP)) {
    if (lower.includes(key)) return val
  }
  // Intelligent fallback based on campaign objective
  if (objective === 'OUTCOME_SALES' || objective === 'CONVERSIONS') return 'SHOP_NOW'
  if (objective === 'OUTCOME_LEADS' || objective === 'LEAD_GENERATION') return 'SIGN_UP'
  return 'LEARN_MORE'
}

// ── Resolve optimization_goal + promoted_object from campaign objective ────
// We ignore the AI-generated optimization_goal — it's unreliable.
// This mapping is the safe, Meta API v20-compliant set.
function resolveOptGoalForObjective(
  campaignObjective: string,
  hasPixel: boolean,
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
      if (hasPixel && pixelId) {
        return {
          optimization_goal: 'LEAD_GENERATION',
          promoted_object: { pixel_id: pixelId, custom_event_type: 'LEAD' },
        }
      }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }

    case 'OUTCOME_SALES':
    case 'CONVERSIONS':
      if (hasPixel && pixelId) {
        return {
          optimization_goal: 'OFFSITE_CONVERSIONS',
          promoted_object: { pixel_id: pixelId, custom_event_type: 'PURCHASE' },
        }
      }
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }

    default:
      return { optimization_goal: 'LINK_CLICKS', promoted_object: null }
  }
}

// ── Graph API POST helper ──────────────────────────────────────────────────
async function graphPost(path: string, token: string, body: Record<string, unknown>) {
  const res  = await fetch(`${GRAPH}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...body, access_token: token }),
  })
  const data = await res.json()
  if (data.error) {
    const parts: string[] = []
    if (data.error.error_user_msg) parts.push(data.error.error_user_msg)
    else if (data.error.message)   parts.push(data.error.message)
    if (data.error.error_subcode)  parts.push(`(subcode: ${data.error.error_subcode})`)
    if (data.error.fbtrace_id)     parts.push(`[trace: ${data.error.fbtrace_id}]`)
    throw new Error(parts.join(' ') || JSON.stringify(data.error))
  }
  return data
}

// ── Upload image URL to Meta and get image_hash ───────────────────────────
// Returns null on failure so the creative is still created (without image)
async function uploadImageToMeta(
  adAccountId: string,
  token: string,
  imageUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GRAPH}/${adAccountId}/adimages`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url: imageUrl, access_token: token }),
    })
    const data = await res.json()
    if (data.error) {
      console.warn(`[publish-campaign] Image upload failed for ${imageUrl}:`, data.error.message)
      return null
    }
    // Meta returns { images: { "<filename>": { hash, url, ... } } }
    const images = data.images || {}
    const first  = Object.values(images)[0] as any
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
    .from('campaigns')
    .select('*')
    .eq('id', campaign_id)
    .eq('user_id', user.id)
    .single()

  if (campaignErr || !campaign) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  // ── Load business profile ────────────────────────────────────────────────
  const { data: biz } = await supabase
    .from('business_profiles')
    .select('selected_ad_account_id, fb_page_id, pixel_id, instagram_account_id, website_url, whatsapp_number')
    .eq('user_id', user.id)
    .maybeSingle()

  const adAccountId = biz?.selected_ad_account_id
  const pageId      = biz?.fb_page_id

  if (!adAccountId) {
    return NextResponse.json({
      error: 'No tenés una cuenta publicitaria de Meta configurada. Andá a Configuración → Activos de Meta y seleccioná tu cuenta publicitaria.',
      code:  'NO_AD_ACCOUNT',
    }, { status: 400 })
  }

  if (!pageId) {
    return NextResponse.json({
      error: 'No tenés una página de Facebook configurada. Andá a Configuración → Activos de Meta y seleccioná tu página.',
      code:  'NO_PAGE',
    }, { status: 400 })
  }

  // ── Load Facebook access token ───────────────────────────────────────────
  const { data: conn } = await supabase
    .from('facebook_connections')
    .select('access_token, token_expires_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token) {
    return NextResponse.json({
      error: 'Facebook no está conectado. Conectá tu cuenta en Configuración → Facebook.',
      code:  'NO_FB_TOKEN',
    }, { status: 400 })
  }

  if (conn.token_expires_at) {
    const daysLeft = (new Date(conn.token_expires_at).getTime() - Date.now()) / 86400000
    if (daysLeft < 7) {
      console.warn(`[publish-campaign] FB token expires in ${daysLeft.toFixed(0)} days for user ${user.id}`)
    }
  }

  const token = conn.access_token

  // ── Resolve campaign structure ────────────────────────────────────────────
  const rawStructure: CampaignStructure | null =
    campaign.campaign_structure || (campaign.ai_copies as any)?.campaign || null

  // Guard against empty objects: `{}` is truthy but has no ad_sets
  const structure = rawStructure?.ad_sets?.length ? rawStructure : null

  if (!structure) {
    return NextResponse.json({
      error: 'La campaña no tiene estructura de anuncios. Generá los copies con IA antes de publicar.',
      code:  'NO_STRUCTURE',
    }, { status: 400 })
  }

  // ── Diagnostic log ────────────────────────────────────────────────────────
  console.log('[publish-campaign] Full structure:', JSON.stringify({
    campaign_structure: !!campaign.campaign_structure,
    ai_copies_campaign: !!(campaign.ai_copies as any)?.campaign,
    ad_sets_count: structure.ad_sets.length,
    first_adset_ads_count: structure.ad_sets[0]?.ads?.length ?? 0,
    daily_budget: campaign.daily_budget,
    objective: campaign.objective,
    strategy_type: campaign.strategy_type,
  }, null, 2))

  // ── Link URL ──────────────────────────────────────────────────────────────
  let linkUrl = campaign.destination_url?.trim() || ''
  if (!linkUrl && campaign.whatsapp_number) {
    linkUrl = `https://wa.me/${campaign.whatsapp_number.replace(/\D/g, '')}`
  }
  if (!linkUrl) linkUrl = biz?.website_url?.trim() || ''
  if (!linkUrl && biz?.whatsapp_number) {
    linkUrl = `https://wa.me/${biz.whatsapp_number.replace(/\D/g, '')}`
  }
  if (!linkUrl) linkUrl = 'https://example.com'

  const pixelId = biz?.pixel_id || null
  const isWhatsAppCampaign = !!(campaign.whatsapp_number || biz?.whatsapp_number)

  // ── Creative assets (uploaded images/videos) ──────────────────────────────
  // Round-robin: adCreativeIndex % creativeUrls.length
  const creativeUrls: string[] = (campaign.creative_urls as string[]) || []

  // Pre-upload images to Meta to get stable image_hashes.
  // This avoids duplicate uploads when the same image is used in multiple ads.
  const imageHashCache: Record<string, string | null> = {}
  if (creativeUrls.length > 0) {
    console.log(`[publish-campaign] Pre-uploading ${creativeUrls.length} image(s) to Meta...`)
    for (const url of creativeUrls) {
      if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
        imageHashCache[url] = await uploadImageToMeta(adAccountId, token, url)
      }
    }
    console.log('[publish-campaign] Image hashes:', imageHashCache)
  }

  // ── Meta Ads API publishing ───────────────────────────────────────────────
  try {
    const campaignObjective = structure.objective || campaign.objective || 'OUTCOME_AWARENESS'

    const blueprint = decideBudgetMode({
      objective:     campaignObjective,
      ad_set_count:  structure.ad_sets.length,
      has_pixel:     !!pixelId,
      strategy_type: campaign.strategy_type,
    })

    const warnings = validateBeforePublish({
      objective: campaignObjective,
      ad_sets:   structure.ad_sets,
      has_pixel: !!pixelId,
      link_url:  linkUrl,
      mode:      blueprint.mode,
    })
    if (warnings.length) {
      console.warn('[publish-campaign] Pre-publish warnings:', warnings.map(w => w.message))
    }

    // ── Budget per ad set (cents, ABO always) ─────────────────────────────
    // campaign.daily_budget is in the user's currency (e.g. 40000 COP, 15 USD).
    // Meta expects daily_budget in CENTS of that currency.
    // We always derive from campaign.daily_budget ÷ numAdSets × 100.
    // The AI-generated adSet.daily_budget is unreliable (sometimes in cents,
    // sometimes in currency units, sometimes fantasy numbers) — we ignore it.
    const numAdSets = structure.ad_sets.length
    const perAdSetCents = Math.max(
      Math.round((campaign.daily_budget / numAdSets) * 100),
      100, // Meta minimum: 100 cents = 1 unit of currency
    )
    const perAdSetBudgetCents = structure.ad_sets.map(() => perAdSetCents)

    // start_time: now (Meta requires RFC-3339 with timezone)
    const startTimeISO = new Date().toISOString()

    console.log('[publish-campaign] Starting publish:', {
      adAccountId, pageId,
      pixelId:       pixelId || 'none',
      objective:     campaignObjective,
      adSets:        numAdSets,
      mode:          blueprint.mode,
      strategy:      campaign.strategy_type || 'unknown',
      images:        creativeUrls.length,
      budgetCents:   perAdSetBudgetCents.join(', ') + ' (per adset, ABO)',
    })

    // ── 1. Create Campaign ─────────────────────────────────────────────────
    // ABO mode: budget is at ad set level, NOT campaign level.
    // bid_strategy goes on each ad set, not the campaign.
    const campaignPayload: Record<string, unknown> = {
      name:                            structure.name || campaign.name,
      objective:                       campaignObjective,
      status:                          'PAUSED',
      special_ad_categories:           [],
      is_adset_budget_sharing_enabled: false,
    }

    console.log('[publish-campaign] Creating campaign:', campaignPayload.name)

    const metaCampaign = await graphPost(`/${adAccountId}/campaigns`, token, campaignPayload)
    const metaCampaignId: string = metaCampaign.id
    console.log('[publish-campaign] ✓ Campaign created:', metaCampaignId)

    const adSetIds:    string[] = []
    const adIds:       string[] = []
    const creativeIds: string[] = []
    const errors:      string[] = []

    // Global counter for round-robin image distribution across all ads
    let globalAdIndex = 0

    console.log('[publish-campaign] ===== FULL DEBUG =====')
    console.log('[publish-campaign] adAccountId:', adAccountId)
    console.log('[publish-campaign] pageId:', pageId)
    console.log('[publish-campaign] token exists:', !!token)
    console.log('[publish-campaign] token length:', token?.length)
    console.log('[publish-campaign] pixelId:', pixelId)
    console.log('[publish-campaign] linkUrl:', linkUrl)
    console.log('[publish-campaign] campaignObjective:', campaignObjective)
    console.log('[publish-campaign] metaCampaignId:', metaCampaignId)
    console.log('[publish-campaign] numAdSets:', numAdSets)
    console.log('[publish-campaign] perAdSetBudgetCents:', perAdSetBudgetCents)
    console.log('[publish-campaign] structure.ad_sets:', JSON.stringify(structure.ad_sets?.map((s: any) => ({
      name: s.name,
      ads_count: s.ads?.length,
      daily_budget: s.daily_budget,
      optimization_goal: s.optimization_goal,
      targeting_countries: s.targeting?.geo_locations?.countries,
    })), null, 2))

    for (let adSetIdx = 0; adSetIdx < structure.ad_sets.length; adSetIdx++) {
      const adSet = structure.ad_sets[adSetIdx] as AdSetItem

      // ── 2. Build targeting spec ─────────────────────────────────────────
      const t = adSet.targeting || ({} as AdSetItem['targeting'])

      const countries = (t.geo_locations?.countries || [campaign.target_country || 'AR'])
        .map(toCountryCode)
        .filter(Boolean)

      const targetingSpec: Record<string, unknown> = {
        geo_locations: { countries },
        age_min: t.age_min || campaign.target_age_min || 18,
        age_max: t.age_max || campaign.target_age_max || 65,
      }

      // Gender: Meta uses 1=male, 2=female. 0 or omitted = all.
      // The AI sometimes generates wrong values, so we cross-check with
      // campaign.target_gender (from the user's form: "male"/"female"/"all").
      const formGender = campaign.target_gender as string | null
      if (t.genders?.length && !t.genders.includes(0)) {
        targetingSpec.genders = t.genders
      }
      // Override from form if AI didn't set it or set it wrong
      if (formGender === 'female') targetingSpec.genders = [2]
      else if (formGender === 'male') targetingSpec.genders = [1]
      else if (formGender === 'all' && targetingSpec.genders) delete targetingSpec.genders

      // Only include interests that have a valid numeric Meta ID
      const validInterests = (t.interests || []).filter(
        (i: { id?: string }) => i.id && /^\d+$/.test(String(i.id))
      )
      if (validInterests.length) {
        targetingSpec.interests = validInterests
      }

      // Sanitize placements
      const placements = sanitizePlacements(t)
      if (placements) {
        targetingSpec.publisher_platforms = placements.publisher_platforms
        if (placements.facebook_positions?.length)  targetingSpec.facebook_positions  = placements.facebook_positions
        if (placements.instagram_positions?.length) targetingSpec.instagram_positions = placements.instagram_positions
      } else if (t.publisher_platforms?.length) {
        console.warn(`[publish-campaign] AdSet "${adSet.name}": invalid placements → automatic`)
      }

      // ── 3. Resolve optimization_goal (deterministic, ignores AI) ───────
      const { optimization_goal: optimizationGoal, promoted_object: promotedObject } =
        resolveOptGoalForObjective(campaignObjective, !!pixelId, pixelId)

      // ── 4. Build ad set payload ─────────────────────────────────────────
      const adSetPayload: Record<string, unknown> = {
        name:              adSet.name,
        campaign_id:       metaCampaignId,
        daily_budget:      perAdSetBudgetCents[adSetIdx],
        billing_event:     'IMPRESSIONS',
        optimization_goal: optimizationGoal,
        targeting:         targetingSpec,
        status:            'PAUSED',
        start_time:        startTimeISO,
        bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
      }

      if (promotedObject) adSetPayload.promoted_object = promotedObject

      console.log(`[publish-campaign] Creating ad set [${adSetIdx + 1}/${numAdSets}]: "${adSet.name}"`, JSON.stringify({
        optimization_goal: optimizationGoal,
        billing_event:     'IMPRESSIONS',
        bid_strategy:      'LOWEST_COST_WITHOUT_CAP',
        daily_budget:      perAdSetBudgetCents[adSetIdx],
        countries,
        age:               `${targetingSpec.age_min}-${targetingSpec.age_max}`,
        genders:           targetingSpec.genders ?? 'all',
        interests_count:   validInterests.length,
        promoted_object:   promotedObject ?? 'none',
      }))

      console.log(`[publish-campaign] ===== AD SET PAYLOAD [${adSetIdx}] =====`)
      console.log(JSON.stringify(adSetPayload, null, 2))

      let adSetId: string
      try {
        const metaAdSet = await graphPost(`/${adAccountId}/adsets`, token, adSetPayload)
        adSetId = metaAdSet.id
        adSetIds.push(adSetId)
        console.log(`[publish-campaign] ✓ Ad set created: ${adSetId}`)
      } catch (err: any) {
        console.error(`[publish-campaign] ✗ Ad set "${adSet.name}" FAILED: ${err.message}`)
        console.error(`[publish-campaign] ✗ Ad set FULL ERROR:`, JSON.stringify(err, Object.getOwnPropertyNames(err)))
        errors.push(`Ad set "${adSet.name}": ${err.message}`)
        // Skip all ads in this ad set but continue with next ad set
        globalAdIndex += (adSet.ads as AdCopyItem[]).length
        continue
      }

      // ── 5. Create AdCreative + Ad per copy in this ad set ──────────────
      const adsInSet = adSet.ads as AdCopyItem[]
      console.log(`[publish-campaign] Creating ${adsInSet.length} ad(s) for ad set "${adSet.name}"...`)

      for (let adIdx = 0; adIdx < adsInSet.length; adIdx++) {
        const ad = adsInSet[adIdx]

        try {
          const ctaType = toCTAType(ad.call_to_action || '', ad.cta_type, campaignObjective)

          const linkData: Record<string, unknown> = {
            message:     ad.primary_text || 'Conocé más',
            name:        ad.headline     || 'Ver ahora',
            description: ad.description  || '',
            link:        linkUrl,
            call_to_action: {
              type:  ctaType,
              value: { link: linkUrl },
            },
          }

          // ── Assign image from uploaded creatives (round-robin) ──────────
          // Each ad gets a different image; wraps around if fewer images than ads.
          if (creativeUrls.length > 0) {
            const imageUrl = creativeUrls[globalAdIndex % creativeUrls.length]
            const isImage  = imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)

            if (isImage) {
              const hash = imageHashCache[imageUrl]
              if (hash) {
                // Use pre-uploaded hash (most reliable)
                linkData.image_hash = hash
              } else {
                // Fallback: pass URL directly; Meta will fetch it
                linkData.picture = imageUrl
              }
            }
            // Videos: Meta requires a different creative type (video_data) — skip for now,
            // the creative will be created as a link ad with the page's default image.
          }

          // ── Creative name must be UNIQUE within the ad account ──────────
          // Bug: AI generates the same names ("Ad — Ángulo 1") for every ad set.
          // Adding the ad set name prefix makes each creative globally unique.
          const uniqueCreativeName = `${adSet.name} | ${ad.name || `Ad ${adIdx + 1}`}`

          console.log(`[publish-campaign]   Creating creative [${adIdx + 1}/${adsInSet.length}]: "${uniqueCreativeName}"`)

          // instagram_actor_id belongs in object_story_spec, NOT inside link_data
          const objectStorySpec: Record<string, unknown> = {
            page_id: pageId,
            link_data: linkData,
          }
          if (biz?.instagram_account_id) {
            objectStorySpec.instagram_actor_id = biz.instagram_account_id
          }

          const creative = await graphPost(`/${adAccountId}/adcreatives`, token, {
            name:              uniqueCreativeName,
            object_story_spec: objectStorySpec,
          })

          creativeIds.push(creative.id)
          console.log(`[publish-campaign]   ✓ Creative created: ${creative.id}`)

          const metaAd = await graphPost(`/${adAccountId}/ads`, token, {
            name:        uniqueCreativeName,
            campaign_id: metaCampaignId,
            adset_id:    adSetId,
            creative:    { creative_id: creative.id },
            status:      'PAUSED',
          })

          adIds.push(metaAd.id)
          console.log(`[publish-campaign]   ✓ Ad created: ${metaAd.id}`)

        } catch (err: any) {
          console.error(`[publish-campaign]   ✗ Ad "${ad.name}" in "${adSet.name}" FAILED: ${err.message}`)
          console.error(`[publish-campaign]   ✗ Ad/Creative FULL ERROR:`, JSON.stringify(err, Object.getOwnPropertyNames(err)))
          errors.push(`"${adSet.name}" → "${ad.name}": ${err.message}`)
        }

        globalAdIndex++
      }
    }

    // ── 6. Save all Meta IDs to DB ──────────────────────────────────────────
    const totalAdSets = structure.ad_sets.length
    const isPartial   = errors.length > 0 && adSetIds.length > 0
    const isShellOnly = adSetIds.length === 0

    const dbStatus     = isShellOnly ? 'error'  : 'active'
    const dbMetaStatus = isShellOnly ? 'ERROR'   : isPartial ? 'PARTIAL' : 'PAUSED'

    await supabase.from('campaigns').update({
      meta_campaign_id:   metaCampaignId,
      meta_adset_ids:     adSetIds,
      meta_ad_ids:        adIds,
      meta_creative_ids:  creativeIds,
      meta_status:        dbMetaStatus,
      status:             dbStatus,
    }).eq('id', campaign_id)

    // ── 7. Build summary ─────────────────────────────────────────────────────
    const totalBudgetCents = perAdSetBudgetCents.reduce((s, b) => s + b, 0)
    const totalBudgetUSD   = (totalBudgetCents / 100).toFixed(2)

    const countriesList = structure.ad_sets
      .flatMap((s: AdSetItem) => s.targeting?.geo_locations?.countries || [campaign.target_country || 'AR'])
      .map(toCountryCode)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ')

    console.log('[publish-campaign] ✓ Publish complete:', {
      meta_campaign_id:  metaCampaignId,
      ad_sets_requested: totalAdSets,
      ad_sets_created:   adSetIds.length,
      ads_created:       adIds.length,
      creatives_created: creativeIds.length,
      errors:            errors.length,
    })

    return NextResponse.json({
      success:           !isShellOnly,
      partial:           isPartial,
      meta_campaign_id:  metaCampaignId,
      ad_set_ids:        adSetIds,
      ad_ids:            adIds,
      creative_ids:      creativeIds,
      budget_mode:       blueprint.mode,
      partial_errors:    errors.length ? errors : undefined,
      summary: {
        campaign_name:    structure.name || campaign.name,
        ad_sets_created:  adSetIds.length,
        ads_created:      adIds.length,
        total_budget_day: `$${totalBudgetUSD} USD/día`,
        targeting:        countriesList,
        status:           'PAUSED — activá desde Meta Ads Manager',
        meta_url:         `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`,
      },
    })

  } catch (err: any) {
    console.error('[publish-campaign] Fatal error:', err)

    await supabase.from('campaigns').update({
      meta_status: 'ERROR',
      status:      'error',
    }).eq('id', campaign_id)

    return NextResponse.json({
      error: err.message || 'Error al publicar en Meta Ads',
      code:  'META_API_ERROR',
    }, { status: 500 })
  }
}
