// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si no hay sesión, redirigir al login
  if (!user) redirect('/login')

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar user={user} profile={profile} />
      <main className="flex-1 ml-60 overflow-y-auto min-h-screen">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
