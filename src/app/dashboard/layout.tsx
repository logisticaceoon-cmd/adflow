// src/app/dashboard/layout.tsx
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'
import { ToastProvider } from '@/components/ui/ToastProvider'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  noStore()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, company, plan, role, report_email, report_time, report_active, created_at, credits_total, credits_used, credits_reset_date')
    .eq('id', user.id)
    .single()

  return (
    <div className="dashboard-layout">
      <ToastProvider>
        <SidebarProvider>
          <div className="flex min-h-screen" style={{ position: 'relative' }}>
            <Sidebar user={user} profile={profile} />
            <div className="flex-1 ml-0 md:ml-64 flex flex-col min-h-screen" style={{ scrollBehavior: 'smooth' }}>
              <TopBar />
              <main className="flex-1">
                <div className="dashboard-content">
                  <div className="dashboard-panel">
                    {children}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ToastProvider>
    </div>
  )
}
