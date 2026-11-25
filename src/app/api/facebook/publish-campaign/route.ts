// src/app/api/facebook/publish-campaign/route.ts
// Publishes a full Meta Ads campaign structure: Campaign → Ad Sets → Ad Creatives → Ads
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptSecret } from '@/lib/security/crypto'
import { createNotification } from '@/lib/notification-engine'
import { markActionCompleted } from '@/lib/memory-engine'
import type { AdSetItem, CampaignStructure } from '@/types'
import { META_GRAPH_URL, toCountryCode } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import { publishCampaignSchema, validate } from '@/lib/validations'
import { uploadImageToMeta } from '@/lib/meta/graph-api'
import { buildAndPublishCampaign } from '@/lib/meta/campaign-builder'
import { toMetaDailyBudget } from '@/lib/meta/currency'

const GRAPH = META_GRAPH_URL

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Rate limiting
  const rl = await checkRateLimit(user.id, 'meta')
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Esperá un momento.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const body = await req.json().catch(() => null)
  const v = validate(publishCampaignSchema, body)
  if (v.error) return NextResponse.json({ error: v.error }, { status: 400 })
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const campaign_id = v.data!.campaign_id

  // ── Load campaign ────────────────────────────────────────────────────────
  const { data: campaign, error: campaignErr } = await supabase
    .from('campaigns').select('*').eq('id', campaign_id).eq('user_id', user.id).single()
  if (campaignErr || !campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })

  // ── Load business profile ────────────────────────────────────────────────
  const { data: biz } = await supabase
    .from('business_profiles')
    .select('selected_ad_account_id, fb_page_id, pixel_id, instagram_account_id, website_url, whatsapp_number')
    .eq('user_id', user.id).maybeSingle()

  const adAccountId = (biz as any)?.selected_ad_account_id
  const pageId = (biz as any)?.fb_page_id
  if (!adAccountId) return NextResponse.json({ error: 'No tenés una cuenta publicitaria configurada. Andá a Configuración → Activos de Meta.', code: 'NO_AD_ACCOUNT' }, { status: 400 })
  if (!pageId) return NextResponse.json({ error: 'No tenés una página de Facebook configurada. Andá a Configuración → Activos de Meta.', code: 'NO_PAGE' }, { status: 400 })

  // ── Load Facebook access token ───────────────────────────────────────────
  const { data: conn } = await supabase
    .from('facebook_connections').select('access_token, token_expires_at').eq('user_id', user.id).maybeSingle()
  if (!(conn as any)?.access_token) return NextResponse.json({ error: 'Facebook no está conectado. Conectá tu cuenta en Configuración.', code: 'NO_FB_TOKEN' }, { status: 400 })
  const token = decryptSecret((conn as any).access_token as string)

  // Moneda de la cuenta publicitaria (autoritativa para convertir presupuestos).
  // Se resuelve en la verificación de token; default USD si Meta no la devuelve.
  let accountCurrency = 'USD'

  // ── Verify token has permissions on the selected ad account ─────────────
  try {
    const verifyRes = await fetch(`${GRAPH}/${adAccountId}?fields=name,account_status,currency`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const verifyData = await verifyRes.json()
    if (verifyData.currency) accountCurrency = verifyData.currency
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
  const c = campaign as any
  const rawStructure: CampaignStructure | null =
    c.campaign_structure || c.ai_copies?.campaign || null
  const structure = rawStructure?.ad_sets?.length ? rawStructure : null
  if (!structure) return NextResponse.json({ error: 'La campaña no tiene estructura de anuncios. Generá los copies con IA antes de publicar.', code: 'NO_STRUCTURE' }, { status: 400 })

  // ── Link URL ──────────────────────────────────────────────────────────────
  let linkUrl = c.destination_url?.trim() || ''
  if (!linkUrl && c.whatsapp_number) linkUrl = `https://wa.me/${c.whatsapp_number.replace(/\D/g, '')}`
  if (!linkUrl) linkUrl = (biz as any)?.website_url?.trim() || ''
  if (!linkUrl && (biz as any)?.whatsapp_number) linkUrl = `https://wa.me/${(biz as any).whatsapp_number.replace(/\D/g, '')}`
  if (!linkUrl) linkUrl = 'https://example.com'

  const pixelId: string | null = (biz as any)?.pixel_id || null
  const creativeUrls: string[] = (c.creative_urls as string[]) || []

  // ── Pre-upload images to Meta ───────────────────────────────────────────
  const imageHashCache: Record<string, string | null> = {}
  for (const url of creativeUrls) {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) {
      imageHashCache[url] = await uploadImageToMeta(adAccountId, token, url)
    }
  }

  // ── Meta Ads API publishing ───────────────────────────────────────────────
  try {
    const campaignObjective: string = structure.objective || c.objective || 'OUTCOME_AWARENESS'
    const numAdSets = structure.ad_sets.length

    const { metaCampaignId, adSetIds, adIds, creativeIds, errors, audienceLog } =
      await buildAndPublishCampaign({
        adAccountId,
        token,
        pageId,
        instagramAccountId: (biz as any)?.instagram_account_id,
        pixelId,
        structure,
        campaignObjective,
        dailyBudget: c.daily_budget,
        currency: accountCurrency,
        linkUrl,
        creativeUrls,
        imageHashCache,
        strategyType: c.strategy_type,
        campaignName: c.name,
        aiCopies: c.ai_copies,
        targetCountry: c.target_country,
        targetAgeMin: c.target_age_min,
        targetAgeMax: c.target_age_max,
        targetGender: c.target_gender,
        userId: user.id,
      })

    // ── Save results to DB ──────────────────────────────────────────────────
    const isShellOnly = adSetIds.length === 0
    const isPartial = errors.length > 0 && adSetIds.length > 0

    // Save results + errors in metrics JSON for debugging (survives Vercel log truncation)
    const perAdSetCents = toMetaDailyBudget(c.daily_budget / numAdSets, accountCurrency)
    await supabase.from('campaigns').update({
      meta_campaign_id:  metaCampaignId,
      meta_adset_ids:    adSetIds,
      meta_ad_ids:       adIds,
      meta_creative_ids: creativeIds,
      meta_status:       isShellOnly ? 'ERROR' : isPartial ? 'PARTIAL' : 'PAUSED',
      status:            isShellOnly ? 'error' : 'active',
      metrics:           { publish_errors: errors, publish_date: new Date().toISOString(), adsets_attempted: numAdSets, adsets_created: adSetIds.length, ads_created: adIds.length, audience_log: audienceLog },
    } as any).eq('id', campaign_id)

    console.log('[publish-campaign] ✓ DONE:', { adSets: adSetIds.length, ads: adIds.length, errors: errors.length })

    // Strategic memory: mark "first_campaign" as completed if this is a first publish
    if (!isShellOnly) {
      try { await markActionCompleted(user.id, 'first_campaign') } catch { /* ignore */ }
    }

    // Persistent notification (never breaks the publish flow)
    if (!isShellOnly) {
      try {
        await createNotification({
          userId: user.id,
          type: 'campaign_published',
          title: `🚀 Campaña "${structure.name || c.name}" publicada en Meta`,
          body: `${adSetIds.length} conjuntos y ${adIds.length} anuncios creados`,
          severity: 'success',
          actionUrl: `/dashboard/campaigns/${campaign_id}`,
          metadata: { ad_sets: adSetIds.length, ads: adIds.length, partial: isPartial },
        })
      } catch (e) {
        console.warn('[publish-campaign] notification failed:', e)
      }
    }

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
        campaign_name:   structure.name || c.name,
        ad_sets_created: adSetIds.length,
        ads_created:     adIds.length,
        total_budget_day: `$${(totalCents / 100).toFixed(2)}/día`,
        targeting:       structure.ad_sets.flatMap((s: AdSetItem) => s.targeting?.geo_locations?.countries || [c.target_country || 'AR']).map(toCountryCode).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', '),
        status:          'PAUSED — activá desde Meta Ads Manager',
        meta_url:        `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`,
      },
    })
  } catch (err: any) {
    console.error('[publish-campaign] Fatal error:', err)
    await supabase.from('campaigns').update({ meta_status: 'ERROR', status: 'error' } as any).eq('id', campaign_id)
    return NextResponse.json({ error: err.message || 'Error al publicar en Meta Ads', code: 'META_API_ERROR' }, { status: 500 })
  }
}
