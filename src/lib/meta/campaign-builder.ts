// src/lib/meta/campaign-builder.ts
// Creates the Meta Ads hierarchy: Campaign → Ad Sets → Ad Creatives → Ads.
import { graphPost } from './graph-api'
import { toMetaDailyBudget } from './currency'
import { sanitizePlacements, toCTAType, resolveOptGoalForObjective } from './placement-utils'
import { resolveAudience } from './audience-resolver'
import { analyzePixel, savePixelAnalysis, type PixelAnalysis } from '@/lib/pixel-analyzer'
import { toCountryCode } from '@/lib/constants'
import type { AdSetItem, AdCopyItem, CampaignStructure } from '@/types'
import type { AudienceLogEntry } from './audience-resolver'

// ── Types ─────────────────────────────────────────────────────────────────────

export type BuildCampaignInput = {
  adAccountId: string
  token: string
  pageId: string
  instagramAccountId?: string | null
  pixelId: string | null
  structure: CampaignStructure
  campaignObjective: string
  /** Daily budget in the ad account currency (converted to Meta minor units per ad set) */
  dailyBudget: number
  /** Ad account currency (ISO 4217). Determines zero-decimal vs cents conversion. */
  currency?: string
  linkUrl: string
  creativeUrls: string[]
  imageHashCache: Record<string, string | null>
  strategyType?: string
  campaignName?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiCopies?: any
  targetCountry?: string
  targetAgeMin?: number
  targetAgeMax?: number
  targetGender?: string
  userId: string
}

export type BuildCampaignResult = {
  metaCampaignId: string
  adSetIds: string[]
  adIds: string[]
  creativeIds: string[]
  errors: string[]
  audienceLog: AudienceLogEntry[]
}

// ── Campaign builder ──────────────────────────────────────────────────────────

export async function createMetaCampaign(
  adAccountId: string,
  token: string,
  name: string,
  objective: string,
): Promise<string> {
  const metaCampaign = await graphPost(`/${adAccountId}/campaigns`, token, {
    name,
    objective,
    status:                          'PAUSED',
    special_ad_categories:           [],
    is_adset_budget_sharing_enabled: false,
  })
  console.log('[publish-campaign] ✓ Campaign created:', metaCampaign.id)
  return metaCampaign.id
}

export async function buildAndPublishCampaign(input: BuildCampaignInput): Promise<BuildCampaignResult> {
  const {
    adAccountId, token, pageId, instagramAccountId, pixelId,
    structure, campaignObjective, dailyBudget, currency,
    linkUrl, creativeUrls, imageHashCache,
    strategyType, aiCopies,
    targetCountry, targetAgeMin, targetAgeMax, targetGender,
    userId,
  } = input

  const numAdSets = structure.ad_sets.length

  // Budget: dailyBudget is in the ad account currency; convert to Meta minor units
  // (zero-decimal currencies like CLP/COP/PYG use factor 1, not 100).
  const perAdSetCents = toMetaDailyBudget(dailyBudget / numAdSets, currency)
  const startTimeISO = new Date().toISOString()

  console.log('[publish-campaign] Starting publish:', {
    numAdSets, strategy: strategyType, images: creativeUrls.length,
  })

  // ── 1. CREATE CAMPAIGN ────────────────────────────────────────────────────
  // ABO mode: each ad set has its own daily_budget
  // is_adset_budget_sharing_enabled: false tells Meta this is ABO
  const metaCampaignId = await createMetaCampaign(
    adAccountId, token, structure.name || input.campaignName || 'Campaign', campaignObjective,
  )

  const adSetIds: string[] = []
  const adIds: string[] = []
  const creativeIds: string[] = []
  const errors: string[] = []
  let globalAdIndex = 0

  // Resolve optimization goal once (same for all ad sets)
  const { optimization_goal, promoted_object } = resolveOptGoalForObjective(campaignObjective, pixelId)

  // Analyze pixel BEFORE the loop so we can gate retargeting/lookalike attempts
  let pixelData: PixelAnalysis | null = null
  if (pixelId) {
    try {
      pixelData = await analyzePixel(pixelId, token)
      await savePixelAnalysis(userId, pixelData)
      console.log(`[publish-campaign] Pixel level: ${pixelData.level} (${pixelData.levelName}) | VC30=${pixelData.events.ViewContent.count_30d} ATC30=${pixelData.events.AddToCart.count_30d} P30=${pixelData.events.Purchase.count_30d} P180=${pixelData.events.Purchase.count_180d}`)
      console.log(`[publish-campaign] Capabilities: VC=${pixelData.canRetargetViewContent} ATC=${pixelData.canRetargetAddToCart} P=${pixelData.canRetargetPurchase} LAL=${pixelData.canCreateLookalike}`)
    } catch (err: any) {
      console.warn('[publish-campaign] Pixel analysis failed, continuing with broad targeting:', err.message)
    }
  }

  // Cache custom audience IDs across ad sets in this run (key → audience id)
  const audienceCache: Record<string, string> = {}
  // Per-publish audit trail of what we tried for each ad set's audience
  const audienceLog: AudienceLogEntry[] = []

  for (let si = 0; si < structure.ad_sets.length; si++) {
    const adSet = structure.ad_sets[si] as AdSetItem

    // ── 2. BUILD TARGETING ──────────────────────────────────────────────────
    const t = adSet.targeting || ({} as AdSetItem['targeting'])
    const countries = (t.geo_locations?.countries || [targetCountry || 'AR'])
      .map(toCountryCode).filter(Boolean)

    const targetingSpec: Record<string, unknown> = {
      geo_locations: { countries },
      age_min: t.age_min || targetAgeMin || 18,
      age_max: t.age_max || targetAgeMax || 65,
      // Meta v20 requires explicit declaration of Advantage Audience.
      // 0 = off (respect manual targeting), 1 = let Meta expand the audience.
      targeting_automation: { advantage_audience: 0 },
    }

    // Gender: use form value as source of truth
    const formGender = (targetGender as string || '').toLowerCase()
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

    // ── 2.b RESOLVE AUDIENCE ────────────────────────────────────────────────
    // Gated by pixel level + capabilities. Falls back gracefully.
    const rawAudienceType = ((adSet as any).audience_type as string | undefined)?.toLowerCase()
    const isTofu = (strategyType || '').toUpperCase() === 'TOFU'
    const audienceType = rawAudienceType || (isTofu ? 'interest' : 'broad')
    const primaryCountry = countries[0] || 'US'

    await resolveAudience({
      adSet,
      targetingSpec,
      audienceType,
      primaryCountry,
      pixelId,
      pixelData,
      adAccountId,
      token,
      strategyType,
      aiCopies,
      audienceCache,
      audienceLog,
    })

    // ── 3. CREATE AD SET ────────────────────────────────────────────────────
    // Meta API v20 requires bid_strategy on ad sets for ABO mode.
    // LOWEST_COST_WITHOUT_CAP = Meta optimizes for lowest cost per result.
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

    // ── 4. CREATE CREATIVES + ADS ───────────────────────────────────────────
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
        const useInstagram = instagramAccountId && /^\d+$/.test(String(instagramAccountId))
        if (useInstagram) objectStorySpec.instagram_actor_id = instagramAccountId

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

  return { metaCampaignId, adSetIds, adIds, creativeIds, errors, audienceLog }
}
