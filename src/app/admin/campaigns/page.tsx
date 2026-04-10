// src/app/admin/campaigns/page.tsx
import { createAdminClient } from '@/lib/supabase/server'
import type { Campaign } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  active: '#2dd4a8', draft: '#8892b0', paused: '#f59e0b',
  completed: '#62c4b0', error: '#ef4444',
}

const OBJ_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS:       'Reconocimiento',
  OUTCOME_TRAFFIC:         'Tráfico',
  OUTCOME_ENGAGEMENT:      'Interacción',
  OUTCOME_LEADS:           'Leads',
  OUTCOME_APP_PROMOTION:   'App',
  OUTCOME_SALES:           'Ventas',
  CONVERSIONS:             'Conversiones',
  TRAFFIC:                 'Tráfico',
  REACH:                   'Alcance',
  LEAD_GENERATION:         'Generación de leads',
}

export default async function AdminCampaignsPage() {
  const db = createAdminClient()

  const { data: campaigns } = await db
    .from('campaigns')
    .select('id, name, objective, status, daily_budget, created_at, user_id, metrics')
    .order('created_at', { ascending: false })

  const { data: profiles } = await db
    .from('profiles')
    .select('id, full_name')

  const profileMap: Record<string, string> = {}
  for (const p of profiles || []) {
    profileMap[p.id] = p.full_name || p.id.slice(0, 8)
  }

  const typed = (campaigns || []) as Campaign[]
  const totalSpend = typed.reduce((s, c) => s + (c.metrics?.spend || 0), 0)
  const activeCount = typed.filter(c => c.status === 'active').length

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Campañas</h1>
          <p className="text-sm" style={{ color: '#b0b0d0' }}>
            {typed.length} campañas · {activeCount} activas · ${totalSpend.toFixed(0)} gasto total
          </p>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(98,196,176,0.05)', borderBottom: '1px solid rgba(98,196,176,0.15)' }}>
              {['Campaña', 'Usuario', 'Objetivo', 'Estado', 'Budget/día', 'Gasto', 'ROAS', 'Fecha'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                    style={{ color: '#ffffff' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {typed.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid rgba(100,80,180,0.12)' }}
                  className="transition-colors hover:bg-white/[0.03]">
                <td className="px-4 py-3.5">
                  <p className="text-sm font-medium truncate max-w-[180px]">{c.name}</p>
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: '#c8c8e0' }}>
                  {profileMap[c.user_id] || '—'}
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: '#c8c8e0' }}>
                  {OBJ_LABELS[c.objective] || c.objective}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ background: `${STATUS_COLORS[c.status] ?? 'rgba(255,255,255,0.12)'}20`,
                                 color: STATUS_COLORS[c.status] ?? '#8892b0' }}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm">${c.daily_budget}</td>
                <td className="px-4 py-3.5 text-sm">${(c.metrics?.spend || 0).toFixed(0)}</td>
                <td className="px-4 py-3.5 text-sm font-semibold"
                    style={{ color: (c.metrics?.roas || 0) >= 3 ? '#2dd4a8' : (c.metrics?.roas || 0) > 0 ? '#f59e0b' : '#8892b0' }}>
                  {c.metrics?.roas ? `${c.metrics.roas.toFixed(1)}x` : '—'}
                </td>
                <td className="px-4 py-3.5 text-xs" style={{ color: '#b0b0d0' }}>
                  {new Date(c.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!typed.length && (
          <div className="text-center py-16" style={{ color: '#b0b0d0' }}>
            No hay campañas todavía.
          </div>
        )}
      </div>
    </div>
  )
}
