// src/app/dashboard/page.tsx — Growth OS dashboard (server component)
// Clean layout: Hero → Next Action → Month Metrics → Setup → Tip+Objetivo
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email/transactional'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import HeroLevel from '@/components/dashboard/HeroLevel'
import NextBestAction from '@/components/dashboard/NextBestAction'
import MonthSummary from '@/components/dashboard/MonthSummary'
import SyncButton from '@/components/dashboard/SyncButton'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import { calculateOnboardingStatus } from '@/lib/onboarding-engine'
import { generateStrategicDecisions, type DecisionInput } from '@/lib/decision-engine'
import { getDecisionMemory, saveDecision, detectCompletedActions } from '@/lib/memory-engine'
import { countPendingExecutions } from '@/lib/automation-engine'

// AI_TIPS removed — was static array, not actionable. Tips belong in contextual help.

// Level system removed — gamification eliminated from UI

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  // Fecha (sin hora) del primer día del mes, para filtrar campaign_metrics_daily.date
  const firstDayMonthDate = `${monthYear}-01`

  const [
    { data: profile },
    { data: campaigns },
    { data: businessProfile },
    { data: pixelAnalysis },
    { data: monthlyBudget },
    { data: prevMonthReport },
    { data: fbConnection },
    { data: monthMetrics },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, plan, report_email, welcome_email_sent').eq('id', user.id).single(),
    supabase.from('campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('business_profiles').select('selected_ad_account_id, business_name, currency, pixel_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pixel_analysis').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_budgets').select('*').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
    supabase.from('monthly_reports').select('total_spend, total_revenue, total_conversions, avg_roas')
      .eq('user_id', user.id)
      .lt('month_year', monthYear)
      .order('month_year', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('facebook_connections').select('access_token').eq('user_id', user.id).maybeSingle(),
    // Métricas reales del mes en curso desde la tabla diaria (fuente de verdad).
    // Antes se sumaba campaigns.metrics (ventana variable según el último sync) y
    // solo campañas creadas este mes → cifras incoherentes. Ahora es gasto MTD real.
    supabase.from('campaign_metrics_daily')
      .select('spend, impressions, reach, clicks, purchases, purchase_value')
      .eq('user_id', user.id)
      .gte('date', firstDayMonthDate),
  ])

  // ── Onboarding status ──────────────────────────────────────────────────
  const onboardingStatus = calculateOnboardingStatus({
    hasFbConnection: !!fbConnection?.access_token,
    hasAdAccount: !!businessProfile?.selected_ad_account_id,
    hasPixel: !!businessProfile?.pixel_id,
    pixelLevel: pixelAnalysis?.level ?? null,
    hasBudget: !!monthlyBudget,
    campaignCount: (campaigns || []).length,
  })

  // ── Email de bienvenida (una sola vez, best-effort, no bloquea el render) ─
  if (profile && !(profile as any).welcome_email_sent && (profile as any).report_email) {
    const admin = createAdminClient()
    // Claim idempotente: solo un render marca la bandera y envía.
    const { data: claimed } = await admin
      .from('profiles')
      .update({ welcome_email_sent: true })
      .eq('id', user.id)
      .eq('welcome_email_sent', false)
      .select('id')
    if (claimed && claimed.length > 0) {
      await sendWelcomeEmail((profile as any).report_email, (profile as any).full_name?.split(' ')[0])
    }
  }

  const allCampaigns = (campaigns || []) as any[]

  // ── Aggregate metrics — gasto real del mes (MTD) desde la tabla diaria ───
  // Suma día por día de TODAS las campañas activas en el mes (no solo las
  // creadas este mes), con ventana fija = mes calendario actual.
  const dailyRows = (monthMetrics || []) as Array<{
    spend?: number; impressions?: number; reach?: number
    clicks?: number; purchases?: number; purchase_value?: number
  }>
  const totalSpend       = dailyRows.reduce((s, r) => s + (Number(r.spend)          || 0), 0)
  const totalRevenue     = dailyRows.reduce((s, r) => s + (Number(r.purchase_value) || 0), 0)
  const totalConversions = dailyRows.reduce((s, r) => s + (Number(r.purchases)      || 0), 0)
  const avgRoas          = totalSpend > 0 ? totalRevenue / totalSpend : 0

  const totalImpressions = dailyRows.reduce((s, r) => s + (Number(r.impressions) || 0), 0)
  const totalReach       = dailyRows.reduce((s, r) => s + (Number(r.reach)       || 0), 0)
  const avgCpm           = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0
  const avgFrequency     = totalReach > 0 ? totalImpressions / totalReach : 0

  // Carts from pixel events
  const events    = pixelAnalysis?.events_data
  const totalCarts = events?.AddToCart?.count_30d ?? 0

  // Trends vs previous month
  const calcTrend = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : undefined
  const trendSpend   = calcTrend(totalSpend,       (prevMonthReport?.total_spend       as number) || 0)
  const trendRevenue = calcTrend(totalRevenue,     (prevMonthReport?.total_revenue     as number) || 0)
  const trendConv    = calcTrend(totalConversions, (prevMonthReport?.total_conversions as number) || 0)
  const trendRoas    = calcTrend(avgRoas,          (prevMonthReport?.avg_roas          as number) || 0)

  // ── Days remaining in the month ───────────────────────────────────────
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining  = Math.max(0, lastDayOfMonth - now.getDate())

  const showOnboarding = !allCampaigns.length && !businessProfile?.selected_ad_account_id
  const fullName = profile?.full_name?.split(' ')[0] || 'crecedor'
  const currency = businessProfile?.currency === 'USD' ? '$' : (businessProfile?.currency || '$')

  // ── Strategic decision engine ───────────────────────────────────────────
  const bestRoasCampaign = allCampaigns.reduce<{ name: string; roas: number; id: string } | undefined>((best, c) => {
    const roas = c.metrics?.roas || 0
    if (roas > 0 && (!best || roas > best.roas)) return { name: c.name, roas, id: c.id }
    return best
  }, undefined)
  const worstRoasCampaign = allCampaigns.reduce<{ name: string; roas: number; id: string } | undefined>((worst, c) => {
    const roas = c.metrics?.roas || 0
    if (roas > 0 && (!worst || roas < worst.roas)) return { name: c.name, roas, id: c.id }
    return worst
  }, undefined)

  const totalCpa = totalConversions > 0 ? totalSpend / totalConversions : 0
  const budgetSpent = (pixelAnalysis ? totalSpend : 0)
  const lastSyncAt: string | undefined = allCampaigns
    .map(c => (c.metrics as any)?.last_sync as string | undefined)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  // ── Strategic memory ───────────────────────────────────────────────────
  let memorySnapshot: Awaited<ReturnType<typeof getDecisionMemory>> | null = null
  try {
    await detectCompletedActions(user.id)
    memorySnapshot = await getDecisionMemory(user.id, 7)
  } catch {
    memorySnapshot = null
  }

  let pendingAutomationCount = 0
  try { pendingAutomationCount = await countPendingExecutions(user.id) } catch { /* ignore */ }

  const decisionInput: DecisionInput = {
    onboardingComplete:       onboardingStatus.isComplete,
    onboardingNextStep:       onboardingStatus.nextStep
      ? { label: onboardingStatus.steps[onboardingStatus.nextStep].label, href: onboardingStatus.steps[onboardingStatus.nextStep].href }
      : undefined,
    onboardingCompletedSteps: onboardingStatus.completedSteps,
    onboardingTotalSteps:     onboardingStatus.totalSteps,

    pixelConfigured:     !!businessProfile?.pixel_id,
    pixelLevel:          pixelAnalysis?.level || 0,
    pixelLevelName:      (pixelAnalysis?.level_name as string) || 'Sin Data',
    pageViews30d:        events?.PageView?.count_30d || 0,
    viewContent30d:      events?.ViewContent?.count_30d || 0,
    addToCart30d:        events?.AddToCart?.count_30d || 0,
    purchases30d:        events?.Purchase?.count_30d || 0,
    purchases180d:       events?.Purchase?.count_180d || 0,
    canRetargetVC:       !!pixelAnalysis?.can_retarget_view_content,
    canRetargetATC:      !!pixelAnalysis?.can_retarget_add_to_cart,
    canRetargetPurchase: !!pixelAnalysis?.can_retarget_purchase,
    canCreateLookalike:  !!pixelAnalysis?.can_create_lookalike,

    totalCampaigns:    allCampaigns.length,
    activeCampaigns:   allCampaigns.filter(c => c.status === 'active').length,
    totalSpendMonth:   totalSpend,
    totalRevenueMonth: totalRevenue,
    avgRoas,
    avgCpa:            totalCpa,
    bestRoasCampaign,
    worstRoasCampaign,

    hasBudget:   !!monthlyBudget,
    budgetTotal: (monthlyBudget?.total_budget as number) || 0,
    budgetSpent,

    metaConnected: !!fbConnection?.access_token,
    tokenExpiresAt: undefined,
    lastSyncAt,

    pendingAutomationCount,

    memory: memorySnapshot ? {
      ignoredActions:        memorySnapshot.ignoredActions,
      completedActions:      memorySnapshot.completedActions,
      repeatedSuggestions:   memorySnapshot.repeatedSuggestions,
      lastSuggestedActionId: memorySnapshot.lastSuggestedActionId,
    } : undefined,
  }

  const decisions = generateStrategicDecisions(decisionInput)

  try {
    await saveDecision({
      userId:                user.id,
      primaryActionId:       decisions.primaryAction.id,
      primaryActionTitle:    decisions.primaryAction.title,
      primaryActionPriority: decisions.primaryAction.priority,
      primaryActionImpact:   decisions.primaryAction.impact,
      primaryActionReason:   decisions.primaryAction.reason,
      secondaryActionIds:    decisions.secondaryActions.map(a => a.id),
      contextSnapshot:       decisions.contextSnapshot,
    })
  } catch {
    /* memory write failure never breaks the dashboard */
  }

  return (
    <>
      <OnboardingWizard show={showOnboarding} />

      {/* Sync control */}
      <div className="flex justify-end mb-4 dash-anim-1">
        <SyncButton variant="full" />
      </div>

      {/* ═══ BLOQUE 1 — HERO: Bienvenida + Nivel + Progress ═══ */}
      <div className="module-enter module-enter-1">
        <HeroLevel fullName={fullName} />
      </div>

      {/* ═══ BLOQUE 2 — SIGUIENTE ACCIÓN ═══ */}
      <div className="module-enter module-enter-2">
        <NextBestAction
          primaryAction={decisions.primaryAction}
          secondaryActions={decisions.secondaryActions}
        />
      </div>

      {/* ═══ BLOQUE 3 — MÉTRICAS DEL MES (7 business KPIs) ═══ */}
      <div className="module-enter module-enter-3">
        <MonthSummary
          totalSpend={totalSpend}
          totalRevenue={totalRevenue}
          totalConversions={totalConversions}
          totalCarts={totalCarts}
          avgRoas={avgRoas}
          avgCpm={avgCpm}
          avgFrequency={avgFrequency}
          trendSpend={trendSpend}
          trendRevenue={trendRevenue}
          trendRoas={trendRoas}
          trendConv={trendConv}
          currency={currency}
        />
      </div>

      {/* ═══ BLOQUE 4 — SETUP (solo si incompleto) ═══ */}
      {!onboardingStatus.isComplete && (
        <div className="module-enter module-enter-4">
          <OnboardingChecklist status={onboardingStatus} />
        </div>
      )}

      {/* Tip + Objetivo removidos — información no accionable / duplicada con /budget */}
    </>
  )
}
