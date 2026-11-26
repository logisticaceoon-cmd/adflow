// src/app/admin/events/page.tsx
import { createAdminClient } from '@/lib/supabase/server'

const EVENT_COLORS: Record<string, string> = {
  signup:             '#3b82f6',
  login:              '#60a5fa',
  campaign_created:   '#3b82f6',
  campaign_published: '#f59e0b',
  fb_connected:       '#1877f2',
  ai_generated:       '#60a5fa',
}

export default async function AdminEventsPage() {
  const db = createAdminClient()

  const [eventsResult, profilesResult] = await Promise.allSettled([
    db.from('user_events')
      .select('id, user_id, event, properties, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('profiles').select('id, full_name'),
  ])

  const tableExists =
    eventsResult.status === 'fulfilled' &&
    !eventsResult.value.error?.message?.includes('does not exist') &&
    !eventsResult.value.error?.message?.includes('schema cache')

  if (!tableExists) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Eventos</h1>
        </div>
        <div className="admin-card rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-semibold mb-2">Tabla pendiente de migration</p>
          <p className="text-sm mb-6" style={{ color: '#b0b0d0' }}>
            La tabla <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'rgba(14,4,8,0.97)' }}>user_events</code> aún no fue creada en Supabase.
          </p>
          <div className="text-left max-w-2xl mx-auto p-4 rounded-xl text-xs font-mono overflow-auto"
               style={{ background: 'rgba(14,4,8,0.97)', border: '1px solid rgba(37,99,235,0.2)', color: '#60a5fa' }}>
            {`CREATE TABLE IF NOT EXISTS user_events (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event      TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;`}
          </div>
          <p className="text-xs mt-4" style={{ color: '#b0b0d0' }}>
            Ejecutar en:{' '}
            <span style={{ color: '#3b82f6' }}>
              supabase.com/dashboard/project/vnjgzmbzvlobttubjysw/sql/new
            </span>
          </p>
        </div>
      </div>
    )
  }

  const events  = eventsResult.status === 'fulfilled' ? eventsResult.value.data || [] : []
  const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value.data || [] : []

  const profileMap: Record<string, string> = {}
  for (const p of profiles) profileMap[p.id] = p.full_name || p.id.slice(0, 8)

  const eventCounts: Record<string, number> = {}
  for (const e of events) eventCounts[e.event] = (eventCounts[e.event] || 0) + 1

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Eventos</h1>
        <p className="text-sm" style={{ color: '#b0b0d0' }}>
          Últimas 100 acciones de usuarios en la plataforma
        </p>
      </div>

      {Object.keys(eventCounts).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(eventCounts).map(([event, count]) => (
            <div key={event} className="px-3 py-1.5 rounded-xl flex items-center gap-2"
                 style={{ background: `${EVENT_COLORS[event] ?? 'rgba(255,255,255,0.35)'}15`,
                          border: `1px solid ${EVENT_COLORS[event] ?? 'rgba(255,255,255,0.35)'}30` }}>
              <span className="text-xs font-mono" style={{ color: EVENT_COLORS[event] ?? 'rgba(255,255,255,0.45)' }}>{event}</span>
              <span className="text-xs font-bold" style={{ color: EVENT_COLORS[event] ?? 'rgba(255,255,255,0.45)' }}>×{count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-card rounded-2xl overflow-hidden">
        {!events.length ? (
          <div className="text-center py-16 text-sm" style={{ color: '#b0b0d0' }}>
            No hay eventos registrados todavía.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(37,99,235,0.05)', borderBottom: '1px solid rgba(37,99,235,0.15)' }}>
                {['Evento', 'Usuario', 'Propiedades', 'Fecha'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                      style={{ color: '#ffffff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(events as any[]).map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid rgba(100,80,180,0.10)' }}
                    className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${EVENT_COLORS[e.event] ?? 'rgba(255,255,255,0.35)'}15`,
                                   color: EVENT_COLORS[e.event] ?? 'rgba(255,255,255,0.45)' }}>
                      {e.event}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#c8c8e0' }}>
                    {profileMap[e.user_id] || e.user_id?.slice(0, 8) || '—'}
                  </td>
                  <td className="px-5 py-3 text-xs font-mono max-w-xs truncate" style={{ color: '#b0b0d0' }}>
                    {Object.keys(e.properties || {}).length
                      ? JSON.stringify(e.properties).slice(0, 60)
                      : '—'}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#b0b0d0' }}>
                    {new Date(e.created_at).toLocaleString('es-AR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
