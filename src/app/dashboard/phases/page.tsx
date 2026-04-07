// src/app/dashboard/phases/page.tsx — Phases dashboard (premium UX)
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PHASES, type Phase } from '@/lib/budget-engine'
import PhaseChart from '@/components/dashboard/PhaseChart'
import SyncButton from '@/components/dashboard/SyncButton'

interface CampaignRow {
  name: string
  status: string
  strategy_type: string | null
  daily_budget: number
  metrics: { roas?: number; spend?: number; conversions?: number; cpa?: number; revenue?: number } | null
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const PHASE_MIN_LEVEL: Record<Phase, number> = { F1: 0, F2: 0, F3: 3, F4: 0 }

function classifyPhase(c: CampaignRow): Phase {
  const name = (c.name || '').toLowerCase()
  if (/whatsapp|wa\b|mensaje/.test(name)) return 'F4'
  if (/retargeting|remarketing|carrito|tibio|caliente/.test(name)) return 'F3'
  if (c.strategy_type === 'BOFU' || /bofu|conversion|purchase|venta/.test(name)) return 'F2'
  return 'F1'
}

interface PhaseAccum {
  spend: number
  revenue: number
  conversions: number
  count: number
  recommended: number
  assigned: number
}

function deriveStatus(ph: Phase, acc: PhaseAccum, level: number): {
  key: 'healthy' | 'risk' | 'optimize' | 'locked'
  label: string
  color: string
} {
  if (level < PHASE_MIN_LEVEL[ph]) return { key: 'locked', label: '🔒 No disponible', color: '#8892b0' }
  const roas = acc.count > 0 ? acc.revenue / acc.spend : 0
  const overspent = acc.assigned > 0 && acc.spend > acc.assigned * 1.20
  if (acc.count === 0) return { key: 'optimize', label: '🔧 Por activar', color: '#f9a8d4' }
  if (overspent) return { key: 'risk', label: '⚠️ En riesgo', color: '#fbbf24' }
  if (ph === 'F1') return { key: 'healthy', label: '✅ Saludable', color: '#06d6a0' }
  if (roas >= 2) return { key: 'healthy', label: '✅ Saludable', color: '#06d6a0' }
  if (roas >= 1) return { key: 'risk', label: '⚠️ En riesgo', color: '#fbbf24' }
  return { key: 'optimize', label: '🔧 Por optimizar', color: '#f9a8d4' }
}

const PHASE_INSIGHT: Record<Phase, (acc: PhaseAccum) => string> = {
  F1: () => 'Normal: F1 busca tráfico, no ROAS inmediato. Su trabajo es alimentar el funnel.',
  F2: acc => {
    const r = acc.spend > 0 ? acc.revenue / acc.spend : 0
    return r >= 3 ? '🔥 F2 muy rentable. Considerá escalar.'
      : r >= 2 ? 'F2 saludable. ROAS dentro del rango esperado.'
      : r > 0  ? '⚠️ F2 por debajo del punto de equilibrio. Revisá creativos y audiencias.'
      : 'F2 sin datos de conversión todavía. Esperá unos días.'
  },
  F3: acc => {
    const r = acc.spend > 0 ? acc.revenue / acc.spend : 0
    return r >= 4 ? '🔥 Tu remarketing es muy rentable. Considerá aumentar presupuesto.'
      : r >= 2 ? 'Remarketing saludable. F3 suele ser tu mejor fase.'
      : r > 0  ? 'Remarketing dando resultados modestos. Revisá creativos de remarketing.'
      : 'F3 todavía calentando. Necesita audiencias más maduras.'
  },
  F4: () => 'WhatsApp genera leads directos. Medí también por conversaciones, no solo ROAS.',
}

function generateInsights(grouped: Record<Phase, PhaseAccum>, level: number): Array<{ icon: string; text: string; action?: { label: string; href: string } }> {
  const insights: Array<{ icon: string; text: string; action?: { label: string; href: string } }> = []

  // Find best ROAS phase
  let bestRoas = 0
  let bestPhase: Phase | null = null
  for (const ph of ['F1','F2','F3','F4'] as Phase[]) {
    const acc = grouped[ph]
    if (acc.count > 0 && acc.spend > 0) {
      const r = acc.revenue / acc.spend
      if (r > bestRoas) { bestRoas = r; bestPhase = ph }
    }
  }
  if (bestPhase && bestRoas >= 2 && bestPhase !== 'F1') {
    insights.push({
      icon: '📈',
      text: `Tu ${bestPhase} tiene el mejor ROAS (${bestRoas.toFixed(1)}x). Considerá mover parte del presupuesto de otras fases hacia ${bestPhase}.`,
      action: { label: 'Ajustar presupuesto →', href: '/dashboard/budget' },
    })
  }

  // Underspending check
  for (const ph of ['F1','F2','F3','F4'] as Phase[]) {
    const acc = grouped[ph]
    if (acc.assigned > 0 && acc.spend < acc.assigned * 0.5 && acc.count > 0) {
      insights.push({
        icon: '⚠️',
        text: `Estás gastando menos de la mitad de lo planeado en ${ph}. ¿Necesitás más creativos o ajustar audiencias?`,
        action: { label: 'Crear campaña →', href: '/dashboard/create' },
      })
      break
    }
  }

  // Locked phase note
  for (const ph of ['F2','F3'] as Phase[]) {
    if (level < PHASE_MIN_LEVEL[ph]) {
      insights.push({
        icon: '🔒',
        text: `${ph} sigue bloqueado. Tu pixel necesita más datos para desbloquear esta fase. Invertí más en F1.`,
        action: { label: 'Ver mi pixel →', href: '/dashboard/pixel' },
      })
      break
    }
  }

  // Low/no campaigns
  const totalCount = (Object.values(grouped) as PhaseAccum[]).reduce((s, a) => s + a.count, 0)
  if (totalCount === 0) {
    insights.push({
      icon: '💡',
      text: 'Aún no tenés campañas creadas este mes. Lanzá tu primera campaña para empezar a generar datos.',
      action: { label: 'Crear campaña →', href: '/dashboard/create' },
    })
  } else if (totalCount < 3) {
    insights.push({
      icon: '💡',
      text: 'Tenés pocas campañas activas. Más variedad de creativos = más datos para optimizar.',
      action: { label: 'Crear campaña →', href: '/dashboard/create' },
    })
  }

  // F1 healthy note
  const f1Acc = grouped.F1
  if (f1Acc.count > 0 && f1Acc.spend > 0) {
    insights.push({
      icon: '📊',
      text: 'Tu F1 está alimentando el funnel. Cada visitante es data nueva para tu pixel.',
    })
  }

  return insights.slice(0, 5)
}

export default async function PhasesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [{ data: campaigns }, { data: budget }, { data: pixelAnalysis }, { data: dailyMetrics }] = await Promise.all([
    supabase.from('campaigns').select('name, status, strategy_type, daily_budget, metrics').eq('user_id', user.id),
    supabase.from('monthly_budgets').select('total_budget, currency, phase_budgets, phase_budgets_recommended').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
    supabase.from('pixel_analysis').select('level, level_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('campaign_metrics_daily')
      .select('phase, spend, purchase_value, purchases, clicks, impressions')
      .eq('user_id', user.id)
      .gte('date', firstDay)
      .lte('date', lastDay),
  ])

  const rows = (campaigns || []) as CampaignRow[]
  const level = pixelAnalysis?.level ?? 0
  const currency = (budget?.currency as string) || 'USD'
  const phaseBudgets    = (budget?.phase_budgets as Record<string, number>) || {}
  const phaseBudgetsRec = (budget?.phase_budgets_recommended as Record<string, number>) || {}

  const grouped: Record<Phase, PhaseAccum> = {
    F1: { spend: 0, revenue: 0, conversions: 0, count: 0, recommended: phaseBudgetsRec.F1 ?? 0, assigned: phaseBudgets.F1 ?? 0 },
    F2: { spend: 0, revenue: 0, conversions: 0, count: 0, recommended: phaseBudgetsRec.F2 ?? 0, assigned: phaseBudgets.F2 ?? 0 },
    F3: { spend: 0, revenue: 0, conversions: 0, count: 0, recommended: phaseBudgetsRec.F3 ?? 0, assigned: phaseBudgets.F3 ?? 0 },
    F4: { spend: 0, revenue: 0, conversions: 0, count: 0, recommended: phaseBudgetsRec.F4 ?? 0, assigned: phaseBudgets.F4 ?? 0 },
  }

  // Count how many campaigns fall into each phase (for the "X campañas" label)
  for (const c of rows) {
    grouped[classifyPhase(c)].count += 1
  }

  // ── Real aggregated metrics from campaign_metrics_daily (month-to-date) ──
  for (const m of (dailyMetrics || []) as any[]) {
    const ph = (m.phase as Phase) || 'F2'
    if (!grouped[ph]) continue
    grouped[ph].spend       += Number(m.spend)          || 0
    grouped[ph].revenue     += Number(m.purchase_value) || 0
    grouped[ph].conversions += Number(m.purchases)      || 0
  }

  const totals = (Object.values(grouped) as PhaseAccum[]).reduce(
    (acc, p) => ({
      spend: acc.spend + p.spend,
      revenue: acc.revenue + p.revenue,
      conversions: acc.conversions + p.conversions,
      recommended: acc.recommended + p.recommended,
      assigned: acc.assigned + p.assigned,
    }),
    { spend: 0, revenue: 0, conversions: 0, recommended: 0, assigned: 0 },
  )
  const totalRoas = totals.spend > 0 ? totals.revenue / totals.spend : 0

  const insights = generateInsights(grouped, level)
  const hasAnyData = totals.spend > 0 || Object.keys(phaseBudgets).length > 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── SECTION A: HERO ───────────────────────────────────────────── */}
      <div className="dash-anim-1 mb-6" style={{
        position: 'relative',
        borderRadius: 22, padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(98,196,176,0.10) 0%, rgba(245,158,11,0.05) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(98,196,176,0.55), rgba(245,158,11,0.40), transparent)',
        }} />
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#62c4b0', marginBottom: 8 }}>
          Phase Performance · AdFlow
        </p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
          color: '#fff', marginBottom: 8, letterSpacing: '-0.03em',
        }}>
          Rendimiento por fases 🎯
        </h1>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)', maxWidth: 580, lineHeight: 1.55, marginBottom: 14 }}>
          Compará lo planeado vs lo real y encontrá oportunidades de optimización en cada fase del funnel.
        </p>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(98,196,176,0.10)',
            border: '1px solid rgba(98,196,176,0.30)',
            fontSize: 12, fontWeight: 600, color: '#62c4b0',
          }}>
            📅 {monthLabel}
          </span>
          <SyncButton variant="compact" />
        </div>
      </div>

      {!hasAnyData ? (
        <div className="card p-12 text-center">
          <div style={{ fontSize: 48, marginBottom: 18 }}>📊</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Aún no tenés datos por fases este mes
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 22, maxWidth: 420, margin: '0 auto 22px' }}>
            Configurá tu presupuesto del mes y publicá campañas para ver cómo está rindiendo cada fase del funnel.
          </p>
          <Link href="/dashboard/budget" className="btn-primary">
            Configurar presupuesto →
          </Link>
        </div>
      ) : (
        <>
          {/* ── SECTION B: 4 PHASE CARDS ──────────────────────────────── */}
          <div className="mb-6">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Resumen ejecutivo por fase
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
              Cada fase con su estado, presupuesto y rendimiento del mes
            </p>

            <div className="grid grid-cols-2 gap-4">
              {PHASES.map(p => {
                const acc = grouped[p.key]
                const status = deriveStatus(p.key, acc, level)
                const isLocked = status.key === 'locked'
                const phaseRoas = acc.spend > 0 ? acc.revenue / acc.spend : 0
                const cpa = acc.conversions > 0 ? acc.spend / acc.conversions : 0
                const budgetPct = acc.assigned > 0 ? Math.min(100, (acc.spend / acc.assigned) * 100) : 0
                const insight = isLocked
                  ? 'Esta fase se desbloquea cuando tu pixel tenga más datos. Invertí en F1 para llegar más rápido.'
                  : PHASE_INSIGHT[p.key](acc)

                return (
                  <div key={p.key} className="card p-5" style={{
                    borderTop: `2px solid ${isLocked ? '#5a6478' : p.color}`,
                    opacity: isLocked ? 0.55 : 1,
                    background: isLocked
                      ? 'rgba(255,255,255,0.02)'
                      : `linear-gradient(160deg, rgba(18,4,10,0.92), rgba(12,3,7,0.96))`,
                    boxShadow: status.key === 'healthy'
                      ? `0 8px 32px rgba(0,0,0,0.40), 0 0 32px ${p.color}15`
                      : '0 8px 32px rgba(0,0,0,0.40)',
                  }}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 44, height: 44, borderRadius: 12,
                          background: `${p.color}20`, border: `1px solid ${p.color}50`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                          boxShadow: isLocked ? 'none' : `0 0 16px ${p.color}30`,
                        }}>{p.icon}</div>
                        <div>
                          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: p.color }}>
                            {p.fullName}
                          </p>
                          <p style={{ fontSize: 10.5, color: 'var(--muted)' }}>{p.objective}</p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 99,
                        background: `${status.color}15`,
                        color: status.color,
                        border: `1px solid ${status.color}40`,
                        whiteSpace: 'nowrap',
                      }}>{status.label}</span>
                    </div>

                    {/* Budget bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', fontWeight: 700 }}>
                          Inversión
                        </span>
                        <span style={{ fontSize: 11, color: '#a0a8c0' }}>
                          {currency}{acc.spend.toFixed(0)} / {currency}{acc.assigned.toFixed(0)}
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${budgetPct}%`,
                          background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)`,
                          boxShadow: `0 0 10px ${p.color}50`,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, textAlign: 'right' }}>
                        {budgetPct.toFixed(0)}% gastado
                      </p>
                    </div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--muted)' }} title="Ingresos generados">Ventas</p>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                          {currency}{acc.revenue.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--muted)' }} title="Retorno por cada peso invertido">ROAS</p>
                        <p style={{
                          fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800,
                          color: phaseRoas >= 3 ? '#06d6a0' : phaseRoas >= 1.5 ? '#fbbf24' : phaseRoas > 0 ? '#fca5a5' : '#8892b0',
                        }}>
                          {phaseRoas > 0 ? `${phaseRoas.toFixed(1)}x` : '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--muted)' }}>Conversiones</p>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                          {acc.conversions || 0}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: 'var(--muted)' }} title="Costo por adquisición">CPA</p>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                          {cpa > 0 ? `${currency}${cpa.toFixed(0)}` : '—'}
                        </p>
                      </div>
                    </div>

                    {/* Insight */}
                    <div style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: `${status.color}08`,
                      border: `1px solid ${status.color}25`,
                      fontSize: 11, color: 'rgba(255,255,255,0.78)', lineHeight: 1.55,
                    }}>
                      💡 {insight}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SECTION C: COMPARISON GRID ────────────────────────────── */}
          <div className="card p-6 mb-6">
            <div className="mb-4">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                Comparativa detallada
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                Recomendado vs asignado vs gastado real, con métricas finales del mes
              </p>
            </div>

            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.9fr',
              gap: 12, padding: '10px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              {['Fase', 'Recomendado', 'Asignado', 'Gastado', 'Ventas', 'ROAS', 'CPA', 'Estado'].map(h => (
                <span key={h} style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.10em',
                }}>{h}</span>
              ))}
            </div>

            {PHASES.map(p => {
              const acc = grouped[p.key]
              const status = deriveStatus(p.key, acc, level)
              const phaseRoas = acc.spend > 0 ? acc.revenue / acc.spend : 0
              const cpa = acc.conversions > 0 ? acc.spend / acc.conversions : 0
              const isLocked = status.key === 'locked'

              return (
                <div key={p.key} style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.9fr',
                  gap: 12, padding: '14px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isLocked ? 'transparent' : 'rgba(255,255,255,0.015)',
                  borderRadius: 8,
                  marginTop: 4,
                  opacity: isLocked ? 0.55 : 1,
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.fullName}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{currency}{acc.recommended.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: '#a0a8c0' }}>{currency}{acc.assigned.toLocaleString()}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{currency}{acc.spend.toFixed(0)}</span>
                  <span style={{ fontSize: 12, color: '#06d6a0' }}>{currency}{acc.revenue.toFixed(0)}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: phaseRoas >= 3 ? '#06d6a0' : phaseRoas >= 1.5 ? '#fbbf24' : phaseRoas > 0 ? '#fca5a5' : 'var(--muted)',
                  }}>{phaseRoas > 0 ? `${phaseRoas.toFixed(1)}x` : '—'}</span>
                  <span style={{ fontSize: 12 }}>{cpa > 0 ? `${currency}${cpa.toFixed(0)}` : '—'}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 99,
                    background: `${status.color}15`,
                    color: status.color,
                    border: `1px solid ${status.color}30`,
                    textAlign: 'center',
                  }}>{status.label}</span>
                </div>
              )
            })}

            {/* Total row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr 0.7fr 0.7fr 0.9fr',
              gap: 12, padding: '14px',
              marginTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(234,27,126,0.04)',
              borderRadius: 8,
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 800, color: '#fff' }}>TOTAL</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{currency}{totals.recommended.toLocaleString()}</span>
              <span style={{ fontSize: 12, color: '#a0a8c0' }}>{currency}{totals.assigned.toLocaleString()}</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>{currency}{totals.spend.toFixed(0)}</span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800, color: '#06d6a0' }}>{currency}{totals.revenue.toFixed(0)}</span>
              <span style={{
                fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 800,
                color: totalRoas >= 3 ? '#06d6a0' : totalRoas >= 1.5 ? '#fbbf24' : totalRoas > 0 ? '#fca5a5' : 'var(--muted)',
              }}>{totalRoas > 0 ? `${totalRoas.toFixed(1)}x` : '—'}</span>
              <span style={{ fontSize: 12 }}>—</span>
              <span></span>
            </div>
          </div>

          {/* ── SECTION D: INSIGHTS ───────────────────────────────────── */}
          {insights.length > 0 && (
            <div className="card p-6 mb-6">
              <div className="mb-4">
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  💡 Insights del sistema
                </h2>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Oportunidades detectadas automáticamente al analizar tus fases
                </p>
              </div>
              <div className="space-y-3">
                {insights.map((ins, i) => (
                  <div key={i} className="p-4 rounded-xl flex items-start gap-3" style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.55 }}>{ins.text}</p>
                      {ins.action && (
                        <Link href={ins.action.href} style={{ fontSize: 11, color: '#f9a8d4', fontWeight: 600, marginTop: 6, display: 'inline-block' }}>
                          {ins.action.label}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SECTION E: COMPARISON CHART ───────────────────────────── */}
          <div className="card p-6 mb-6">
            <div className="mb-4">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                Comparativa visual por fase
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                Recomendado vs asignado vs gasto real (en {currency})
              </p>
            </div>
            <PhaseChart
              data={PHASES.map(p => ({
                name: p.key,
                color: p.color,
                recomendado: grouped[p.key].recommended,
                asignado:    grouped[p.key].assigned,
                gastado:     grouped[p.key].spend,
              }))}
            />
          </div>
        </>
      )}

      {/* ── SECTION F: EDUCATION ──────────────────────────────────────── */}
      <div className="card p-6 mb-6" style={{
        background: 'linear-gradient(135deg, rgba(98,196,176,0.06), rgba(245,158,11,0.04))',
        border: '1px solid rgba(98,196,176,0.18)',
      }}>
        <div className="flex items-start gap-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(98,196,176,0.15)',
            border: '1px solid rgba(98,196,176,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 0 16px rgba(98,196,176,0.30)',
          }}>📚</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              Las 4 fases trabajan juntas como un sistema
            </h3>
            <div className="space-y-3 mb-4">
              {[
                { p: 'F1', icon: '📢', name: 'Reconocimiento', arrow: '↓', text: 'Personas nuevas conocen tu marca' },
                { p: 'F2', icon: '💰', name: 'Ventas',         arrow: '↓', text: 'Interesados se convierten en compradores' },
                { p: 'F3', icon: '🎯', name: 'Remarketing',    arrow: '↓', text: 'Los que casi compran, vuelven y compran' },
                { p: 'F4', icon: '💬', name: 'WhatsApp',       arrow: '→', text: 'Contacto directo para cerrar ventas' },
              ].map(s => (
                <div key={s.p}>
                  <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: '#fff' }}>{s.p} {s.name}</span>
                    <span style={{ color: 'var(--muted)' }}>—</span>
                    <span style={{ color: 'rgba(255,255,255,0.78)' }}>{s.text}</span>
                  </div>
                  {s.arrow === '↓' && (
                    <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 14, color: 'rgba(255,255,255,0.20)', marginTop: 2, marginBottom: 2 }}>↓</span>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
              F1 alimenta F2, F2 genera datos para F3, y F3 es donde se genera el mayor retorno. Por eso al subir de nivel, F3 va creciendo en importancia.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
