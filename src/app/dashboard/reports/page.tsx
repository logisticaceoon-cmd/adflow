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
    <span style={{ color: '#06d6a0', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
      <TrendingUp size={13} /> +{value.toFixed(0)}%
    </span>
  )
  if (value < 0) return (
    <span style={{ color: '#fca5a5', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
      <TrendingDown size={13} /> {value.toFixed(0)}%
    </span>
  )
  return (
    <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
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
      <div className="dash-anim-1 mb-6" style={{
        position: 'relative',
        borderRadius: 22, padding: '28px 32px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(233,30,140,0.06) 50%, rgba(98,196,176,0.04) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.55), rgba(234,27,126,0.40), transparent)',
        }} />
        <div className="flex items-start justify-between gap-6">
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c4b5fd', marginBottom: 8 }}>
              Reportes · AdFlow
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
              color: '#fff', marginBottom: 8, letterSpacing: '-0.03em',
            }}>
              Cómo viene tu negocio 📊
            </h1>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)', maxWidth: 580, lineHeight: 1.55, marginBottom: 14 }}>
              Tu consultor IA analiza cada mes tu rendimiento y te dice exactamente qué hacer después.
              Reporte mensual consolidado + historial completo de tu crecimiento.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {pixelAnalysis && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 99,
                  background: 'rgba(139,92,246,0.12)',
                  border: '1px solid rgba(139,92,246,0.30)',
                  fontSize: 12, fontWeight: 600, color: '#c4b5fd',
                }}>
                  ⭐ Nivel {pixelAnalysis.level}: {pixelAnalysis.level_name}
                </span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(98,196,176,0.10)',
                border: '1px solid rgba(98,196,176,0.30)',
                fontSize: 12, fontWeight: 600, color: '#62c4b0',
              }}>
                📅 {fmtMonthYear(monthYear)}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 99,
                background: 'rgba(6,214,160,0.10)',
                border: '1px solid rgba(6,214,160,0.30)',
                fontSize: 12, fontWeight: 600, color: '#06d6a0',
              }}>
                🎬 {activeCount} campaña{activeCount !== 1 ? 's' : ''} activa{activeCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION B: CURRENT MONTH SUMMARY — Hero card ──────────────── */}
      <Link href={`/dashboard/reports/monthly?month=${monthYear}`} className="block mb-6 dash-anim-2" style={{ textDecoration: 'none' }}>
        <div className="transition-all hover:-translate-y-0.5" style={{
          borderRadius: 20, padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(234,27,126,0.12) 0%, rgba(98,196,176,0.06) 100%)',
          border: '1px solid rgba(234,27,126,0.28)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 48px rgba(234,27,126,0.15), 0 0 80px rgba(234,27,126,0.06)',
          cursor: 'pointer',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(234,27,126,0.18)',
                border: '1px solid rgba(234,27,126,0.35)',
                boxShadow: '0 0 24px rgba(234,27,126,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>📊</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Reporte del mes actual
                </p>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {fmtMonthYear(monthYear)}
                </h2>
              </div>
            </div>
            <ArrowRight size={22} style={{ color: '#f9a8d4' }} />
          </div>

          {currentReport ? (
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Inversión',   value: `$${(currentReport.total_spend || 0).toFixed(0)}`,    color: '#e91e8c' },
                { label: 'Ventas',      value: `$${(currentReport.total_revenue || 0).toFixed(0)}`,  color: '#06d6a0' },
                { label: 'ROAS',        value: `${(currentReport.avg_roas || 0).toFixed(2)}x`,       color: '#f59e0b' },
                { label: 'Conversiones', value: String(currentReport.total_conversions || 0),        color: '#62c4b0' },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl" style={{
                  background: 'rgba(0,0,0,0.30)',
                  border: `1px solid ${m.color}25`,
                  borderTop: `2px solid ${m.color}`,
                }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
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
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginBottom: 8 }}>
                Todavía no hay reporte generado para este mes. Hacé click y lo calculamos con tu consultor IA.
              </p>
              <span style={{ fontSize: 12, color: '#f9a8d4', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} /> Generar reporte mensual →
              </span>
            </div>
          )}

          {currentReport && trendRoas !== 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>vs mes anterior:</span>
              <ChangeArrow value={trendRoas} />
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>en ROAS</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── SECTION C: PREVIOUS MONTHS GRID ──────────────────────────── */}
      <div className="mb-6 dash-anim-3">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Historial de meses
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
          Tu recorrido completo — click en cualquier mes para ver su reporte detallado
        </p>

        {priorMonths.length === 0 ? (
          <div className="card p-10 text-center">
            <div style={{ fontSize: 42, marginBottom: 14 }}>🌱</div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
              Este es tu primer mes con AdFlow
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 400, margin: '0 auto' }}>
              A fin de mes vas a ver acá tu primer reporte consolidado. Seguí publicando campañas para alimentar los datos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {priorMonths.map((r: any) => {
              const roasColor = r.avg_roas >= 3 ? '#06d6a0' : r.avg_roas >= 1.5 ? '#fbbf24' : r.avg_roas > 0 ? '#fca5a5' : '#8892b0'
              return (
                <Link key={r.month_year} href={`/dashboard/reports/monthly?month=${r.month_year}`} className="block" style={{ textDecoration: 'none' }}>
                  <div className="card p-5 transition-all hover:-translate-y-0.5">
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                        {fmtMonthYear(r.month_year)}
                      </p>
                      <ArrowRight size={14} style={{ color: 'var(--muted)' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Inversión</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${(r.total_spend || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Ventas</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#06d6a0' }}>${(r.total_revenue || 0).toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>ROAS</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: roasColor, fontFamily: 'Syne, sans-serif' }}>
                          {r.avg_roas > 0 ? `${r.avg_roas.toFixed(1)}x` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" style={{ paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Crecimiento</span>
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
      <div className="card p-5 mb-6" style={{
        background: 'linear-gradient(135deg, rgba(98,196,176,0.06), rgba(233,30,140,0.04))',
        border: '1px solid rgba(98,196,176,0.18)',
      }}>
        <div className="flex items-start gap-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(98,196,176,0.15)', border: '1px solid rgba(98,196,176,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 0 16px rgba(98,196,176,0.30)',
          }}>
            <Clock size={20} style={{ color: '#62c4b0' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Reporte automático cada mañana
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 8 }}>
              Todas las mañanas a las 8 AM analizamos tus campañas activas y te mandamos por email un resumen + las 3 acciones más importantes del día.
            </p>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>
              Si el primer día del mes caés acá, también generamos tu reporte mensual del mes anterior automáticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
