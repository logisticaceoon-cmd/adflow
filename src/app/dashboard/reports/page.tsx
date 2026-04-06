// src/app/dashboard/reports/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { DailyReport, Recommendation } from '@/types'
import { BarChart2, Clock, Mail, Zap, ArrowRight } from 'lucide-react'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  scale_up:         { label: 'Escalar',          color: 'var(--accent3)',  bg: 'rgba(6,214,160,0.07)',    border: 'rgba(6,214,160,0.22)',    icon: '📈' },
  scale_down:       { label: 'Reducir gasto',    color: 'var(--warn)',     bg: 'rgba(245,158,11,0.07)',   border: 'rgba(245,158,11,0.22)',   icon: '⚠️' },
  pause:            { label: 'Pausar',            color: 'var(--danger)',   bg: 'rgba(239,68,68,0.07)',    border: 'rgba(239,68,68,0.22)',    icon: '🛑' },
  refresh_creative: { label: 'Renovar creativo', color: 'var(--accent)',   bg: 'rgba(233,30,140,0.07)',   border: 'rgba(233,30,140,0.22)',   icon: '🔄' },
  maintain:         { label: 'Mantener',          color: 'var(--muted)',    bg: 'rgba(255,255,255,0.04)',  border: 'rgba(255,255,255,0.10)',  icon: '→' },
  duplicate:        { label: 'Duplicar campaña', color: 'var(--accent)',   bg: 'rgba(233,30,140,0.07)',   border: 'rgba(233,30,140,0.22)',   icon: '✨' },
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = TYPE_CONFIG[rec.type] || TYPE_CONFIG.maintain
  return (
    <div className="p-5 rounded-2xl flex gap-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 4px 16px rgba(0,0,0,0.25)`,
      }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${cfg.border}` }}>
        {cfg.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)', color: cfg.color, border: `1px solid ${cfg.border}`,
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            {cfg.label}
          </span>
          {rec.priority === 'high' && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block', boxShadow: '0 0 6px rgba(239,68,68,0.7)' }} className="glow-dot" />
              Alta prioridad
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.92)', marginBottom: 6 }}>{rec.title}</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{rec.description}</p>
        {rec.action && (
          <button style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: cfg.color, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            → {rec.action.label}
          </button>
        )}
      </div>
    </div>
  )
}

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reports } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user!.id)
    .order('report_date', { ascending: false })
    .limit(10) as { data: DailyReport[] | null }

  const latestReport    = reports?.[0]
  const recommendations = (latestReport?.recommendations || []) as Recommendation[]
  const highPriority    = recommendations.filter(r => r.priority === 'high')

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-6 dash-anim-1">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
            Inteligencia artificial
          </p>
          <h1 className="page-title mb-1.5">Reportes IA</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Análisis diario automático + reporte mensual consolidado
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
          background: 'rgba(6,214,160,0.06)', border: '1px solid rgba(6,214,160,0.18)',
        }}>
          <Clock size={13} style={{ color: 'var(--accent3)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
            Próximo: <strong style={{ color: 'var(--accent3)' }}>mañana 8:00 AM</strong>
          </span>
        </div>
      </div>

      {/* ── Monthly report hero card ── */}
      <Link href="/dashboard/reports/monthly" className="block mb-6 dash-anim-2" style={{ textDecoration: 'none' }}>
        <div className="p-5 transition-all hover:-translate-y-0.5" style={{
          borderRadius: 18,
          background: 'linear-gradient(135deg, rgba(234,27,126,0.10) 0%, rgba(98,196,176,0.07) 100%)',
          border: '1px solid rgba(234,27,126,0.25)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', gap: 18,
          cursor: 'pointer',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: 'rgba(234,27,126,0.15)', border: '1px solid rgba(234,27,126,0.30)',
            boxShadow: '0 0 20px rgba(234,27,126,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
          }}>📊</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
              Reporte mensual consolidado
            </p>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Cómo te fue este mes
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              Gasto, ROAS, fases, evolución del nivel + análisis IA + próximas acciones
            </p>
          </div>
          <ArrowRight size={18} style={{ color: '#f9a8d4', flexShrink: 0 }} />
        </div>
      </Link>

      {/* ── Empty state ── */}
      {!reports?.length ? (
        <div className="card p-16 text-center dash-anim-2" style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>
            📊
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>Sin reportes todavía</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 8 }}>
            Los reportes se generan automáticamente cada mañana una vez que tenés campañas activas.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Creá una campaña → conectá Facebook → activá la campaña.
          </p>
        </div>
      ) : (
        <>
          {/* ── Latest report summary ── */}
          <div className="dash-anim-2" style={{
            padding: '20px 24px', borderRadius: 20, marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(234,27,126,0.09) 0%, rgba(98,196,176,0.06) 100%)',
            border: '1px solid rgba(233,30,140,0.22)',
            backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: 'rgba(233,30,140,0.12)', border: '1px solid rgba(233,30,140,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              📊
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                Último reporte
              </p>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.02em' }}>
                {new Date(latestReport!.report_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {recommendations.length} recomendaciones
                </span>
                {highPriority.length > 0 && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                    <span style={{ fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', display: 'inline-block' }} />
                      {highPriority.length} alta prioridad
                    </span>
                  </>
                )}
                <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                <span style={{ fontSize: 12, color: latestReport?.email_status === 'sent' ? 'var(--accent3)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={11} />
                  {latestReport?.email_status === 'sent' ? 'Email enviado' : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* ── AI analysis ── */}
          {latestReport?.ai_analysis && (
            <div className="card p-6 mb-6 dash-anim-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'rgba(98,196,176,0.10)', border: '1px solid rgba(98,196,176,0.22)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>🤖</div>
                <h2 className="section-title">Análisis de la IA</h2>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
                {latestReport.ai_analysis}
              </p>
            </div>
          )}

          {/* ── Recommendations ── */}
          {recommendations.length > 0 && (
            <div className="mb-6 dash-anim-4">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Zap size={14} style={{ color: '#e91e8c' }} />
                <h2 className="section-title">Acciones recomendadas</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* ── History table ── */}
          <div className="card dash-anim-5">
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <BarChart2 size={14} style={{ color: '#62c4b0' }} />
              <h2 className="section-title">Historial de reportes</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  {['FECHA', 'RECOMENDACIONES', 'ENVIADO A LAS', 'ESTADO'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-5 py-3.5" style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
                      {new Date(r.report_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: 13, color: 'var(--muted)' }}>
                      {(r.recommendations as Recommendation[]).length} acciones
                    </td>
                    <td className="px-5 py-3.5" style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {r.email_sent_at
                        ? new Date(r.email_sent_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${r.email_status === 'sent' ? 'badge-active' : r.email_status === 'error' ? 'badge-error' : 'badge-draft'}`}>
                        {r.email_status === 'sent' ? '✓ Enviado' : r.email_status === 'error' ? '⚠ Error' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
