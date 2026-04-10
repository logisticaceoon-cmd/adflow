// src/app/dashboard/page.tsx — Growth OS dashboard (server component)
// Clean layout: Hero → Next Action → Month Metrics → Setup → Tip+Objetivo
import { createClient } from '@/lib/supabase/server'
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

const AI_TIPS = [
  'Los anuncios con video generan 3x más engagement que las imágenes estáticas en Instagram.',
  'El mejor horario para publicar en Argentina es entre 7-9 AM y 8-10 PM.',
  'Usar emojis en el texto puede aumentar el CTR hasta un 25% en ciertos rubros.',
  'Las audiencias de retargeting tienen 70% mayor tasa de conversión que las de prospección.',
  'Un ROAS de 3x o más indica una campaña rentable para la mayoría de los negocios.',
  'Los anuncios con precio explícito tienen mayor CTR y menor coste por lead calificado.',
  'El Pixel tarda 7 días en optimizarse. No hagas cambios bruscos antes de ese período.',
]

const LEVEL_NAMES = ['Sin Data', 'Explorador', 'Aprendiz', 'Estratega', 'Vendedor', 'Profesional', 'Escalador', 'Maestro', 'Imperio']
const UNLOCK_TEASERS: Record<number, string> = {
  0: 'búsqueda de intereses reales en Meta',
  1: 'audiencias por intereses específicos',
  2: 'retargeting de visitantes web (estrategia MOFU)',
  3: 'retargeting de carrito abandonado',
  4: 'retargeting de compradores y BOFU',
  5: 'lookalike audiences inteligentes',
  6: 'audiencias maestras y escalado avanzado',
  7: 'expansión global a nuevas audiencias',
}

