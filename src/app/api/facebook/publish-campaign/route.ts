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

// ── Audience resolution helpers ─────────────────────────────────────────────
// Tracks every audience attempt for post-mortem debugging (saved in metrics)
type AudienceLogEntry = {
  ad_set: string
  audience_type: string
  action: string
  result: 'ok' | 'fail' | 'skip'
  detail?: string
  ids?: string[]
}

// Search Meta's interest taxonomy by name. Returns up to `take` results per query.
async function searchMetaInterestsByName(
  token: string,
  name: string,
  take = 3,
): Promise<Array<{ id: string; name: string }>> {
  try {
    const url = `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(name)}&limit=10&access_token=${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn(`[publish-campaign] Interest search error for "${name}":`, data.error.message)
      return []
    }
    if (!data.data?.length) return []
    return data.data.slice(0, take)
      .filter((i: any) => i?.id)
      .map((i: any) => ({ id: String(i.id), name: i.name || name }))
  } catch (err: any) {
    console.warn(`[publish-campaign] Interest search exception for "${name}":`, err.message)
    return []
  }
}

// Resolve AI-generated interest names → array of 7-15 real Meta interest IDs.
// Accepts strings or { id?, name?, interest? } objects. Dedupes by id.
async function searchMetaInterests(
  token: string,
  raw: Array<any>,
): Promise<Array<{ id: string; name: string }>> {
  const out: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()

  // Extract usable names from heterogeneous input shapes
  const names: string[] = []
  for (const item of raw) {
    if (!item) continue
    if (typeof item === 'string') { names.push(item); continue }
    // Already has a numeric Meta ID — preserve as-is
    if (item.id && /^\d+$/.test(String(item.id))) {
      const idStr = String(item.id)
      if (!seen.has(idStr)) {
        seen.add(idStr)
        out.push({ id: idStr, name: item.name || item.interest || '' })
      }
      continue
    }
    const n = item.name || item.interest || item.category
    if (n && typeof n === 'string') names.push(n)
  }

  // Search Meta API for each name
  for (const name of names) {
    if (out.length >= 15) break
    const found = await searchMetaInterestsByName(token, name, 3)
    for (const f of found) {
      if (out.length >= 15) break
      if (!seen.has(f.id)) {
        seen.add(f.id)
        out.push(f)
      }
    }
  }
  return out
}

// Look up an existing Custom Audience by exact name match within the ad account
async function findCustomAudienceByName(
  adAccountId: string,
  token: string,
  name: string,
): Promise<string | null> {
  try {
    const filtering = encodeURIComponent(JSON.stringify([
      { field: 'name', operator: 'CONTAIN', value: name },
    ]))
    const url = `${GRAPH}/${adAccountId}/customaudiences?fields=id,name&limit=25&filtering=${filtering}&access_token=${token}`
    const res = await fetch(url)
    const data = await res.json()
    if (data.error) {
      console.warn(`[publish-campaign] Audience lookup error for "${name}":`, data.error.message)
      return null
    }
    if (!data.data?.length) return null
    // Prefer exact name match, otherwise the first containing match
    const exact = data.data.find((a: any) => a.name === name)
    return (exact || data.data[0]).id || null
  } catch (err: any) {
    console.warn(`[publish-campaign] Audience lookup exception for "${name}":`, err.message)
    return null
  }
}

// Find or create a Website Custom Audience from pixel data.
// `eventType` (e.g. Purchase, AddToCart, ViewContent) restricts the rule.
async function findOrCreateCustomAudience(
  adAccountId: string,
  token: string,
  pixelId: string,
  name: string,
  retentionDays: number,
  eventType?: string,
): Promise<string | null> {
  // 1) Reuse existing audience if present
  const existing = await findCustomAudienceByName(adAccountId, token, name)
  if (existing) {
    console.log(`[publish-campaign] ↻ Reusing custom audience "${name}" → ${existing}`)
    return existing
  }

  // 2) Build rule (no empty url filter — Meta is picky)
  const ruleEntry: Record<string, unknown> = {
    event_sources: [{ id: pixelId, type: 'pixel' }],
    retention_seconds: retentionDays * 86400,
  }
  if (eventType) {
    ruleEntry.filter = {
      operator: 'and',
      filters: [{ field: 'event', operator: 'eq', value: eventType }],
    }
  }

  try {
    const res = await graphPost(`/${adAccountId}/customaudiences`, token, {
      name,
      subtype: 'WEBSITE',
      description: `Auto-created by AdFlow${eventType ? ` (${eventType})` : ''}`,
      pixel_id: pixelId,
      rule: JSON.stringify({
        inclusions: { operator: 'or', rules: [ruleEntry] },
      }),
    })
    if (res?.id) {
      console.log(`[publish-campaign] ✚ Created custom audience "${name}" → ${res.id}`)
      return res.id
    }
    return null
  } catch (err: any) {
    console.warn(`[publish-campaign] Custom audience creation failed for "${name}":`, err.message)
    return null
  }
}

// Find or create a Lookalike audience built on top of a Purchase-source audience
async function findOrCreateLookalike(
  adAccountId: string,
  token: string,
  pixelId: string,
  countryCode: string,
  retentionDays = 180,
  ratio = 0.01,
): Promise<{ lookalikeId: string | null; sourceId: string | null }> {
  const sourceName = `[AdFlow] Compradores ${retentionDays}d`
  const lookalikeName = `[AdFlow] LAL 1% ${countryCode} — Compradores ${retentionDays}d`

  // 1) Try to reuse the lookalike directly
  const existingLal = await findCustomAudienceByName(adAccountId, token, lookalikeName)
  if (existingLal) {
    console.log(`[publish-campaign] ↻ Reusing lookalike "${lookalikeName}" → ${existingLal}`)
    return { lookalikeId: existingLal, sourceId: null }
  }

  // 2) Find or create the source (Purchase event audience)
  const sourceId = await findOrCreateCustomAudience(
    adAccountId, token, pixelId, sourceName, retentionDays, 'Purchase',
  )
  if (!sourceId) return { lookalikeId: null, sourceId: null }

  // 3) Create the lookalike from that source
  try {
    const res = await graphPost(`/${adAccountId}/customaudiences`, token, {
      name: lookalikeName,
      subtype: 'LOOKALIKE',
      origin_audience_id: sourceId,
      lookalike_spec: JSON.stringify({
        type: 'similarity',
        ratio,
        country: countryCode,
      }),
    })
    if (res?.id) {
      console.log(`[publish-campaign] ✚ Created lookalike "${lookalikeName}" → ${res.id}`)
      return { lookalikeId: res.id, sourceId }
    }
    return { lookalikeId: null, sourceId }
  } catch (err: any) {
    console.warn(`[publish-campaign] Lookalike creation failed for "${lookalikeName}":`, err.message)
    return { lookalikeId: null, sourceId }
  }
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

    // Cache custom audience IDs across ad sets in this run (key → audience id)
    const audienceCache: Record<string, string> = {}
    // Per-publish audit trail of what we tried for each ad set's audience
    const audienceLog: AudienceLogEntry[] = []

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
        // Meta v20 requires explicit declaration of Advantage Audience.
        // 0 = off (respect manual targeting), 1 = let Meta expand the audience.
        targeting_automation: { advantage_audience: 0 },
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
      // 2.b RESOLVE AUDIENCE — interest IDs / custom audiences / lookalikes
      //     Falls back to broad targeting if anything fails (never blocks).
      //     Every attempt is recorded in audienceLog → saved to metrics.
      // ════════════════════════════════════════════════════════════════════
      const rawAudienceType = ((adSet as any).audience_type as string | undefined)?.toLowerCase()
      const isTofu = (campaign.strategy_type || '').toUpperCase() === 'TOFU'
      // Default to "interest" for TOFU when AI didn't tag it explicitly
      const audienceType = rawAudienceType
        || (isTofu ? 'interest' : 'broad')
      const primaryCountry = countries[0] || 'US'

      try {
        if (audienceType === 'interest') {
          // Pull names from every shape the AI may emit
          const rawInterests: any[] = [
            ...(Array.isArray(t.interests) ? t.interests : []),
            ...((adSet as any).interests || []),
            ...((campaign.ai_copies as any)?.targeting?.interests || []),
          ]
          if (!rawInterests.length) {
            audienceLog.push({ ad_set: adSet.name, audience_type: 'interest', action: 'search', result: 'skip', detail: 'AI did not generate any interest names' })
            console.warn(`[publish-campaign] "${adSet.name}": no interest names from AI → broad`)
          } else {
            const resolved = await searchMetaInterests(token, rawInterests)
            if (resolved.length) {
              targetingSpec.flexible_spec = [{ interests: resolved }]
              delete (targetingSpec as Record<string, unknown>).interests
              audienceLog.push({
                ad_set: adSet.name, audience_type: 'interest', action: 'search', result: 'ok',
                detail: `${resolved.length} interests`,
                ids: resolved.map(r => `${r.name}(${r.id})`),
              })
              console.log(`[publish-campaign] ✓ "${adSet.name}": ${resolved.length} interests resolved`, resolved.map(r => `${r.name}(${r.id})`).join(', '))
            } else {
              audienceLog.push({ ad_set: adSet.name, audience_type: 'interest', action: 'search', result: 'fail', detail: 'no Meta search results for any name' })
              console.warn(`[publish-campaign] "${adSet.name}": Meta returned no results for AI interest names → broad`)
            }
          }
        } else if (audienceType === 'retargeting') {
          if (!pixelId) {
            audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'create', result: 'skip', detail: 'no pixel configured' })
            console.warn(`[publish-campaign] "${adSet.name}": retargeting requested but no pixel → broad`)
          } else {
            // Heuristic: parse retention + event from ad set name
            const lower = adSet.name.toLowerCase()
            const retentionDays = /(?:^|\D)7(?:\D|$)/.test(lower) || /caliente|hot|carrito|cart/.test(lower) ? 7
              : /(?:^|\D)14(?:\D|$)/.test(lower) ? 14
              : /(?:^|\D)30(?:\D|$)/.test(lower) || /tibio|warm|frio|cold/.test(lower) ? 30
              : 30
            const eventType: string | undefined = /carrito|cart/.test(lower) ? 'AddToCart'
              : /compra|purchase/.test(lower) ? 'Purchase'
              : /vista|view/.test(lower) ? 'ViewContent'
              : undefined
            const audName = `[AdFlow] ${eventType || 'Visitantes'} ${retentionDays}d`
            const cacheKey = `${audName}|${pixelId}`
            let audienceId: string | null = audienceCache[cacheKey] || null
            if (!audienceId) {
              audienceId = await findOrCreateCustomAudience(
                adAccountId, token, pixelId, audName, retentionDays, eventType,
              )
              if (audienceId) audienceCache[cacheKey] = audienceId
            }
            if (audienceId) {
              targetingSpec.custom_audiences = [{ id: audienceId }]
              audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'attach', result: 'ok', detail: `${audName} (${retentionDays}d, ${eventType || 'all'})`, ids: [audienceId] })
              console.log(`[publish-campaign] ✓ "${adSet.name}": retargeting audience attached → ${audienceId}`)
            } else {
              audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'create', result: 'fail', detail: `${audName} (${retentionDays}d, ${eventType || 'all'})` })
              console.warn(`[publish-campaign] "${adSet.name}": retargeting unavailable → broad`)
            }
          }
        } else if (audienceType === 'lookalike') {
          if (!pixelId) {
            audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'create', result: 'skip', detail: 'no pixel configured' })
            console.warn(`[publish-campaign] "${adSet.name}": lookalike requested but no pixel → broad`)
          } else {
            const cacheKey = `lal|${primaryCountry}|${pixelId}`
            let lookalikeId: string | null = audienceCache[cacheKey] || null
            if (!lookalikeId) {
              const result = await findOrCreateLookalike(
                adAccountId, token, pixelId, primaryCountry, 180, 0.01,
              )
              lookalikeId = result.lookalikeId
              if (lookalikeId) audienceCache[cacheKey] = lookalikeId
            }
            if (lookalikeId) {
              targetingSpec.custom_audiences = [{ id: lookalikeId }]
              audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'attach', result: 'ok', detail: `LAL 1% ${primaryCountry}`, ids: [lookalikeId] })
              console.log(`[publish-campaign] ✓ "${adSet.name}": lookalike attached → ${lookalikeId}`)
            } else {
              audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'create', result: 'fail', detail: `LAL 1% ${primaryCountry} — likely insufficient pixel data` })
              console.warn(`[publish-campaign] "${adSet.name}": lookalike unavailable (often: pixel has <100 Purchase events) → broad`)
            }
          }
        } else {
          // 'broad' or unknown — use Advantage+ if AI flagged it
          if ((t as any).advantage_plus === true) {
            (targetingSpec as Record<string, unknown>).targeting_automation = { advantage_audience: 1 }
          }
          audienceLog.push({ ad_set: adSet.name, audience_type: audienceType, action: 'attach', result: 'ok', detail: 'broad targeting (geo+age+gender)' })
        }
      } catch (audErr: any) {
        // Audience resolution must NEVER block ad set creation
        audienceLog.push({ ad_set: adSet.name, audience_type: audienceType, action: 'exception', result: 'fail', detail: audErr.message })
        console.error(`[publish-campaign] "${adSet.name}": audience resolution exception → broad. ${audErr.message}`)
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

          // Only include instagram_actor_id if configured AND a numeric ID
          const igActorId = biz?.instagram_account_id
          const useInstagram = igActorId && /^\d+$/.test(String(igActorId))
          if (useInstagram) objectStorySpec.instagram_actor_id = igActorId

          let creative: any
          try {
            creative = await graphPost(`/${adAccountId}/adcreatives`, token, {
              name: uniqueName,
              object_story_spec: objectStorySpec,
            })
          } catch (creativeErr: any) {
            // If Meta rejects instagram_actor_id, retry without it (FB-only)
            if (creativeErr.message?.includes('instagram_actor_id') && objectStorySpec.instagram_actor_id) {
              console.warn(`[publish-campaign] Retrying creative without instagram_actor_id`)
              delete objectStorySpec.instagram_actor_id
              creative = await graphPost(`/${adAccountId}/adcreatives`, token, {
                name: uniqueName,
                object_story_spec: objectStorySpec,
              })
            } else {
              throw creativeErr
            }
          }
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
      metrics:           { publish_errors: errors, publish_date: new Date().toISOString(), adsets_attempted: numAdSets, adsets_created: adSetIds.length, ads_created: adIds.length, audience_log: audienceLog },
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
