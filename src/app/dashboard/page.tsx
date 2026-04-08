// src/app/dashboard/page.tsx — Growth OS dashboard (server component)
import { createClient } from '@/lib/supabase/server'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import SpendChart from '@/components/dashboard/SpendChart'
import HeroLevel from '@/components/dashboard/HeroLevel'
import GrowthProfile from '@/components/dashboard/GrowthProfile'
import NextBestAction from '@/components/dashboard/NextBestAction'
import MonthSummary from '@/components/dashboard/MonthSummary'
import PhaseSummary from '@/components/dashboard/PhaseSummary'
import AchievementsBadges from '@/components/dashboard/AchievementsBadges'
import AlertsOpportunities from '@/components/dashboard/AlertsOpportunities'
import SyncButton from '@/components/dashboard/SyncButton'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import { calculateOnboardingStatus } from '@/lib/onboarding-engine'
import type { Phase } from '@/lib/budget-engine'

const AI_TIPS = [
  'Los anuncios con video generan 3x más engagement que las imágenes estáticas en Instagram.',
  'El mejor horario para publicar en Argentina es entre 7-9 AM y 8-10 PM.',
  'Usar emojis en el texto puede aumentar el CTR hasta un 25% en ciertos rubros.',
  'Las audiencias de retargeting tienen 70% mayor tasa de conversión que las de prospección.',
  'Un ROAS de 3x o más indica una campaña rentable para la mayoría de los negocios.',
  'Los anuncios con precio explícito tienen mayor CTR y menor coste por lead calificado.',
  'El Pixel tarda 7 días en optimizarse. No hagas cambios bruscos antes de ese período.',
]

const STRATEGY_TO_PHASE: Record<string, Phase> = { TOFU: 'F1', BOFU: 'F2', MOFU: 'F3' }

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

