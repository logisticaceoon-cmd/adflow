// src/lib/meta/audience-resolver.ts
// Resolves audience targeting per ad set: interest search, retargeting, lookalike.
// Gracefully degrades when pixel data is insufficient.
import { searchMetaInterests, findOrCreateRetargetingAudience, findOrCreateLookalike } from '@/lib/audience-engine'
import type { PixelAnalysis } from '@/lib/pixel-analyzer'
import type { AdSetItem } from '@/types'

// ── Shared types ─────────────────────────────────────────────────────────────

export type AudienceLogEntry = {
  ad_set: string
  audience_type: string
  action: string
  result: 'ok' | 'fail' | 'skip'
  detail?: string
  ids?: string[]
}

export type AudienceResolverContext = {
  /** Raw ad set from the campaign structure */
  adSet: AdSetItem
  /** Targeting spec object to mutate in place */
  targetingSpec: Record<string, unknown>
  /** Derived audience type (interest | broad | retargeting | lookalike) */
  audienceType: string
  /** Primary country code for lookalike creation */
  primaryCountry: string
  /** Pixel ID, or null if not configured */
  pixelId: string | null
  /** Pre-analyzed pixel data, or null */
  pixelData: PixelAnalysis | null
  /** Ad account ID */
  adAccountId: string
  /** Facebook access token */
  token: string
  /** The campaign's strategy_type field (used to default audience type) */
  strategyType?: string
  /** Campaign-level ai_copies for interest fallback */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiCopies?: any
  /** Mutable cache shared across all ad sets in a single publish run */
  audienceCache: Record<string, string>
  /** Mutable audit trail of audience resolution attempts */
  audienceLog: AudienceLogEntry[]
}

// ── Helper: collect interest names from all shapes the AI may emit ────────────

function collectInterestNames(
  adSet: AdSetItem,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiCopies?: any,
): string[] {
  const t = adSet.targeting || ({} as AdSetItem['targeting'])
  const raw: any[] = [
    ...(Array.isArray(t.interests) ? t.interests : []),
    ...((adSet as any).interests || []),
    ...(aiCopies?.targeting?.interests || []),
  ]
  return raw
    .map((i: any) => typeof i === 'string' ? i : (i?.name || i?.interest || i?.category || ''))
    .filter((s: string) => !!s)
}

// ── Main audience resolution function ────────────────────────────────────────

/**
 * Mutates `ctx.targetingSpec` to attach the resolved audience, and appends
 * entries to `ctx.audienceLog`. Never throws — falls back to broad targeting.
 */
