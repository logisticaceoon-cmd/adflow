// src/app/admin/dashboard/page.tsx
import { unstable_noStore as noStore } from 'next/cache'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  Megaphone, Sparkles, TrendingUp,
  Activity, ArrowRight, CircleDot, DollarSign, Users,
} from 'lucide-react'
import Link from 'next/link'
import UsersKpiNode from '@/components/admin/UsersKpiNode'
import CountryWidget, { type CountryData } from '@/components/admin/CountryWidget'

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, Icon, href, delay = 0 }: {
  label: string; value: string | number; sub: string
  color: string; Icon: React.ElementType; href: string; delay?: number
}) {
  return (
    <Link href={href}
      className="group admin-card p-5 flex flex-col gap-3"
      style={{
        borderTop: `2px solid ${color}`,
        animation: `adminFadeUp 0.5s ease-out ${delay}ms both`,
      }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>
          {label}
        </p>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
          style={{
            background: `${color}15`,
            boxShadow: `0 0 0 0 ${color}40`,
          }}>
          <Icon size={15} style={{ color }} strokeWidth={1.75} />
        </div>
      </div>
      <p className="text-3xl font-extrabold tracking-tight" style={{ color }}>{value}</p>
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: '#9090b8' }}>{sub}</p>
        <ArrowRight size={12} className="opacity-0 group-hover:opacity-70 transition-opacity" style={{ color }} />
      </div>
    </Link>
  )
}