function classifyPhase(c: any): Phase {
  const name = (c.name || '').toLowerCase()
  if (/whatsapp|wa\b|mensaje/.test(name)) return 'F4'
  if (/retargeting|remarketing|carrito|tibio|caliente/.test(name)) return 'F3'
  if (c.strategy_type === 'BOFU' || /bofu|conversion|purchase|venta/.test(name)) return 'F2'
  if (c.strategy_type && STRATEGY_TO_PHASE[c.strategy_type]) return STRATEGY_TO_PHASE[c.strategy_type]
  return 'F1'
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
    { data: levelHistory },
    { data: prevMonthReport },
    { data: fbConnection },
  ] = await Promise.all([
    supabase.from('profiles').select('full_name, plan').eq('id', user.id).single(),
    supabase.from('campaigns').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('business_profiles').select('selected_ad_account_id, business_name, currency, pixel_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pixel_analysis').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_budgets').select('*').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
    supabase.from('level_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
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
  const avgRoas  = totalSpend       > 0 ? totalRevenue / totalSpend       : 0
  const avgTicket = totalConversions > 0 ? totalRevenue / totalConversions : 0

  // Trends vs previous month
  const calcTrend = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : undefined
  const trendSpend   = calcTrend(totalSpend,       (prevMonthReport?.total_spend       as number) || 0)
  const trendRevenue = calcTrend(totalRevenue,     (prevMonthReport?.total_revenue     as number) || 0)
  const trendConv    = calcTrend(totalConversions, (prevMonthReport?.total_conversions as number) || 0)
  const trendRoas    = calcTrend(avgRoas,          (prevMonthReport?.avg_roas          as number) || 0)

  // ── Pixel level + next milestone ───────────────────────────────────────
  const level     = pixelAnalysis?.level ?? 0
  const levelName = pixelAnalysis?.level_name ?? 'Sin Data'
  const events    = pixelAnalysis?.events_data
  const nextMetric = nextLevelMetric(level, events)
  const nextLevel = Math.min(level + 1, 8)

  // ── Days remaining in the month ───────────────────────────────────────
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining  = Math.max(0, lastDayOfMonth - now.getDate())

  // ── First level history entry to compute "Desde" ──────────────────────
  const levelSinceEntry = (levelHistory || []).find((h: any) => h.new_level === level)
  const levelSinceDate  = levelSinceEntry?.created_at || null

  // ── Growth score: simple formula tied to real progress ────────────────
  const growthScore =
    level * 100 +
    Math.min(200, (events?.PageView?.count_30d  ?? 0) / 5) +
    Math.min(150, (events?.Purchase?.count_180d ?? 0) * 2) +
    allCampaigns.length * 10

  // ── Phase data ─────────────────────────────────────────────────────────
  const recommendedByPhase = (monthlyBudget?.phase_budgets_recommended as Record<string, number>) || {}
  const assignedByPhase    = (monthlyBudget?.phase_budgets             as Record<string, number>) || {}

  const phaseAccum: Record<Phase, { spend: number; revenue: number; roas: number; conversions: number; count: number }> = {
    F1: { spend: 0, revenue: 0, roas: 0, conversions: 0, count: 0 },
    F2: { spend: 0, revenue: 0, roas: 0, conversions: 0, count: 0 },
    F3: { spend: 0, revenue: 0, roas: 0, conversions: 0, count: 0 },
    F4: { spend: 0, revenue: 0, roas: 0, conversions: 0, count: 0 },
  }
  for (const c of monthCampaigns) {
    const ph = classifyPhase(c)
    const sp = c.metrics?.spend || 0
    phaseAccum[ph].spend       += sp
    phaseAccum[ph].revenue     += (c.metrics?.roas || 0) * sp
    phaseAccum[ph].roas        += c.metrics?.roas || 0
    phaseAccum[ph].conversions += c.metrics?.conversions || 0
    phaseAccum[ph].count       += 1
  }

  function deriveStatus(ph: Phase, roas: number, count: number): 'healthy' | 'risk' | 'optimize' | 'locked' {
    // F3 needs ViewContent retarget ability; F2 BOFU needs purchase ability
    if (ph === 'F3' && !pixelAnalysis?.can_retarget_view_content) return 'locked'
    if (ph === 'F2' && !pixelAnalysis?.can_retarget_purchase && level < 5) return 'locked'
    if (count === 0) return 'optimize'
    if (roas >= 2) return 'healthy'
    if (roas >= 1) return 'risk'
    return 'optimize'
  }

  const phaseInsights: Record<Phase, string> = {
    F1: 'Generá tráfico para alimentar el pixel',
    F2: 'Convertí audiencias frías en compradores',
    F3: 'Recuperá visitantes que no compraron',
    F4: 'Convertí consultas en ventas por chat',
  }

  const phaseData: Record<Phase, any> = {} as any
  for (const ph of ['F1', 'F2', 'F3', 'F4'] as Phase[]) {
    const acc = phaseAccum[ph]
    const phaseRoas = acc.count > 0 ? acc.roas / acc.count : 0
    phaseData[ph] = {
      recommended: recommendedByPhase[ph] ?? assignedByPhase[ph] ?? 0,
      spent:       acc.spend,
      roas:        phaseRoas,
      conversions: acc.conversions,
      status:      deriveStatus(ph, phaseRoas, acc.count),
      insight:     phaseInsights[ph],
    }
  }

  const showOnboarding = !allCampaigns.length && !businessProfile?.selected_ad_account_id
  const todayTip = AI_TIPS[new Date().getDay()]
  const fullName = profile?.full_name?.split(' ')[0] || 'crecedor'
  const currency = businessProfile?.currency === 'USD' ? '$' : (businessProfile?.currency || '$')

  return (
    <>
      <OnboardingWizard show={showOnboarding} />

      <div>
        {/* ── Sync control (top-right, above hero) ────────────────────── */}
        <div className="flex justify-end mb-4 dash-anim-1">
          <SyncButton variant="full" />
        </div>

        {/* ── Onboarding checklist (only if setup incomplete) ─────────── */}
        {!onboardingStatus.isComplete && <OnboardingChecklist status={onboardingStatus} />}

        {/* ── BLOCK A: Hero ────────────────────────────────────────────── */}
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

        {/* ── BLOCK B: Growth profile ─────────────────────────────────── */}
        <GrowthProfile
          level={level}
          levelName={levelName}
          levelSinceDate={levelSinceDate}
          growthScore={Math.round(growthScore)}
          availableStrategies={(pixelAnalysis?.available_strategies as string[]) || ['TOFU']}
          canRetargetVC={!!pixelAnalysis?.can_retarget_view_content}
          canRetargetATC={!!pixelAnalysis?.can_retarget_add_to_cart}
          canRetargetPurchase={!!pixelAnalysis?.can_retarget_purchase}
          canCreateLookalike={!!pixelAnalysis?.can_create_lookalike}
          metricCurrent={nextMetric.current}
          metricRequired={nextMetric.required}
          metricLabel={nextMetric.label}
        />

        {/* ── BLOCK C: Next best action (GPS) ─────────────────────────── */}
        <NextBestAction />

        {/* ── BLOCK D: Month summary ──────────────────────────────────── */}
        <MonthSummary
          totalSpend={totalSpend}
          totalRevenue={totalRevenue}
          totalConversions={totalConversions}
          avgRoas={avgRoas}
          avgTicket={avgTicket}
          trendSpend={trendSpend}
          trendRevenue={trendRevenue}
          trendRoas={trendRoas}
          trendConv={trendConv}
          events={events}
          currency={currency}
        />

        {/* ── BLOCK E: Phase summary ──────────────────────────────────── */}
        <PhaseSummary currency={currency} phaseData={phaseData} />

        {/* ── BLOCK F: Achievements ───────────────────────────────────── */}
        <AchievementsBadges />

        {/* ── BLOCK G: Alerts + opportunities ─────────────────────────── */}
        <AlertsOpportunities />

        {/* ── BLOCK H: Spend chart + tip of the day ───────────────────── */}
        <div className="grid grid-cols-3 gap-6 mb-6 dash-anim-6">
          <div className="col-span-2 card p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                Gasto semanal
              </h2>
              <span style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20,
                background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)',
                border: '1px solid var(--ds-color-primary-soft)',
              }}>
                Últimos 7 días
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 16 }}>
              Cuánto invertiste cada día de la semana
            </p>
            <SpendChart totalSpend={totalSpend} />
          </div>

          <div className="card p-5" style={{
            background: 'linear-gradient(135deg, var(--ds-color-primary-soft) 0%, transparent 100%)',
            border: '1px solid var(--ds-color-primary-soft)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, marginBottom: 14,
              background: 'var(--ds-color-primary-soft)',
              border: '1px solid var(--ds-color-primary-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              boxShadow: '0 0 16px var(--ds-color-primary-border)',
            }}>
              💡
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Tip del día
            </p>
            <p style={{ fontSize: 13, color: 'var(--ds-text-primary)', lineHeight: 1.65 }}>
              {todayTip}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
