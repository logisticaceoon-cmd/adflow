// src/app/dashboard/reports/page.tsx — Reports hub (premium server component)
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowRight, TrendingUp, TrendingDown, Minus, Sparkles, Clock } from 'lucide-react'

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

function fmtMonthYear(my: string) {
  const [y, m] = my.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

function ChangeArrow({ value }: { value: number }) {
  if (value > 0) return (
    <span style={{ color: 'var(--ds-color-success)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
      <TrendingUp size={13} /> +{value.toFixed(0)}%
    </span>
  )
  if (value < 0) return (
    <span style={{ color: 'var(--ds-color-danger)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
      <TrendingDown size={13} /> {value.toFixed(0)}%
    </span>
  )
  return (
    <span style={{ color: 'var(--ds-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
      <Minus size={13} /> Sin cambios
    </span>
  )
}

export default async function ReportsHubPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [
    { data: pixelAnalysis },
    { data: currentReport },
    { data: previousReports },
    { data: campaigns },
  ] = await Promise.all([
    supabase.from('pixel_analysis').select('level, level_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_reports').select('*').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
    supabase.from('monthly_reports').select('month_year, total_spend, total_revenue, total_conversions, avg_roas, growth_rate, pixel_level_end').eq('user_id', user.id).order('month_year', { ascending: false }).limit(12),
    supabase.from('campaigns').select('id, name, status, strategy_type, daily_budget, metrics, created_at').eq('user_id', user.id),
  ])

  const allReports = (previousReports || []) as any[]
  const priorMonths = allReports.filter(r => r.month_year !== monthYear)
  const activeCount = (campaigns || []).filter((c: any) => c.status === 'active').length

  // Monthly trend: pick numeric growth vs prev month report if available
  const prev = priorMonths[0]
  const trendRoas = prev?.avg_roas > 0 && currentReport?.avg_roas
    ? Math.round(((currentReport.avg_roas - prev.avg_roas) / prev.avg_roas) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── SECTION A: HERO ───────────────────────────────────────────── */}
      <div className="module-enter module-enter-1" style={{
        position: 'relative',
        marginBottom: 32,
        borderRadius: 24, padding: '36px 40px',
        background:
          'linear-gradient(135deg, rgba(124, 110, 240, 0.08) 0%, rgba(10, 12, 28, 0.50) 50%, rgba(167, 139, 250, 0.04) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(32px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
        boxShadow: 'var(--ds-shadow-md), 0 0 40px rgba(124, 110, 240, 0.05)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 90%)',
          pointerEvents: 'none',
        }} />
        <div className="flex items-start justify-between gap-6">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-text-label)', marginBottom: 10 }}>
              Reportes · AdFlow
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 700,
              color: 'var(--ds-text-primary)', marginBottom: 10, letterSpacing: '-0.02em',
            }}>
              Cómo viene tu negocio 📊
            </h1>
            <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', maxWidth: 580, lineHeight: 1.55, marginBottom: 16 }}>
              Tu consultor IA analiza cada mes tu rendimiento y te dice exactamente qué hacer después.
              Reporte mensual consolidado + historial completo de tu crecimiento.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {pixelAnalysis && (
                <span className="ds-badge" style={{
                  background: 'rgba(167, 139, 250, 0.14)',
                  borderColor: 'rgba(167, 139, 250, 0.35)',
                  color: 'var(--ds-color-secondary)',
                  boxShadow: '0 0 12px rgba(167, 139, 250, 0.24)',
                }}>
                  ⭐ Nivel {pixelAnalysis.level}: {pixelAnalysis.level_name}
                </span>
              )}
              <span className="ds-badge ds-badge--primary">
                📅 {fmtMonthYear(monthYear)}
              </span>
              <span className="ds-badge ds-badge--success">
                🎬 {activeCount} campaña{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION B: CURRENT MONTH SUMMARY — Hero card ──────────────── */}
      <Link href={`/dashboard/reports/monthly?month=${monthYear}`} className="block module-enter module-enter-2" style={{ textDecoration: 'none', marginBottom: 32 }}>
        <div className="card card-hover" style={{
          padding: '24px 28px',
          borderColor: 'var(--ds-color-primary-border)',
          boxShadow: 'var(--ds-shadow-md), 0 0 48px rgba(124, 110, 240, 0.10), var(--ds-card-inner-glow)',
          cursor: 'pointer',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'var(--ds-color-primary-soft)',
                border: '1px solid transparent',
                boxShadow: '0 0 24px transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>📊</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Reporte del mes actual
                </p>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {fmtMonthYear(monthYear)}
                </h2>
              </div>
            </div>
            <ArrowRight size={22} style={{ color: 'var(--ds-color-primary)' }} />
          </div>

          {currentReport ? (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Inversión',   value: `$${(currentReport.total_spend || 0).toFixed(0)}`,    color: 'var(--ds-color-primary)' },
                { label: 'Ventas',      value: `$${(currentReport.total_revenue || 0).toFixed(0)}`,  color: 'var(--ds-color-success)' },
                { label: 'ROAS',        value: `${(currentReport.avg_roas || 0).toFixed(2)}x`,       color: 'var(--ds-color-warning)' },
                { label: 'Conversiones', value: String(currentReport.total_conversions || 0),        color: 'var(--ds-color-primary)' },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl" style={{
                  background: 'rgba(0,0,0,0.30)',
                  border: `1px solid ${m.color}25`,
                  borderTop: `2px solid ${m.color}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                    {m.label}
                  </p>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: m.color, lineHeight: 1.2 }}>
                    {m.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 rounded-xl" style={{ background: 'rgba(0,0,0,0.30)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 8 }}>
                Todavía no hay reporte generado para este mes. Hacé click y lo calculamos con tu consultor IA.
              </p>
              <span style={{ fontSize: 12, color: 'var(--ds-color-primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} /> Generar reporte mensual →
              </span>
            </div>
          )}

          {currentReport && trendRoas !== 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>vs mes anterior:</span>
              <ChangeArrow value={trendRoas} />
              <span style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>en ROAS</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── SECTION C: PREVIOUS MONTHS GRID ──────────────────────────── */}
      <div className="module-enter module-enter-3" style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Historial de meses
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 18 }}>
          Tu recorrido completo — click en cualquier mes para ver su reporte detallado
        </p>

        {priorMonths.length === 0 ? (
          <div className="card p-10 text-center">
            <div style={{ fontSize: 42, marginBottom: 14 }}>🌱</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Este es tu primer mes con AdFlow
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ds-text-secondary)', maxWidth: 400, margin: '0 auto' }}>
              A fin de mes vas a ver acá tu primer reporte consolidado. Seguí publicando campañas para alimentar los datos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {priorMonths.map((r: any) => {
              const roasColor = r.avg_roas >= 3 ? 'var(--ds-color-success)' : r.avg_roas >= 1.5 ? 'var(--ds-color-warning)' : r.avg_roas > 0 ? 'var(--ds-color-danger)' : '#8892b0'
              return (
                <Link key={r.month_year} href={`/dashboard/reports/monthly?month=${r.month_year}`} className="block" style={{ textDecoration: 'none' }}>
                  <div className="card p-5 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {fmtMonthYear(r.month_year)}
                      </p>
                      <ArrowRight size={14} style={{ color: 'var(--ds-text-secondary)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>Inversión</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${(r.total_spend || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>Ventas</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-color-success)' }}>${(r.total_revenue || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>ROAS</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: roasColor, fontFamily: 'Syne, sans-serif' }}>
                          {r.avg_roas > 0 ? `${r.avg_roas.toFixed(1)}x` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)' }}>Crecimiento</span>
                        <ChangeArrow value={r.growth_rate || 0} />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* ── SECTION D: DAILY REPORTS INFO ────────────────────────────── */}
      <div className="card" style={{
        padding: 20, marginBottom: 24,
        borderLeft: '3px solid var(--ds-color-primary)',
        boxShadow: 'var(--ds-shadow-md), -3px 0 15px rgba(124, 110, 240, 0.10), var(--ds-card-inner-glow)',
      }}>
        <div className="flex items-start gap-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--ds-card-border)', border: '1px solid var(--ds-card-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 0 16px var(--ds-card-border)',
          }}>
            <Clock size={20} style={{ color: 'var(--ds-color-primary)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Reporte automático cada mañana
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 8 }}>
              Todas las mañanas a las 8 AM analizamos tus campañas activas y te mandamos por email un resumen + las 3 acciones más importantes del día.
            </p>
            <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
              Si el primer día del mes caés acá, también generamos tu reporte mensual del mes anterior automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
