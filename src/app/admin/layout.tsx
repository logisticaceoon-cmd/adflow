// src/app/admin/layout.tsx
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import AdminClientShell from '@/components/admin/AdminClientShell'

export const metadata = { title: 'Admin — AdFlow' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get('x-pathname') ?? ''
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  noStore()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const adminDb = createAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', position: 'relative' }}>
      {/* ── Atmosphere blobs (landing hero style) ── */}
      <div className="admin-blob-fucsia" />
      <div className="admin-blob-rosa" />
      <div className="admin-blob-violet" />
      <div className="admin-blob-indigo" />

      <AdminClientShell>
        {children}
      </AdminClientShell>
    </div>
  )
}
