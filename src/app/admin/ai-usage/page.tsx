// src/app/admin/ai-usage/page.tsx
import { createAdminClient } from '@/lib/supabase/server'

export default async function AdminAiUsagePage() {
  const db = createAdminClient()

  // Tables may not exist yet — handle gracefully
  const [countResult, recentResult, profilesResult] = await Promise.allSettled([
    db.from('ai_requests').select('*', { count: 'exact', head: true }),
    db.from('ai_requests')
      .select('id, user_id, model, endpoint, input_tokens, output_tokens, cost_usd, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    db.from('profiles').select('id, full_name'),
  ])

  const tableExists =
    countResult.status === 'fulfilled' && !countResult.value.error?.message?.includes('does not exist') &&
    !countResult.value.error?.message?.includes('schema cache')

  if (!tableExists) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Uso de IA</h1>
        </div>
        <div className="admin-card rounded-2xl p-8 text-center">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-semibold mb-2">Tabla pendiente de migration</p>
          <p className="text-sm mb-6" style={{ color: '#b0b0d0' }}>
            La tabla <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#1a1a2e' }}>ai_requests</code> aún no fue creada en Supabase.
          </p>
          <div className="text-left max-w-2xl mx-auto p-4 rounded-xl text-xs font-mono overflow-auto"
               style={{ background: 'rgba(14,4,8,0.97)', border: '1px solid rgba(98,196,176,0.18)', color: '#62c4b0' }}>
            {`CREATE TABLE IF NOT EXISTS ai_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  model         TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
  endpoint      TEXT NOT NULL DEFAULT 'generate-copies',
  input_tokens  INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);
ALTER TABLE ai_requests ENABLE ROW LEVEL SECURITY;`}
          </div>
          <p className="text-xs mt-4" style={{ color: '#b0b0d0' }}>
            Ejecutar en:{' '}
            <span style={{ color: '#62c4b0' }}>
              supabase.com/dashboard/project/vnjgzmbzvlobttubjysw/sql/new
            </span>
          </p>
        </div>
      </div>
    )
  }

  const totalRequests = countResult.status === 'fulfilled' ? countResult.value.count : 0
  const recent = recentResult.status === 'fulfilled' ? recentResult.value.data || [] : []
  const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value.data || [] : []

  const profileMap: Record<string, string> = {}
  for (const p of profiles) {
    profileMap[p.id] = p.full_name || p.id.slice(0, 8)
  }

  const totalCost   = recent.reduce((s: number, r: any) => s + (r.cost_usd || 0), 0)
  const totalTokens = recent.reduce((s: number, r: any) => s + (r.input_tokens || 0) + (r.output_tokens || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">Uso de IA</h1>
        <p className="text-sm" style={{ color: '#b0b0d0' }}>{totalRequests ?? 0} requests totales</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Requests totales', value: totalRequests ?? 0, color: '#2dd4a8' },
          { label: 'Tokens (últimos 50)', value: totalTokens.toLocaleString(), color: '#a855f7' },
          { label: 'Costo estimado', value: `$${totalCost.toFixed(4)}`, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="admin-card p-5"
               style={{ borderTop: `2px solid ${color}` }}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: '#ffffff' }}>{label}</p>
            <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="admin-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-sm font-semibold" style={{ color: '#ffffff' }}>Últimas 50 requests</h2>
        </div>
        {!recent.length ? (
          <div className="text-center py-16 text-sm" style={{ color: '#b0b0d0' }}>
            No hay requests de IA registradas todavía.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(98,196,176,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Usuario', 'Modelo', 'Endpoint', 'Tokens in', 'Tokens out', 'Costo', 'Fecha'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                      style={{ color: '#ffffff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recent as any[]).map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-xs" style={{ color: '#c8c8e0' }}>
                    {profileMap[r.user_id] || r.user_id?.slice(0, 8) || '—'}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#f472b6' }}>{r.model}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#c8c8e0' }}>{r.endpoint}</td>
                  <td className="px-5 py-3 text-xs">{r.input_tokens ?? 0}</td>
                  <td className="px-5 py-3 text-xs">{r.output_tokens ?? 0}</td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#f59e0b' }}>
                    ${(r.cost_usd || 0).toFixed(6)}
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: '#b0b0d0' }}>
                    {new Date(r.created_at).toLocaleString('es-AR', {
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
