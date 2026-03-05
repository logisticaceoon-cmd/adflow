// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign, DailyReport } from '@/types'

function MetricCard({ label, value, change, color, positive }: {
  label: string, value: string, change: string, color: string, positive?: boolean
}) {
  return (
    <div className="metric-card" style={{ borderTop: `2px solid ${color}` }}>
      <p className="text-xs font-semibold tracking-wider mb-3 uppercase" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="font-display text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs mt-2" style={{ color: positive !== false ? 'var(--accent3)' : 'var(--danger)' }}>
        {change}
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'badge-active', paused: 'badge-paused',
    draft: 'badge-draft', error: 'badge-error', completed: 'badge-draft'
  }
  const labels: Record<string, string> = {
    active: '● Activa', paused: '● Pausada',
    draft: 'Borrador', error: '⚠ Error', completed: 'Completada'
  }
  return <span className={`badge ${map[status] || 'badge-draft'}`}>{labels[status] || status}</span>
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Obtener campañas del usuario
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5) as { data: Campaign[] | null }

  // Obtener último reporte diario
  const { data: lastReport } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', user!.id)
    .order('report_date', { ascending: false })
    .limit(1)
    .single() as { data: DailyReport | null }

  // Calcular métricas totales de campañas activas
  const activeCampaigns = campaigns?.filter(c => c.status === 'active') || []
  const totalSpend = activeCampaigns.reduce((s, c) => s + (c.metrics?.spend || 0), 0)
  const totalRevenue = activeCampaigns.reduce((s, c) => s + ((c.metrics?.roas || 0) * (c.metrics?.spend || 0)), 0)
  const avgRoas = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + (c.metrics?.roas || 0), 0) / activeCampaigns.length
    : 0

  const hasData = (campaigns?.length || 0) > 0

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="page-title mb-1">Resumen general</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Últimos 30 días ·{' '}
            {activeCampaigns.length > 0
              ? <span style={{ color: 'var(--accent3)' }}>● {activeCampaigns.length} campaña{activeCampaigns.length !== 1 ? 's' : ''} activa{activeCampaigns.length !== 1 ? 's' : ''}</span>
              : 'Sin campañas activas todavía'}
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary">
          ✨ Nueva campaña con IA
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard label="Gasto total" value={hasData ? `$${totalSpend.toFixed(0)}` : '$0'}
          change={hasData ? '↑ 12% vs mes anterior' : 'Creá tu primera campaña'} color="#4f6ef7" />
        <MetricCard label="Ingresos estimados" value={hasData ? `$${totalRevenue.toFixed(0)}` : '$0'}
          change={hasData ? '↑ 28% vs mes anterior' : 'Se calcula con ROAS'} color="#06d6a0" />
        <MetricCard label="ROAS promedio" value={hasData ? `${avgRoas.toFixed(1)}x` : '—'}
          change={hasData ? '↑ 0.8x vs mes anterior' : 'Return on ad spend'} color="#f59e0b" />
        <MetricCard label="Campañas activas" value={String(activeCampaigns.length)}
          change={`${campaigns?.length || 0} total en la plataforma`} color="#7c3aed" />
      </div>

      {/* Estado vacío */}
      {!hasData && (
        <div className="card p-16 text-center mb-6">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="font-display text-xl font-bold mb-2">¡Bienvenido a AdFlow!</h2>
          <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Todavía no tenés campañas. Creá tu primera campaña con IA en menos de 8 minutos.
            La IA genera todos los textos y la publica directamente en Facebook.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard/create" className="btn-primary">
              ✨ Crear primera campaña con IA
            </Link>
            <Link href="/dashboard/settings" className="btn-ghost">
              Conectar cuenta de Facebook
            </Link>
          </div>
        </div>
      )}

      {/* Campañas recientes */}
      {hasData && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <div className="card">
              <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="section-title">Campañas recientes</h2>
                </div>
                <Link href="/dashboard/campaigns" className="btn-ghost text-xs py-1.5 px-3">Ver todas →</Link>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['CAMPAÑA', 'ESTADO', 'GASTO', 'ROAS'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-bold tracking-wider uppercase"
                          style={{ color: 'var(--muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns?.map(c => (
                    <tr key={c.id} className="border-b transition-colors hover:bg-white/[0.02]"
                        style={{ borderColor: 'var(--border)' }}>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{c.objective.toLowerCase()}</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5 text-sm">${(c.metrics?.spend || 0).toFixed(0)}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold"
                          style={{ color: (c.metrics?.roas || 0) >= 3 ? 'var(--accent3)' : (c.metrics?.roas || 0) > 0 ? 'var(--warn)' : 'var(--muted)' }}>
                        {c.metrics?.roas ? `${c.metrics.roas.toFixed(1)}x` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Panel lateral: Alerta IA */}
          <div>
            <div className="card">
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="section-title">🤖 Alerta IA del día</h2>
              </div>
              <div className="p-4">
                {lastReport?.recommendations?.length ? (
                  lastReport.recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="p-3 rounded-xl mb-3"
                         style={{
                           background: rec.type === 'scale_up' ? 'rgba(6,214,160,0.08)' : rec.type === 'pause' || rec.type === 'scale_down' ? 'rgba(239,68,68,0.08)' : 'rgba(79,110,247,0.08)',
                           border: `1px solid ${rec.type === 'scale_up' ? 'rgba(6,214,160,0.2)' : rec.type === 'pause' ? 'rgba(239,68,68,0.2)' : 'rgba(79,110,247,0.2)'}`
                         }}>
                      <p className="text-xs font-bold mb-1" style={{ color: rec.type === 'scale_up' ? 'var(--accent3)' : rec.type === 'pause' ? 'var(--danger)' : 'var(--accent)' }}>
                        {rec.type === 'scale_up' ? '✅' : rec.type === 'pause' ? '⚠️' : '→'} {rec.title}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{rec.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      Los reportes aparecen aquí una vez que tenés campañas activas.
                    </p>
                    <Link href="/dashboard/reports" className="text-xs mt-2 block" style={{ color: 'var(--accent)' }}>
                      Ver configuración de reportes →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