function MetricBand({ label, value, sub, color, Icon, delay = 0 }: {
  label: string; value: string; sub: string; color: string; Icon: React.ElementType; delay?: number
}) {
  return (
    <div className="admin-card p-5 flex items-center gap-5"
      style={{
        borderTop: `2px solid ${color}`,
        animation: `adminFadeUp 0.5s ease-out ${delay}ms both`,
      }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}12`, boxShadow: `0 0 20px ${color}20` }}>
        <Icon size={22} style={{ color }} strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: '#ffffff' }}>{label}</p>
        <p className="text-3xl font-extrabold tracking-tight" style={{ color }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: '#9090b8' }}>{sub}</p>
      </div>
    </div>
  )
}

function SectionCard({ title, accentColor = '#62c4b0', children, delay = 0 }: {
  title: string; accentColor?: string; children: React.ReactNode; delay?: number
}) {
  return (
    <div className="admin-card overflow-hidden"
      style={{ animation: `adminFadeUp 0.5s ease-out ${delay}ms both` }}>
      <div className="px-5 py-3.5 border-b flex items-center gap-2.5"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: accentColor,
          boxShadow: `0 0 6px ${accentColor}80`,
        }} />
        <h2 className="text-[11px] font-bold tracking-widest uppercase" style={{ color: '#ffffff' }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  noStore()
  const db   = createAdminClient()
  const anon = createClient()

  const { data: { user } } = await anon.auth.getUser()
  const { data: me } = await db.from('profiles').select('full_name').eq('id', user!.id).single()

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalUsers },
    { count: activeThisMonth },
    { count: totalCampaigns },
    { count: activeCampaigns },
    { count: aiRequests },
    { data: plans },
    { data: recentUsers },
    { data: recentCampaigns },
  ] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('campaigns').select('*', { count: 'exact', head: true }),
    db.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('ai_requests').select('*', { count: 'exact', head: true }),
    db.from('profiles').select('plan'),
    db.from('profiles').select('id, full_name, plan, role, created_at').order('created_at', { ascending: false }).limit(8),
    db.from('campaigns').select('id, name, status, daily_budget, created_at').order('created_at', { ascending: false }).limit(6),
  ])

  // MRR estimate
  const PRICES: Record<string, number> = { free: 0, pro: 49, agency: 149 }
  const mrr = (plans || []).reduce((s: number, p: any) => s + (PRICES[p.plan] ?? 0), 0)

  // AI cost estimate
  const aiCost = ((aiRequests ?? 0) * 0.001).toFixed(2)

  const greeting = now.getHours() < 13 ? 'Buenos días' : now.getHours() < 20 ? 'Buenas tardes' : 'Buenas noches'
  const firstName = me?.full_name?.split(' ')[0] || 'Admin'

  // Country distribution (graceful: column may not exist yet)
  let countryData: CountryData[] = []
  try {
    const { data: countries } = await db
      .from('profiles')
      .select('country_code')
      .not('country_code', 'is', null)
    if (countries && countries.length > 0) {
      const counts: Record<string, number> = {}
      countries.forEach((p: any) => {
        const c = (p.country_code as string)?.toUpperCase() || 'OTHER'
        counts[c] = (counts[c] || 0) + 1
      })
      const total = countries.length
      countryData = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([country, count]) => ({
          country,
          count,
          pct: Math.round((count / total) * 100),
        }))
    }
  } catch {
    // Column doesn't exist yet — widget will show placeholder
  }

  const STATUS_DOT: Record<string, string> = {
    active: '#06d6a0', draft: 'rgba(255,255,255,0.35)', paused: '#f59e0b',
    completed: '#62c4b0', error: '#ef4444',
  }

  // Plan distribution
  const planCounts = {
    free:   (plans || []).filter((p: any) => p.plan === 'free').length,
    pro:    (plans || []).filter((p: any) => p.plan === 'pro').length,
    agency: (plans || []).filter((p: any) => p.plan === 'agency').length,
  }
  const totalPlanUsers = planCounts.free + planCounts.pro + planCounts.agency || 1

  return (
    <>
      {/* Keyframes for this page */}
      <style>{`
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes kpiGlowPulse {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="mb-8 flex items-start justify-between"
          style={{ animation: 'adminFadeUp 0.4s ease-out both' }}>
          <div>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
              style={{ color: '#22d3ee' }}>
              Panel de Administración · AdFlow
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1.5"
              style={{
                background: 'linear-gradient(90deg, #ffffff 20%, #22d3ee 60%, #62c4b0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
              {greeting}, {firstName}
            </h1>
            <p className="text-sm flex items-center gap-2" style={{ color: '#c0a8c0' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: '#22d3ee', boxShadow: '0 0 6px rgba(233,30,140,0.8)' }} />
              Sistema operativo ·{' '}
              {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(234,27,126,0.15), rgba(98,196,176,0.08))',
              border: '1px solid rgba(233,30,140,0.35)',
              boxShadow: '0 0 20px rgba(233,30,140,0.1)',
            }}>
            <Activity size={13} style={{ color: '#f472b6' }} />
            <span className="text-xs font-semibold" style={{ color: '#f472b6' }}>Vista de plataforma</span>
          </div>
        </div>

        {/* ── Central KPI Node ───────────────────────────────────────── */}
        <UsersKpiNode count={totalUsers ?? 0} />

        {/* ── KPI row: 3 cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <KpiCard
            href="/admin/users"
            label="Nuevos este mes"
            value={activeThisMonth ?? 0}
            sub={`de ${totalUsers ?? 0} totales`}
            color="#62c4b0"
            Icon={TrendingUp}
            delay={100}
          />
          <KpiCard
            href="/admin/campaigns"
            label="Campañas activas"
            value={activeCampaigns ?? 0}
            sub={`de ${totalCampaigns ?? 0} totales en la plataforma`}
            color="#7dd3c8"
            Icon={Megaphone}
            delay={200}
          />
          <KpiCard
            href="/admin/ai-usage"
            label="Requests de IA"
            value={aiRequests ?? 0}
            sub={`~$${aiCost} costo estimado`}
            color="#4db6a9"
            Icon={Sparkles}
            delay={300}
          />
        </div>

        {/* ── Secondary metrics row ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <MetricBand
            label="MRR estimado"
            value={`$${mrr.toLocaleString()}`}
            sub="Basado en distribución de planes actuales"
            color="#62c4b0"
            Icon={DollarSign}
            delay={400}
          />
          <MetricBand
            label="Costo IA acumulado"
            value={`$${aiCost}`}
            sub="~$0.001 por request · Claude Haiku"
            color="#7dd3c8"
            Icon={Sparkles}
            delay={500}
          />
        </div>

        {/* ── Two-column: Users + right sidebar ───────────────────────── */}
        <div className="grid grid-cols-5 gap-6">

          {/* Recent users table */}
          <div className="col-span-3">
            <SectionCard title="Últimos usuarios registrados" accentColor="#22d3ee" delay={600}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Usuario', 'Plan', 'Rol', 'Registro'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-bold tracking-widest uppercase"
                        style={{ color: '#ffffff' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentUsers || []).map((u: any) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      className="transition-colors duration-150 hover:bg-white/[0.025]">
                      <td className="px-5 py-3 text-sm font-medium truncate max-w-[140px]">
                        {u.full_name || <span style={{ color: '#8888aa' }}>Sin nombre</span>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: u.plan === 'pro' ? 'rgba(234,27,126,0.15)'
                              : u.plan === 'agency' ? 'rgba(245,158,11,0.15)'
                              : 'rgba(255,255,255,0.05)',
                            color: u.plan === 'pro' ? '#22d3ee'
                              : u.plan === 'agency' ? '#f9a8d4'
                              : '#8892b0',
                          }}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] px-2 py-0.5 rounded-full capitalize"
                          style={{
                            background: u.role !== 'user' ? 'rgba(233,30,140,0.15)' : 'transparent',
                            color: u.role !== 'user' ? '#f472b6' : '#8892b0',
                          }}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px]" style={{ color: '#9090b8' }}>
                        {new Date(u.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-5 py-3.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <Link href="/admin/users"
                  className="text-xs font-semibold transition-opacity hover:opacity-80 flex items-center gap-1.5"
                  style={{ color: '#22d3ee' }}>
                  <Users size={12} />
                  Ver todos los usuarios →
                </Link>
              </div>
            </SectionCard>
          </div>

          {/* Right column */}
          <div className="col-span-2 flex flex-col gap-4">

            {/* Recent campaigns */}
            <SectionCard title="Campañas recientes" accentColor="#22d3ee" delay={700}>
              <div>
                {(recentCampaigns || []).map((c: any) => (
                  <div key={c.id}
                    className="px-5 py-3.5 flex items-center gap-3 transition-colors duration-150 hover:bg-white/[0.025]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: STATUS_DOT[c.status] ?? 'rgba(255,255,255,0.35)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.name}</p>
                      <p className="text-[11px] mt-0.5 capitalize" style={{ color: '#9090b8' }}>
                        ${c.daily_budget}/día · {c.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <Link href="/admin/campaigns"
                  className="text-xs font-semibold transition-opacity hover:opacity-80 flex items-center gap-1.5"
                  style={{ color: '#22d3ee' }}>
                  <Megaphone size={12} />
                  Ver todas las campañas →
                </Link>
              </div>
            </SectionCard>

            {/* Plan distribution */}
            <div className="admin-card p-5"
              style={{ animation: 'adminFadeUp 0.5s ease-out 800ms both' }}>
              <p className="text-[11px] font-bold tracking-widest uppercase mb-4"
                style={{ color: '#ffffff' }}>
                Distribución de planes
              </p>
              {[
                { label: 'Free',          key: 'free',   color: '#8892b0' },
                { label: 'Pro ($49)',      key: 'pro',    color: '#22d3ee' },
                { label: 'Agency ($149)', key: 'agency', color: '#f9a8d4' },
              ].map(({ label, key, color }) => {
                const count = planCounts[key as keyof typeof planCounts]
                const pct   = Math.round((count / totalPlanUsers) * 100)
                return (
                  <div key={key} className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs" style={{ color: '#b0b0d0' }}>{label}</p>
                      <p className="text-xs font-bold" style={{ color }}>{count}</p>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: color, width: `${pct}%`,
                        boxShadow: `0 0 8px ${color}50`,
                        transition: 'width 1s ease-out',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Country distribution widget ──────────────────────────────── */}
        <CountryWidget data={countryData} />
      </div>
    </>
  )
}
