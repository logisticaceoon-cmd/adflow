// src/app/api/intelligence/campaign/route.ts
//
// GET /api/intelligence/campaign?id={campaign_id}&period={last_1d|last_3d|last_7d|last_30d}
//
// Runs the full expert intelligence pipeline (diagnostic rules → scaling
// evaluator → client message) against a specific campaign and returns the
// `CampaignIntelligenceResult` so the UI can render:
//   • diagnosis (Escalar/Optimizar/Pausar/Observar)
//   • block-by-block scaling evaluation (A/B/C/C+)
//   • risk level + ROAS level + frequency level
//   • motivated reason + funnel explanation
//   • personalized client message
//   • next best action with urgency
//
// Metrics source: aggregates `campaign_metrics_daily` for the requested
// period, which is the canonical source populated by the meta sync engine.
// If no daily rows exist (e.g. campaign was just published), falls back to
// the summary stored in `campaigns.metrics`.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  analyzeCampaign,
  aggregateDailyMetrics,
  buildMetricsFromCampaignRow,
} from '@/lib/campaign-intelligence'
import { DEFAULT_SETTINGS } from '@/lib/strategy-settings'
import type { CampaignMetrics } from '@/lib/diagnostic-rules'

type Period = 'last_1d' | 'last_3d' | 'last_7d' | 'last_30d'
const VALID_PERIODS: Period[] = ['last_1d', 'last_3d', 'last_7d', 'last_30d']
const PERIOD_DAYS: Record<Period, number> = { last_1d: 1, last_3d: 3, last_7d: 7, last_30d: 30 }

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // ── Params ──────────────────────────────────────────────────
  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('id')?.trim()
  const periodParam = (searchParams.get('period') || 'last_7d') as Period
  const period: Period = VALID_PERIODS.includes(periodParam) ? periodParam : 'last_7d'

  if (!campaignId) {
    return NextResponse.json({ error: 'id (campaign_id) requerido' }, { status: 400 })
  }

  // ── Load campaign (auth check) ──────────────────────────────
  const { data: campaign, error: campaignErr } = await supabase
    .from('campaigns')
    .select('id, name, status, daily_budget, metrics, meta_campaign_id, strategy_type')
    .eq('id', campaignId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (campaignErr) {
    return NextResponse.json({ error: campaignErr.message }, { status: 500 })
  }
  if (!campaign) {
    return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  }

  // ── Build metrics snapshot from campaign_metrics_daily ──────
  const days = PERIOD_DAYS[period]
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const { data: dailyRows } = await supabase
    .from('campaign_metrics_daily')
    .select('spend, impressions, clicks, purchases, purchase_value, add_to_cart, initiate_checkout, view_content, reach, frequency')
    .eq('campaign_id', campaignId)
    .gte('date', since)
    .order('date', { ascending: true })

  let metrics: CampaignMetrics
  let metricsSource: 'daily' | 'summary' | 'empty'

  if (dailyRows && dailyRows.length > 0) {
    metrics = aggregateDailyMetrics(dailyRows as Array<Record<string, number | null>>)
    metricsSource = 'daily'
  } else if (campaign.metrics) {
    // Fall back to the JSONB summary stored on campaigns.metrics
    metrics = buildMetricsFromCampaignRow(campaign)
    metricsSource = 'summary'
  } else {
    metrics = {
      spend: 0, purchases: 0, revenue: 0, roas: 0, cpa: 0,
      addToCart: 0, initiateCheckout: 0, ctr: 0, frequency: 0,
      cpm: 0, viewContent: 0, impressions: 0, clicks: 0, reach: 0,
    }
    metricsSource = 'empty'
  }

  // ── Run the intelligence pipeline ───────────────────────────
  const intelligence = analyzeCampaign(metrics, DEFAULT_SETTINGS)

  // ── Response ────────────────────────────────────────────────
  return NextResponse.json({
    campaign: {
      id:           campaign.id,
      name:         campaign.name,
      status:       campaign.status,
      dailyBudget:  Number(campaign.daily_budget || 0),
      strategyType: campaign.strategy_type,
      metaCampaignId: campaign.meta_campaign_id,
    },
    period,
    metricsSource,
    daysAnalyzed: dailyRows?.length || 0,
    intelligence,
    settings: DEFAULT_SETTINGS,
  })
}
