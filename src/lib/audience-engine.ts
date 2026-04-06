// src/lib/audience-engine.ts
// Encapsulates Meta Audience operations: interest search, retargeting custom
// audiences from pixel data, and lookalike audiences. Every operation is
// idempotent (find first, create only if missing) and never throws — failures
// return null so callers can fall back to broad targeting.

const GRAPH = 'https://graph.facebook.com/v20.0'

// ── INTEREST SEARCH ─────────────────────────────────────────────────────────
// Resolves AI-generated interest names to real Meta interest IDs.
// For each name, fetches up to 10 candidates from Meta and keeps the top 3.
// Dedupes by id and returns between minResults and maxResults unique interests.
export async function searchMetaInterests(
  token: string,
  interestNames: string[],
  minResults = 7,
  maxResults = 15,
): Promise<Array<{ id: string; name: string }>> {
  void minResults // reserved for future "expand search" behavior
  const results: Array<{ id: string; name: string }> = []
  const seen = new Set<string>()

  for (const name of interestNames) {
    if (results.length >= maxResults) break
    if (!name?.trim()) continue
    try {
      const res = await fetch(
        `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(name)}&limit=10&locale=es_LA&access_token=${token}`,
      )
      const data = await res.json()
      if (data.error) {
        console.warn(`[audience-engine] Interest search error for "${name}":`, data.error.message)
        continue
      }
      if (!data.data?.length) continue
      for (const interest of data.data.slice(0, 3)) {
        if (interest?.id && !seen.has(String(interest.id)) && results.length < maxResults) {
          seen.add(String(interest.id))
          results.push({ id: String(interest.id), name: interest.name || name })
        }
      }
    } catch (err: any) {
      console.warn(`[audience-engine] Interest search failed for "${name}":`, err.message)
    }
  }

  console.log(`[audience-engine] Resolved ${results.length} interests from ${interestNames.length} queries`)
  return results
}

// ── CUSTOM AUDIENCE (RETARGETING) ───────────────────────────────────────────
// Find by exact name first; if missing, create from pixel events.
// Optionally filters by a single event type (Purchase, AddToCart, ViewContent…).
export async function findOrCreateRetargetingAudience(
  adAccountId: string,
  token: string,
  pixelId: string,
  config: { name: string; retentionDays: number; eventType?: string },
): Promise<string | null> {
  const audienceName = `[AdFlow] ${config.name}`

  try {
    // 1) Look up existing audiences in this ad account
    const searchRes = await fetch(
      `${GRAPH}/${adAccountId}/customaudiences?fields=id,name,subtype&limit=100&access_token=${token}`,
    )
    const searchData = await searchRes.json()
    const existing = searchData.data?.find((a: any) => a.name === audienceName)
    if (existing?.id) {
      console.log(`[audience-engine] ↻ Reusing audience "${audienceName}" → ${existing.id}`)
      return existing.id
    }

    // 2) Build the rule (no empty url filter — Meta is picky about that)
    const ruleEntry: Record<string, unknown> = {
      event_sources: [{ id: pixelId, type: 'pixel' }],
      retention_seconds: config.retentionDays * 86400,
    }
    if (config.eventType) {
      ruleEntry.filter = {
        operator: 'and',
        filters: [{ field: 'event', operator: 'eq', value: config.eventType }],
      }
    }
    const rule = { inclusions: { operator: 'or', rules: [ruleEntry] } }

    // 3) Create
    const createRes = await fetch(`${GRAPH}/${adAccountId}/customaudiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: audienceName,
        subtype: 'WEBSITE',
        description: `Creado por AdFlow — ${config.name}`,
        rule: JSON.stringify(rule),
        retention_days: config.retentionDays,
        prefill: true,
        access_token: token,
      }),
    })
    const createData = await createRes.json()
    if (createData.id) {
      console.log(`[audience-engine] ✚ Created audience "${audienceName}" → ${createData.id}`)
      return createData.id
    }
    console.warn(`[audience-engine] Failed to create "${audienceName}":`, createData.error?.message)
    return null
  } catch (err: any) {
    console.warn(`[audience-engine] Audience exception for "${config.name}":`, err.message)
    return null
  }
}

// ── LOOKALIKE AUDIENCE ──────────────────────────────────────────────────────
// Find by name first; if missing, create the source audience (via
// findOrCreateRetargetingAudience) and then the lookalike on top.
export async function findOrCreateLookalike(
  adAccountId: string,
  token: string,
  pixelId: string,
  config: {
    sourceName: string
    sourceRetentionDays: number
    sourceEventType: string
    country: string
    ratio?: number
  },
): Promise<string | null> {
  const ratio = config.ratio ?? 0.01
  const lookName = `[AdFlow] LAL ${(ratio * 100).toFixed(0)}% — ${config.sourceName}`

  try {
    // 1) Reuse existing lookalike if present
    const searchRes = await fetch(
      `${GRAPH}/${adAccountId}/customaudiences?fields=id,name,subtype&limit=100&access_token=${token}`,
    )
    const searchData = await searchRes.json()
    const existing = searchData.data?.find((a: any) => a.name === lookName)
    if (existing?.id) {
      console.log(`[audience-engine] ↻ Reusing lookalike "${lookName}" → ${existing.id}`)
      return existing.id
    }

    // 2) Find or create source audience
    const sourceId = await findOrCreateRetargetingAudience(adAccountId, token, pixelId, {
      name: config.sourceName,
      retentionDays: config.sourceRetentionDays,
      eventType: config.sourceEventType,
    })
    if (!sourceId) {
      console.warn('[audience-engine] Cannot create lookalike: source audience failed')
      return null
    }

    // 3) Create the lookalike
    const createRes = await fetch(`${GRAPH}/${adAccountId}/customaudiences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: lookName,
        subtype: 'LOOKALIKE',
        origin_audience_id: sourceId,
        lookalike_spec: JSON.stringify({
          type: 'similarity',
          ratio,
          country: config.country,
        }),
        access_token: token,
      }),
    })
    const createData = await createRes.json()
    if (createData.id) {
      console.log(`[audience-engine] ✚ Created lookalike "${lookName}" → ${createData.id}`)
      return createData.id
    }
    console.warn(`[audience-engine] Lookalike failed:`, createData.error?.message)
    return null
  } catch (err: any) {
    console.warn(`[audience-engine] Lookalike exception:`, err.message)
    return null
  }
}
