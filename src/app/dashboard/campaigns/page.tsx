// src/app/dashboard/campaigns/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign } from '@/types'

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
  return <span style={{ color, fontWeight: 600 }}>{roas.toFixed(1)}x</span>
}

const OBJ_LABELS: Record<string, string> = {
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

  const active = campaigns?.filter(c => c.status === 'active').length || 0

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="page-title mb-1">Mis campañas</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {campaigns?.length || 0} total · {active} activa{active !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary">✨ Crear con IA</Link>
      </div>

      {!campaigns?.length ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📣</div>
          <h2 className="font-display text-xl font-bold mb-2">Sin campañas todavía</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
            Creá tu primera campaña y la IA generará los textos automáticamente.
          </p>
          <Link href="/dashboard/create" className="btn-primary">✨ Crear primera campaña</Link>
        </div>
      ) : (
        <div className="card">
          <div className="flex justify-between items-center px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <h2 className="section-title">Todas las campañas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {['CAMPAÑA', 'OBJETIVO', 'ESTADO', 'PRESUPUESTO/DÍA', 'GASTO', 'ROAS', 'CONVERSIONES', 'ACCIONES'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap"
                        style={{ color: 'var(--muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b transition-colors hover:bg-white/[0.02]"
                      style={{ borderColor: 'var(--border)' }}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--muted)' }}>
                      {OBJ_LABELS[c.objective] || c.objective}
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-4 text-sm">${c.daily_budget}/día</td>
                    <td className="px-5 py-4 text-sm">${(c.metrics?.spend || 0).toFixed(0)}</td>
                    <td className="px-5 py-4"><RoasCell roas={c.metrics?.roas} /></td>
                    <td className="px-5 py-4 text-sm">{c.metrics?.conversions || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        {c.status === 'active' && (
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(6,214,160,0.1)', color: 'var(--accent3)' }}>
                            En vivo
                          </span>
                        )}
                        {c.status === 'draft' && (
                          <Link href={`/dashboard/create?draft=${c.id}`}
                            className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(79,110,247,0.1)', color: 'var(--accent)' }}>
                            Continuar
                          </Link>
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
