// src/app/dashboard/reports/monthly/page.tsx — Monthly report viewer (premium)
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { generateMonthlyReport } from '@/lib/monthly-report-engine'
import { PHASES, type Phase } from '@/lib/budget-engine'
import { TrendingUp, TrendingDown, Minus, ArrowLeft, ArrowRight } from 'lucide-react'
import LevelBadge from '@/components/dashboard/LevelBadge'

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function fmtMonthYear(my: string) {
  const [y, m] = my.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

function prevMonth(my: string): string {
  const [y, m] = my.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function nextMonth(my: string): string {
  const [y, m] = my.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function ChangeIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value > 0) return (
    <span style={{ color: 'var(--ds-color-success)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 11 }}>
      <TrendingUp size={12} /> +{value.toFixed(0)}{suffix}
    </span>
  )
  if (value < 0) return (
    <span style={{ color: 'var(--ds-color-danger)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 11 }}>
      <TrendingDown size={12} /> {value.toFixed(0)}{suffix}
    </span>
  )
  return (
    <span style={{ color: 'var(--ds-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
      <Minus size={12} /> Sin cambios
    </span>
  )
}

function calcTrend(curr: number, prev: number): number {
  if (!prev || prev === 0) return 0
  return ((curr - prev) / prev) * 100
}

interface PageProps {
  searchParams: { month?: string }
}

export default async function MonthlyReportPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const targetMonth  = searchParams?.month || defaultMonth
  const prevMonthYear = prevMonth(targetMonth)

  let [
    { data: report },
    { data: previous },
    { data: pixelAnalysis },
    { data: monthlyBudget },
    { data: levelHistory },
  ] = await Promise.all([
    supabase.from('monthly_reports').select('*').eq('user_id', user.id).eq('month_year', targetMonth).maybeSingle(),
    supabase.from('monthly_reports').select('*').eq('user_id', user.id).eq('month_year', prevMonthYear).maybeSingle(),
    supabase.from('pixel_analysis').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_budgets').select('*').eq('user_id', user.id).eq('month_year', targetMonth).maybeSingle(),
    supabase.from('level_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
  ])

  // Generate on-the-fly if missing
  if (!report) {
    try {
      await generateMonthlyReport(user.id, targetMonth)
      const { data: freshReport } = await supabase.from('monthly_reports').select('*').eq('user_id', user.id).eq('month_year', targetMonth).maybeSingle()
      report = freshReport
    } catch (err) {
      // continue with null — will show empty state
    }
  }

  // Calculate trends vs previous month
  const trendSpend    = calcTrend(report?.total_spend       ?? 0, previous?.total_spend       ?? 0)
  const trendRevenue  = calcTrend(report?.total_revenue     ?? 0, previous?.total_revenue     ?? 0)
  const trendConv     = calcTrend(report?.total_conversions ?? 0, previous?.total_conversions ?? 0)
  const trendRoas     = calcTrend(report?.avg_roas          ?? 0, previous?.avg_roas          ?? 0)
  const budgetPlanned = (report?.budget_planned as number) ?? (monthlyBudget?.total_budget as number) ?? 0
  const budgetEffic   = budgetPlanned > 0 ? ((report?.total_spend ?? 0) / budgetPlanned) * 100 : 0

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── SECTION A: HERO ───────────────────────────────────────────── */}
      <div className="module-enter module-enter-1" style={{
        position: 'relative',
        marginBottom: 32,
        borderRadius: 24, padding: '36px 40px',
        background:
          'linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(10, 12, 28, 0.50) 50%, rgba(167, 139, 250, 0.04) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(32px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
        boxShadow: 'var(--ds-shadow-md), 0 0 40px rgba(34, 211, 238, 0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 90%)',
          pointerEvents: 'none',
        }} />

        <div className="flex items-center justify-between mb-4">
          <div>
            <Link href="/dashboard/reports" style={{ fontSize: 11, color: 'var(--ds-color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', marginBottom: 8 }}>
              <ArrowLeft size={12} /> Volver a reportes
            </Link>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-text-label)', marginBottom: 4 }}>
              Reporte mensual
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 700,
              color: 'var(--ds-text-primary)', letterSpacing: '-0.03em',
            }}>
              {fmtMonthYear(targetMonth)} 📊
            </h1>
          </div>

          {/* Month navigator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href={`/dashboard/reports/monthly?month=${prevMonth(targetMonth)}`} className="btn-ghost" style={{
              padding: '8px 12px', fontSize: 12, minHeight: 34, textDecoration: 'none',
            }}>
              <ArrowLeft size={14} /> Anterior
            </Link>
            <Link href={`/dashboard/reports/monthly?month=${nextMonth(targetMonth)}`} className="btn-ghost" style={{
              padding: '8px 12px', fontSize: 12, minHeight: 34, textDecoration: 'none',
            }}>
              Siguiente <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', maxWidth: 620, lineHeight: 1.55 }}>
          Tu consultor IA analizó el mes. Acá está el resumen ejecutivo, las métricas clave, y las acciones recomendadas para el próximo mes.
        </p>
      </div>

      {!report ? (
        /* ── EMPTY STATE ────────────────────────────────────────────── */
        <div className="card p-12 text-center">
          <div style={{ fontSize: 48, marginBottom: 18 }}>📭</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            No hay datos para {fmtMonthYear(targetMonth)}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 22, maxWidth: 420, margin: '0 auto 22px' }}>
            Todavía no tenés campañas activas en este mes o no hay métricas registradas. El reporte se genera automáticamente cuando empezás a acumular datos.
          </p>
          <Link href="/dashboard/create" className="btn-primary">Crear una campaña →</Link>
        </div>
      ) : (
        <>
          {/* ── SECTION B: TOP METRICS WITH TRENDS ─────────────────── */}
          <div className="grid grid-cols-4 gap-4 module-enter module-enter-2" style={{ marginBottom: 32 }}>
            {[
              { label: 'Inversión total',  value: `$${(report.total_spend ?? 0).toFixed(0)}`,     trend: trendSpend,   color: 'var(--ds-color-primary)' },
              { label: 'Ventas generadas', value: `$${(report.total_revenue ?? 0).toFixed(0)}`,   trend: trendRevenue, color: 'var(--ds-color-success)' },
              { label: 'ROAS promedio',    value: `${(report.avg_roas ?? 0).toFixed(2)}x`,        trend: trendRoas,    color: 'var(--ds-color-warning)' },
              { label: 'Conversiones',     value: String(report.total_conversions ?? 0),         trend: trendConv,    color: 'var(--ds-color-primary)' },
            ].map(m => (
              <div key={m.label} className="card" style={{
                padding: 20,
                borderTop: `2px solid ${m.color}`,
              }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-label)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 8 }}>
                  {m.label}
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 600, color: 'var(--ds-text-primary)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 8 }}>
                  {m.value}
                </p>
                <ChangeIndicator value={m.trend} />
              </div>
            ))}
          </div>

          {/* ── SECTION C: EXECUTIVE AI ANALYSIS ───────────────────── */}
          {report.ai_analysis && (
            <div className="card module-enter module-enter-3" style={{
              padding: 24, marginBottom: 32,
              borderLeft: '3px solid var(--ds-color-primary)',
              boxShadow: 'var(--ds-shadow-md), -3px 0 15px rgba(34, 211, 238, 0.12), 0 0 48px rgba(34, 211, 238, 0.06), var(--ds-card-inner-glow)',
            }}>
              <div className="flex items-start gap-4">
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: 'var(--ds-color-primary-soft)',
                  border: '1px solid transparent',
                  boxShadow: '0 0 24px transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Análisis ejecutivo · Tu consultor IA
                  </p>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                    Qué pasó este mes y qué hacer ahora
                  </h2>
                  <p style={{
                    fontSize: 14, color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.75, whiteSpace: 'pre-wrap',
                  }}>
                    {report.ai_analysis}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION D: LEVEL EVOLUTION + BUDGET EFFICIENCY + GROWTH ── */}
          <div className="grid grid-cols-3 gap-4 module-enter module-enter-4" style={{ marginBottom: 32 }}>
            {/* Level evolution */}
            <div className="card p-5">
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                Evolución de nivel
              </p>
              <div className="flex items-center justify-center gap-4" style={{ minHeight: 80 }}>
                <LevelBadge level={report.pixel_level_start ?? 0} size="sm" showName={false} />
                <ArrowRight size={18} style={{ color: 'var(--ds-text-secondary)' }} />
                <LevelBadge level={report.pixel_level_end ?? 0} size="sm" showName={false} />
              </div>
              {(report.pixel_level_end ?? 0) > (report.pixel_level_start ?? 0) ? (
                <p style={{ fontSize: 11, color: 'var(--ds-color-success)', textAlign: 'center', marginTop: 10, fontWeight: 600 }}>
                  🎉 Subiste {(report.pixel_level_end ?? 0) - (report.pixel_level_start ?? 0)} nivel{(report.pixel_level_end ?? 0) - (report.pixel_level_start ?? 0) !== 1 ? 'es' : ''} este mes
                </p>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', textAlign: 'center', marginTop: 10 }}>
                  Mismo nivel que el inicio del mes
                </p>
              )}
            </div>

            {/* Budget efficiency */}
            <div className="card p-5">
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Eficiencia de presupuesto
              </p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 10 }}>
                {budgetEffic.toFixed(0)}%
              </p>
              <div className="progress-bar" style={{ height: 6, marginBottom: 8 }}>
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(100, budgetEffic)}%`,
                    background: budgetEffic > 100
                      ? 'linear-gradient(90deg, rgba(248,113,113,0.70), #f87171)'
                      : budgetEffic > 90
                        ? 'linear-gradient(90deg, rgba(52,211,153,0.70), #34d399)'
                        : 'linear-gradient(90deg, rgba(251,191,36,0.70), #fbbf24)',
                  }}
                />
              </div>
              <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                ${(report.total_spend ?? 0).toFixed(0)} gastado de ${budgetPlanned.toFixed(0)} planeado
              </p>
            </div>

            {/* Growth rate */}
            <div className="card p-5">
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Crecimiento vs mes anterior
              </p>
              <p style={{
                fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
                color: (report.growth_rate ?? 0) > 0 ? 'var(--ds-color-success)' : (report.growth_rate ?? 0) < 0 ? 'var(--ds-color-danger)' : '#a0a8c0',
                lineHeight: 1, marginBottom: 10,
              }}>
                {(report.growth_rate ?? 0) > 0 ? '+' : ''}{(report.growth_rate ?? 0).toFixed(0)}%
              </p>
              <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                en conversiones totales del mes
              </p>
              {(report.growth_rate ?? 0) > 0 && (
                <p style={{ fontSize: 10, color: 'var(--ds-color-success)', marginTop: 6, fontWeight: 600 }}>
                  📈 Mejoraste vs el mes anterior
                </p>
              )}
            </div>
          </div>

          {/* ── SECTION E: PHASE METRICS BREAKDOWN ──────────────────── */}
          <div className="card p-6 mb-6 dash-anim-5">
            <div className="mb-4">
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                Rendimiento por fase
              </h2>
              <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                Cuánto aportó cada fase del funnel al resultado del mes
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PHASES.map(p => {
                const m = (report.phase_metrics as any)?.[p.key]
                if (!m) return (
                  <div key={p.key} className="p-4 rounded-xl" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    opacity: 0.55,
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: 16, alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{p.icon}</span>
                      <div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: p.color }}>{p.fullName}</p>
                        <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>{p.objective}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', fontStyle: 'italic' }}>
                      Sin actividad en esta fase durante el mes
                    </p>
                  </div>
                )

                return (
                  <div key={p.key} className="p-4 rounded-xl" style={{
                    background: `linear-gradient(135deg, ${p.color}08, ${p.color}02)`,
                    border: `1px solid ${p.color}25`,
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr 80px 80px 80px',
                    gap: 16, alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                        background: `${p.color}20`, border: `1px solid ${p.color}45`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{p.icon}</div>
                      <div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color: p.color }}>{p.fullName}</p>
                        <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>{p.objective}</p>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Inversión</p>
                      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800, color: '#fff' }}>
                        ${m.spend.toFixed(0)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Ventas</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-color-success)' }}>${m.revenue.toFixed(0)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>ROAS</p>
                      <p style={{
                        fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800,
                        color: m.roas >= 3 ? 'var(--ds-color-success)' : m.roas >= 1.5 ? 'var(--ds-color-warning)' : m.roas > 0 ? 'var(--ds-color-danger)' : 'var(--ds-text-secondary)',
                      }}>
                        {m.roas > 0 ? `${m.roas.toFixed(1)}x` : '—'}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Conv.</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.conversions || 0}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── SECTION F: RECOMMENDATIONS ───────────────────────────── */}
          {report.recommendations && (report.recommendations as any[]).length > 0 && (
            <div className="card p-6 mb-6 dash-anim-6">
              <div className="mb-4">
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  🎯 Próximas acciones recomendadas
                </h2>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                  Qué hacer el próximo mes basado en este análisis
                </p>
              </div>
              <div className="space-y-3">
                {(report.recommendations as any[]).slice(0, 6).map((r, i) => {
                  const color  = r.priority === 'high' ? 'var(--ds-color-primary)' : r.priority === 'medium' ? 'var(--ds-color-warning)' : '#8892b0'
                  const bg     = r.priority === 'high' ? 'var(--ds-color-primary-soft)' : r.priority === 'medium' ? 'rgba(245,158,11,0.06)' : 'var(--ds-card-bg)'
                  const border = r.priority === 'high' ? 'var(--ds-color-primary-border)' : r.priority === 'medium' ? 'var(--ds-color-warning-border)' : 'rgba(255,255,255,0.08)'
                  return (
                    <div key={i} className="p-4 rounded-xl flex items-start gap-3" style={{ background: bg, border: `1px solid ${border}` }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, color, marginBottom: 4 }}>
                          {r.title}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55, marginBottom: r.action?.href ? 8 : 0 }}>
                          {r.description}
                        </p>
                        {r.action?.href && (
                          <Link href={r.action.href} style={{ fontSize: 11, color, fontWeight: 600 }}>
                            {r.action.label}
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SECTION G: CAMPAIGN STATS ───────────────────────────── */}
          <div className="card p-5 mb-6 dash-anim-6" style={{
            background: 'linear-gradient(135deg, transparent, transparent)',
            border: '1px solid transparent',
          }}>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  🎬 Campañas creadas este mes
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  {report.campaigns_created ?? 0}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 6 }}>
                  {report.campaigns_active ?? 0} activa{(report.campaigns_active ?? 0) !== 1 ? 's' : ''} al cierre del mes
                </p>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  📊 CPA promedio
                </p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                  ${(report.avg_cpa ?? 0).toFixed(0)}
                </p>
                <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 6 }}>
                  Costo promedio por cada conversión generada
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
