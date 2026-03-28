// src/app/dashboard/campaigns/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign } from '@/types'
import { Megaphone, Sparkles, TrendingUp, Activity } from 'lucide-react'

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:    ['badge-active',  '● Activa'],
    paused:    ['badge-paused',  '● Pausada'],
    draft:     ['badge-draft',   'Borrador'],
    error:     ['badge-error',   '⚠ Error'],
    completed: ['badge-draft',   'Completada'],
  }
  const [cls, label] = map[status] || ['badge-draft', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

function RoasCell({ roas }: { roas?: number }) {
  if (!roas) return <span style={{ color: 'var(--muted)' }}>—</span>
  const color = roas >= 4 ? 'var(--accent3)' : roas >= 2 ? 'var(--warn)' : 'var(--danger)'
  const glow  = roas >= 4 ? 'rgba(6,214,160,0.35)' : roas >= 2 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'
  return (
    <span style={{ color, fontWeight: 700, fontSize: 14, textShadow: `0 0 12px ${glow}` }}>
      {roas.toFixed(1)}x
    </span>
  )
}

const OBJ_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: '👁 Reconocimiento',
  OUTCOME_TRAFFIC: '🖱 Tráfico',
  OUTCOME_ENGAGEMENT: '💬 Engagement',
  OUTCOME_LEADS: '📩 Leads',
  OUTCOME_SALES: '🛒 Ventas',
  OUTCOME_APP_PROMOTION: '📱 App',
  // legacy
  CONVERSIONS: '🛒 Conversiones',
  TRAFFIC: '🖱 Tráfico',
  REACH: '👁 Alcance',
  LEAD_GENERATION: '📩 Leads',
}

export default async function CampaignsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false }) as { data: Campaign[] | null }

  const total  = campaigns?.length || 0
  const active = campaigns?.filter(c => c.status === 'active').length || 0
  const draft  = campaigns?.filter(c => c.status === 'draft').length || 0

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-8 dash-anim-1">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
            Mis campañas
          </p>
          <h1 className="page-title mb-1.5">Gestión de campañas</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--muted)' }}>
            <span>{total} total</span>
            <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
            <span style={{ color: 'var(--accent3)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent3)', display: 'inline-block', boxShadow: '0 0 6px rgba(6,214,160,0.7)' }} />
              {active} activa{active !== 1 ? 's' : ''}
            </span>
            {draft > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
                <span style={{ color: 'var(--muted)' }}>{draft} borrador{draft !== 1 ? 'es' : ''}</span>
              </>
            )}
          </div>
        </div>
        <Link href="/dashboard/create" className="btn-primary">
          <Sparkles size={14} /> Crear con IA
        </Link>
      </div>

      {/* ── Mini stat row ── */}
      <div className="grid grid-cols-3 gap-4 mb-6 dash-anim-2">
        {[
          { label: 'Campañas totales', value: total,  Icon: Megaphone, color: '#62c4b0' },
          { label: 'Activas ahora',    value: active, Icon: Activity,  color: '#06d6a0' },
          { label: 'En borrador',      value: draft,  Icon: TrendingUp, color: '#f59e0b' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="metric-card" style={{ borderTop: `2px solid ${color}`, padding: '14px 18px' }}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8892b0' }}>{label}</p>
              <Icon size={14} style={{ color }} strokeWidth={1.75} />
            </div>
            <p style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', color: '#ffffff' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {!campaigns?.length ? (
        <div className="card p-16 text-center dash-anim-3" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: 'rgba(233,30,140,0.08)', border: '1px solid rgba(233,30,140,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>
            📣
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e0e0f0', marginBottom: 10 }}>Sin campañas todavía</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
            Creá tu primera campaña y la IA generará todos los textos automáticamente en segundos.
          </p>
          <Link href="/dashboard/create" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Sparkles size={14} /> Crear primera campaña
          </Link>
        </div>
      ) : (
        <div className="card dash-anim-3">
          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2">
              <Megaphone size={14} style={{ color: '#e91e8c' }} />
              <h2 className="section-title">Todas las campañas</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  {['CAMPAÑA', 'OBJETIVO', 'ESTADO', 'PRESUP./DÍA', 'GASTO', 'ROAS', 'CONV.', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="px-5 py-4">
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {OBJ_LABELS[c.objective] || c.objective}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: 600 }}>
                      ${c.daily_budget}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/día</span>
                    </td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                      ${(c.metrics?.spend || 0).toFixed(0)}
                    </td>
                    <td className="px-5 py-4"><RoasCell roas={c.metrics?.roas} /></td>
                    <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                      {c.metrics?.conversions || <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Link href={`/dashboard/campaigns/${c.id}`}
                          style={{
                            fontSize: 11, padding: '5px 10px', borderRadius: 8,
                            background: 'rgba(233,30,140,0.08)', color: '#f9a8d4',
                            border: '1px solid rgba(233,30,140,0.18)',
                            transition: 'background 0.15s', display: 'inline-block',
                          }}>
                          Ver →
                        </Link>
                        {c.status === 'active' && (
                          <span style={{
                            fontSize: 10, padding: '4px 8px', borderRadius: 6,
                            background: 'rgba(6,214,160,0.08)', color: 'var(--accent3)',
                            border: '1px solid rgba(6,214,160,0.18)',
                          }}>
                            En vivo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
