// src/app/dashboard/reports/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { DailyReport, Recommendation } from '@/types'

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  scale_up:         { label: 'Escalar', color: 'var(--accent3)', bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.2)', icon: '📈' },
  scale_down:       { label: 'Reducir gasto', color: 'var(--warn)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '⚠️' },
  pause:            { label: 'Pausar', color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🛑' },
  refresh_creative: { label: 'Renovar creativo', color: 'var(--accent)', bg: 'rgba(79,110,247,0.08)', border: 'rgba(79,110,247,0.2)', icon: '🔄' },
  maintain:         { label: 'Mantener', color: 'var(--muted)', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', icon: '→' },
  duplicate:        { label: 'Duplicar campaña', color: 'var(--accent)', bg: 'rgba(79,110,247,0.08)', border: 'rgba(79,110,247,0.2)', icon: '✨' },
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const cfg = TYPE_CONFIG[rec.type] || TYPE_CONFIG.maintain
  return (
    <div className="p-5 rounded-xl flex gap-4" style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
           style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
        {cfg.icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
            {cfg.label}
          </span>
          {rec.priority === 'high' && (
            <span className="text-xs font-bold" style={{ color: 'var(--danger)' }}>● Alta prioridad</span>
          )}
        </div>
        <p className="text-sm font-semibold mb-1">{rec.title}</p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{rec.description}</p>
        {rec.action && (
          <button className="mt-3 text-xs font-semibold transition-opacity hover:opacity-80"
                  style={{ color: cfg.color }}>
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

  const latestReport = reports?.[0]
  const recommendations = (latestReport?.recommendations || []) as Recommendation[]
  const highPriority = recommendations.filter(r => r.priority === 'high')

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="page-title mb-1">Reportes diarios IA 📩</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Análisis automático enviado cada mañana a las 8:00 AM a tu email
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs p-2.5 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            Próximo reporte: <strong style={{ color: 'var(--accent3)' }}>mañana 8:00 AM</strong>
          </span>
        </div>
      </div>

      {!reports?.length ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-display text-xl font-bold mb-2">Sin reportes todavía</h2>
          <p className="text-sm mb-2 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Los reportes se generan automáticamente cada mañana una vez que tenés campañas activas en Facebook.
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Para activarlos: creá una campaña → conectá tu cuenta de Facebook → activá la campaña.
          </p>
        </div>
      ) : (
        <>
          {/* Último reporte */}
          <div className="p-5 rounded-xl flex items-center gap-4 mb-6"
               style={{ background: 'linear-gradient(135deg, rgba(79,110,247,0.08), rgba(124,58,237,0.08))', border: '1px solid rgba(79,110,247,0.2)' }}>
            <span className="text-3xl">📊</span>
            <div className="flex-1">
              <h2 className="font-display text-base font-bold mb-0.5">
                Reporte del{' '}
                {new Date(latestReport!.report_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                {recommendations.length} recomendaciones ·{' '}
                {highPriority.length > 0 ? <span style={{ color: 'var(--danger)' }}>{highPriority.length} de alta prioridad</span> : 'Todo en orden'} ·{' '}
                {latestReport?.email_status === 'sent' ? '✅ Email enviado' : '⏳ Pendiente de envío'}
              </p>
            </div>
          </div>

          {/* Análisis de la IA */}
          {latestReport?.ai_analysis && (
            <div className="card p-5 mb-6">
              <h2 className="section-title mb-3">🤖 Análisis de la IA</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {latestReport.ai_analysis}
              </p>
            </div>
          )}

          {/* Recomendaciones */}
          {recommendations.length > 0 && (
            <div className="mb-6">
              <h2 className="section-title mb-4">Acciones recomendadas</h2>
              <div className="grid grid-cols-2 gap-4">
                {recommendations.map((rec, i) => (
                  <RecommendationCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Historial de reportes */}
          <div className="card">
            <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="section-title">Historial de reportes</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['FECHA', 'RECOMENDACIONES', 'EMAIL', 'ESTADO'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-wider uppercase"
                        style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-b hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-3.5 text-sm font-medium">
                      {new Date(r.report_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      {(r.recommendations as Recommendation[]).length} acciones
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--muted)' }}>
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
