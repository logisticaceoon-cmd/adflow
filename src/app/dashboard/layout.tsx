// src/app/dashboard/layout.tsx
import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import { SidebarProvider } from '@/components/dashboard/SidebarContext'

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
    <div style={{
      background: 'linear-gradient(160deg, #0f0f17 0%, #12102a 60%, #0f0f17 100%)',
      minHeight: '100vh',
      position: 'relative',
    }}>

      {/* ── Atmospheric background orbs ── */}
      <div className="dash-orb-pink" />
      <div className="dash-orb-purple" />
      <div className="dash-orb-teal" />

      {/* ── Center ambient illumination ── */}
      <div style={{
        position: 'fixed',
        top: '15%', left: '53%',
        transform: 'translateX(-50%)',
        width: '1000px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.040) 0%, rgba(98,196,176,0.06) 40%, transparent 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Top-center pink sparkle ── */}
      <div style={{
        position: 'fixed',
        top: '-8%', left: '50%',
        transform: 'translateX(-50%)',
        width: '700px', height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(234,27,126,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Bottom teal ambient ── */}
      <div style={{
        position: 'fixed',
        bottom: '-12%', left: '50%',
        transform: 'translateX(-50%)',
        width: '800px', height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(98,196,176,0.10) 0%, transparent 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Subtle grid overlay ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)',
        backgroundSize: '80px 80px',
        maskImage: 'radial-gradient(ellipse 75% 75% at 50% 40%, black 20%, transparent 100%)',
      }} />

      <SidebarProvider>
        <div className="flex min-h-screen" style={{ position: 'relative', zIndex: 1 }}>
          <Sidebar user={user} profile={profile} />
          <div className="flex-1 ml-0 md:ml-60 flex flex-col min-h-screen" style={{ scrollBehavior: 'smooth' }}>
            <TopBar />
            <main className="flex-1 p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  )
}
