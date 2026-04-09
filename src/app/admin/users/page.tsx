// src/app/admin/users/page.tsx
import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'
import AdminPlanSelect from '@/components/admin/AdminPlanSelect'
import AdminCreditsModal from '@/components/admin/AdminCreditsModal'

const PLAN_COLORS: Record<string, string> = {
  free: '#62c4b0', starter: '#f472b6', pro: '#22d3ee', agency: '#f59e0b',
}
const ROLE_COLORS: Record<string, string> = {
  user: '#8892b0', admin: '#f59e0b', super_admin: '#ef4444',
}

export default async function AdminUsersPage() {
  noStore()
  const db = createAdminClient()

  const [
    { data: users },
    { data: campaignRows },
    { data: authData, error: authError },
  ] = await Promise.all([
    db.from('profiles').select('id, full_name, company, plan, role, credits_total, credits_used, created_at').order('created_at', { ascending: false }),
    db.from('campaigns').select('user_id'),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ])

  // Map auth info by user id
  const authMap: Record<string, { email: string; last_sign_in_at: string | null }> = {}
  for (const u of (authData?.users ?? [])) {
    authMap[u.id] = { email: u.email ?? '', last_sign_in_at: u.last_sign_in_at ?? null }
  }

  const countMap: Record<string, number> = {}
  for (const c of campaignRows || []) {
    countMap[c.user_id] = (countMap[c.user_id] || 0) + 1
  }

  const total    = users?.length ?? 0
  const admins   = (users || []).filter((u: any) => u.role !== 'user').length
  const proPlus  = (users || []).filter((u: any) => ['pro', 'agency'].includes(u.plan)).length

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-1">Usuarios</h1>
          <p className="text-sm" style={{ color: '#b0b0d0' }}>
            {total} registrados · {proPlus} de pago · {admins} administradores
          </p>
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(98,196,176,0.05)', borderBottom: '1px solid rgba(98,196,176,0.15)' }}>
              {['Usuario', 'Email', 'Plan', 'Créditos', 'Rol', 'Campañas', 'Último acceso', 'Registro', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold tracking-wider uppercase"
                    style={{ color: '#ffffff' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(users || []).map((u: any) => {
              const auth = authMap[u.id]
              const lastSeen = auth?.last_sign_in_at
                ? new Date(auth.last_sign_in_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })
                : '—'
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(100,80,180,0.12)' }}
                    className="transition-colors hover:bg-white/[0.03]">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-medium">{u.full_name || '—'}</p>
                    <p className="text-xs" style={{ color: '#b0b0d0' }}>{u.company || u.id.slice(0, 8) + '…'}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#c8c8e0' }}>
                    {auth?.email || '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminPlanSelect userId={u.id} currentPlan={u.plan ?? 'free'} />
                  </td>
                  <td className="px-4 py-3.5">
                    {(() => {
                      const total     = u.credits_total ?? 10
                      const used      = u.credits_used  ?? 0
                      const remaining = Math.max(0, total - used)
                      const pct       = total > 0 ? Math.round((used / total) * 100) : 0
                      const barColor  = remaining === 0 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#06d6a0'
                      return (
                        <div style={{ minWidth: 110 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                            <span title="Disponibles" style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{remaining}</span>
                            <span style={{ fontSize: 10, color: '#8892b0' }}>/</span>
                            <span title="Total" style={{ fontSize: 11, color: '#8892b0' }}>{total}</span>
                            <span title="Usados" style={{ fontSize: 10, color: '#8892b0' }}>({used} us.)</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 3, overflow: 'hidden', width: 72 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: barColor, borderRadius: 99 }} />
                          </div>
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ background: `${ROLE_COLORS[u.role as UserRole] ?? 'rgba(255,255,255,0.12)'}20`,
                                   color: ROLE_COLORS[u.role as UserRole] ?? '#8892b0' }}>

                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-semibold" style={{ color: '#f472b6' }}>
                    {countMap[u.id] ?? 0}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#b0b0d0' }}>
                    {lastSeen}
                  </td>
                  <td className="px-4 py-3.5 text-xs" style={{ color: '#b0b0d0' }}>
                    {new Date(u.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminCreditsModal
                      userId={u.id}
                      userFullName={u.full_name || ''}
                      userEmail={auth?.email || ''}
                      currentPlan={u.plan ?? 'free'}
                      creditsTotal={u.credits_total ?? 10}
                      creditsUsed={u.credits_used ?? 0}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!users?.length && (
          <div className="text-center py-16" style={{ color: '#b0b0d0' }}>
            No hay usuarios registrados todavía.
          </div>
        )}
      </div>
    </div>
  )
}