function nextLevelMetric(level: number, events: any) {
  const map: Record<number, { current: number; required: number; label: string }> = {
    0: { current: events?.PageView?.count_30d    ?? 0, required: 100,  label: 'PageView (30d)' },
    1: { current: events?.PageView?.count_30d    ?? 0, required: 500,  label: 'PageView (30d)' },
    2: { current: events?.ViewContent?.count_30d ?? 0, required: 1000, label: 'ViewContent (30d)' },
    3: { current: events?.AddToCart?.count_30d   ?? 0, required: 100,  label: 'AddToCart (30d)' },
    4: { current: events?.Purchase?.count_30d    ?? 0, required: 50,   label: 'Purchase (30d)' },
    5: { current: events?.Purchase?.count_30d    ?? 0, required: 100,  label: 'Purchase (30d)' },
    6: { current: events?.Purchase?.count_180d   ?? 0, required: 500,  label: 'Purchase (180d)' },
    7: { current: events?.Purchase?.count_180d   ?? 0, required: 1000, label: 'Purchase (180d)' },
  }
  return map[level] || { current: 0, required: 0, label: '' }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { data: profile },
    { data: campaigns },
    { data: businessProfile },
    { data: pixelAnalysis },
    { data: monthlyBudget },
    { data: prevMonthReport },
    { data: fbConnection },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, plan').eq('id', user.id).single(),
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

  const allCampaigns = (campaigns || []) as any[]
  const monthCampaigns = allCampaigns.filter(c => new Date(c.created_at) >= new Date(firstDayMonth))

  // ── Aggregate metrics ──────────────────────────────────────────────────
  const totalSpend       = monthCampaigns.reduce((s, c) => s + (c.metrics?.spend       || 0), 0)
  const totalRevenue     = monthCampaigns.reduce((s, c) => s + ((c.metrics?.roas || 0) * (c.metrics?.spend || 0)), 0)
  const totalConversions = monthCampaigns.reduce((s, c) => s + (c.metrics?.conversions || 0), 0)
  const avgRoas          = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Impressions, reach, frequency, CPM — aggregated from campaign metrics
  const totalImpressions = monthCampaigns.reduce((s, c) => s + (c.metrics?.impressions || 0), 0)
  const totalReach       = monthCampaigns.reduce((s, c) => s + (c.metrics?.reach       || 0), 0)
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

  // ── Pixel level + next milestone ───────────────────────────────────────
  const level     = pixelAnalysis?.level ?? 0
  const levelName = pixelAnalysis?.level_name ?? 'Sin Data'
  const nextMetric = nextLevelMetric(level, events)
  const nextLevel = Math.min(level + 1, 8)

  // ── Days remaining in the month ───────────────────────────────────────
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining  = Math.max(0, lastDayOfMonth - now.getDate())

  const showOnboarding = !allCampaigns.length && !businessProfile?.selected_ad_account_id
  const todayTip = AI_TIPS[new Date().getDay()]
  const fullName = profile?.full_name?.split(' ')[0] || 'crecedor'
  const currency = businessProfile?.currency === 'USD' ? '$' : (businessProfile?.currency || '$')

  // ── Budget goal ────────────────────────────────────────────────────────
  const budgetTotal = (monthlyBudget?.total_budget as number) || 0
  const budgetPct   = budgetTotal > 0 ? Math.min(100, Math.round((totalSpend / budgetTotal) * 100)) : 0

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
    budgetTotal,
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

      {/* ═══ BLOQUE 1 — HERO: Bienvenida + Estado + 4 KPIs ═══ */}
      <div className="module-enter module-enter-1">
        <HeroLevel
          fullName={fullName}
          level={level}
          levelName={levelName}
          metricCurrent={nextMetric.current}
          metricRequired={nextMetric.required}
          metricLabel={nextMetric.label}
          nextLevel={nextLevel}
          nextLevelName={LEVEL_NAMES[nextLevel]}
          unlockTeaser={UNLOCK_TEASERS[level] || 'nuevas estrategias y audiencias'}
          monthSpend={totalSpend}
          monthSales={totalConversions}
          monthRoas={avgRoas}
          daysRemaining={daysRemaining}
          hasPixel={!!pixelAnalysis}
        />
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

      {/* ═══ BLOQUE 5 — TIP + OBJETIVO DEL MES ═══ */}
      <div className="module-enter module-enter-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tip del día */}
        <div className="card" style={{ padding: 'var(--ds-space-lg)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, marginBottom: 12,
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid var(--ds-color-primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            💡
          </div>
          <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--ds-color-primary)',
            textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
          }}>
            Tip del día
          </p>
          <p style={{ fontSize: 13, color: 'var(--ds-text-primary)', lineHeight: 1.6 }}>
            {todayTip}
          </p>
        </div>

        {/* Objetivo del mes */}
        <div className="card" style={{ padding: 'var(--ds-space-lg)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, marginBottom: 12,
            background: budgetTotal > 0 ? 'var(--ds-color-success-soft)' : 'var(--ds-color-primary-soft)',
            border: `1px solid ${budgetTotal > 0 ? 'var(--ds-color-success-border)' : 'var(--ds-color-primary-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>
            🎯
          </div>
          <p style={{
            fontSize: 10, fontWeight: 600,
            color: budgetTotal > 0 ? 'var(--ds-color-success)' : 'var(--ds-color-primary)',
            textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6,
          }}>
            Objetivo del mes
          </p>
          {budgetTotal > 0 ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--ds-text-primary)', lineHeight: 1.6, marginBottom: 10 }}>
                Presupuesto: <strong>{currency}{budgetTotal.toLocaleString()}</strong> — {budgetPct}% ejecutado
              </p>
              <div className="progress-bar" style={{ height: 6 }}>
                <div
                  className="progress-bar-fill"
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.6 }}>
              Todavía no configuraste un presupuesto mensual.{' '}
              <a href="/dashboard/budget" style={{ color: 'var(--ds-color-primary)', textDecoration: 'underline' }}>
                Configurar →
              </a>
            </p>
          )}
        </div>
      </div>
    </>
  )
}