export async function resolveAudience(ctx: AudienceResolverContext): Promise<void> {
  const {
    adSet, targetingSpec, audienceType, primaryCountry,
    pixelId, pixelData, adAccountId, token,
    aiCopies, audienceCache, audienceLog,
  } = ctx

  // Helper: try interest fallback when retargeting/lookalike isn't viable
  const tryInterestFallback = async (reason: string) => {
    const names = collectInterestNames(adSet, aiCopies)
    if (!names.length) {
      audienceLog.push({
        ad_set: adSet.name, audience_type: audienceType, action: 'fallback',
        result: 'skip', detail: `${reason}; no AI interests to fall back on`,
      })
      return
    }
    const resolved = await searchMetaInterests(token, names, 7, 15)
    if (resolved.length) {
      targetingSpec.flexible_spec = [{ interests: resolved }]
      delete (targetingSpec as Record<string, unknown>).interests
      audienceLog.push({
        ad_set: adSet.name, audience_type: audienceType, action: 'fallback', result: 'ok',
        detail: `${reason} → ${resolved.length} interests`,
        ids: resolved.map(r => `${r.name}(${r.id})`),
      })
    } else {
      audienceLog.push({
        ad_set: adSet.name, audience_type: audienceType, action: 'fallback',
        result: 'fail', detail: `${reason}; Meta returned no interests`,
      })
    }
  }

  try {
    // ── INTEREST or BROAD ───────────────────────────────────────────────────
    if (audienceType === 'interest' || audienceType === 'broad') {
      const names = collectInterestNames(adSet, aiCopies)
      const t = adSet.targeting || ({} as AdSetItem['targeting'])
      if (names.length) {
        const resolved = await searchMetaInterests(token, names, 7, 15)
        if (resolved.length) {
          targetingSpec.flexible_spec = [{ interests: resolved }]
          delete (targetingSpec as Record<string, unknown>).interests
          audienceLog.push({
            ad_set: adSet.name, audience_type: audienceType, action: 'search', result: 'ok',
            detail: `${resolved.length} interests`,
            ids: resolved.map(r => `${r.name}(${r.id})`),
          })
          console.log(`[publish-campaign] ✓ "${adSet.name}": ${resolved.length} interests resolved`)
        } else {
          audienceLog.push({
            ad_set: adSet.name, audience_type: audienceType, action: 'search',
            result: 'fail', detail: 'Meta returned no results for AI names',
          })
        }
      } else if ((t as any).advantage_plus === true) {
        (targetingSpec as Record<string, unknown>).targeting_automation = { advantage_audience: 1 }
        audienceLog.push({ ad_set: adSet.name, audience_type: audienceType, action: 'attach', result: 'ok', detail: 'Advantage+ broad' })
      } else {
        audienceLog.push({ ad_set: adSet.name, audience_type: audienceType, action: 'attach', result: 'ok', detail: 'broad (geo+age+gender)' })
      }
    }

    // ── RETARGETING ─────────────────────────────────────────────────────────
    else if (audienceType === 'retargeting') {
      if (!pixelId) {
        audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'create', result: 'skip', detail: 'no pixel configured' })
        await tryInterestFallback('no pixel')
      } else if (pixelData && !pixelData.canRetargetViewContent) {
        const detail = `pixel insufficient (VC30=${pixelData.events.ViewContent.count_30d}, need 100+)`
        console.warn(`[publish-campaign] "${adSet.name}": ${detail}`)
        audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'gate', result: 'skip', detail })
        await tryInterestFallback('pixel data low')
      } else {
        // Parse retention + event from ad set name
        const lower = adSet.name.toLowerCase()
        const retentionDays = /(?:^|\D)7(?:\D|$)/.test(lower) || /caliente|hot|carrito|cart/.test(lower) ? 7
          : /(?:^|\D)14(?:\D|$)/.test(lower) ? 14
          : 30
        const eventType: string = /carrito|cart/.test(lower) ? 'AddToCart'
          : /compra|purchase/.test(lower) ? 'Purchase'
          : /vista|view/.test(lower) ? 'ViewContent'
          : 'ViewContent'

        // Per-event capability gating
        const eventOk = eventType === 'Purchase' ? pixelData?.canRetargetPurchase ?? true
          : eventType === 'AddToCart' ? pixelData?.canRetargetAddToCart ?? true
          : pixelData?.canRetargetViewContent ?? true

        if (!eventOk) {
          audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'gate', result: 'skip', detail: `pixel can't support ${eventType}` })
          await tryInterestFallback(`pixel low for ${eventType}`)
        } else {
          const audName = `${eventType} ${retentionDays}d`
          const cacheKey = `${audName}|${pixelId}`
          let audienceId: string | null = audienceCache[cacheKey] || null
          if (!audienceId) {
            audienceId = await findOrCreateRetargetingAudience(
              adAccountId, token, pixelId,
              { name: audName, retentionDays, eventType },
            )
            if (audienceId) audienceCache[cacheKey] = audienceId
          }
          if (audienceId) {
            targetingSpec.custom_audiences = [{ id: audienceId }]
            audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'attach', result: 'ok', detail: `${audName}`, ids: [audienceId] })
            console.log(`[publish-campaign] ✓ "${adSet.name}": retargeting → ${audienceId}`)
          } else {
            audienceLog.push({ ad_set: adSet.name, audience_type: 'retargeting', action: 'create', result: 'fail', detail: audName })
            await tryInterestFallback('audience creation failed')
          }
        }
      }
    }

    // ── LOOKALIKE ───────────────────────────────────────────────────────────
    else if (audienceType === 'lookalike') {
      if (!pixelId) {
        audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'create', result: 'skip', detail: 'no pixel configured' })
        await tryInterestFallback('no pixel')
      } else if (pixelData && !pixelData.canCreateLookalike) {
        const detail = `pixel insufficient (P180=${pixelData.events.Purchase.count_180d}, need 100+)`
        console.warn(`[publish-campaign] "${adSet.name}": ${detail}`)
        audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'gate', result: 'skip', detail })
        await tryInterestFallback('pixel purchases too low')
      } else {
        const cacheKey = `lal|${primaryCountry}|${pixelId}`
        let lookalikeId: string | null = audienceCache[cacheKey] || null
        if (!lookalikeId) {
          lookalikeId = await findOrCreateLookalike(adAccountId, token, pixelId, {
            sourceName: 'Compradores 180d',
            sourceRetentionDays: 180,
            sourceEventType: 'Purchase',
            country: primaryCountry,
            ratio: 0.01,
          })
          if (lookalikeId) audienceCache[cacheKey] = lookalikeId
        }
        if (lookalikeId) {
          targetingSpec.custom_audiences = [{ id: lookalikeId }]
          audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'attach', result: 'ok', detail: `LAL 1% ${primaryCountry}`, ids: [lookalikeId] })
          console.log(`[publish-campaign] ✓ "${adSet.name}": lookalike → ${lookalikeId}`)
        } else {
          audienceLog.push({ ad_set: adSet.name, audience_type: 'lookalike', action: 'create', result: 'fail', detail: `LAL 1% ${primaryCountry}` })
          await tryInterestFallback('lookalike creation failed')
        }
      }
    }
  } catch (audErr: any) {
    // Audience resolution must NEVER block ad set creation
    audienceLog.push({ ad_set: adSet.name, audience_type: audienceType, action: 'exception', result: 'fail', detail: audErr.message })
    console.error(`[publish-campaign] "${adSet.name}": audience exception → broad. ${audErr.message}`)
  }
}
