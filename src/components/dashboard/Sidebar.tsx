'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Megaphone, Sparkles, Images,
  BarChart2, Settings, HelpCircle, LogOut, Zap, Shield, CreditCard,
  Activity, DollarSign,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { PLAN_CREDITS } from '@/lib/plans'
import { useSidebar } from './SidebarContext'

type NavItem = { href: string; icon: any; label: string; badge?: string }

const bottomItems = [
  { href: '/dashboard/billing',  icon: CreditCard, label: 'Plan y créditos' },
  { href: '/dashboard/settings', icon: Settings,   label: 'Configuración' },
  { href: '/dashboard/help',     icon: HelpCircle, label: 'Ayuda' },
]

interface Props { user: User; profile: Profile | null }

export default function Sidebar({ user, profile }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { mobileOpen, close } = useSidebar()

  // ── Live credits: always fetch fresh from DB ────────────────────────────────
  // The layout server component may be stale when admin changes credits or when
  // the user navigates within the dashboard without a full reload.
  // Refetching on every pathname change ensures the widget is always current.
  const [liveCredits, setLiveCredits] = useState<{
    total: number; used: number; plan: string
  } | null>(null)
  const [pixelLevel, setPixelLevel] = useState<number>(0)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    supabase
      .from('profiles')
      .select('credits_total, credits_used, plan')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data && active) {
          setLiveCredits({
            total: data.credits_total ?? PLAN_CREDITS[data.plan ?? 'free'] ?? 10,
            used:  data.credits_used  ?? 0,
            plan:  data.plan          ?? 'free',
          })
        }
      })

    supabase
      .from('pixel_analysis')
      .select('level')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && active && typeof data.level === 'number') setPixelLevel(data.level)
      })

    return () => { active = false }
  }, [user.id, pathname]) // re-fetch every time user navigates to a new page

  const navItems: NavItem[] = [
    { href: '/dashboard',           icon: LayoutDashboard, label: 'Resumen' },
    { href: '/dashboard/campaigns', icon: Megaphone,       label: 'Mis campañas' },
    { href: '/dashboard/create',    icon: Sparkles,        label: 'Crear con IA',  badge: 'IA' },
    { href: '/dashboard/creatives', icon: Images,          label: 'Creativos' },
    { href: '/dashboard/pixel',     icon: Activity,        label: 'Mi Pixel',      badge: pixelLevel > 0 ? `Nv${pixelLevel}` : undefined },
    { href: '/dashboard/budget',    icon: DollarSign,      label: 'Presupuesto' },
    { href: '/dashboard/phases',    icon: BarChart2,       label: 'Fases' },
  ]

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  // Use live data when available (after client-side fetch), else fall back to
  // layout props for the initial SSR render.
  const resolvedPlan         = liveCredits?.plan  ?? profile?.plan  ?? 'free'
  const creditsTotal         = liveCredits?.total ?? profile?.credits_total ?? PLAN_CREDITS[profile?.plan ?? 'free'] ?? 10
  const creditsUsed          = liveCredits?.used  ?? profile?.credits_used  ?? 0

  const planLabel = resolvedPlan === 'pro' ? 'Pro' : resolvedPlan === 'agency' ? 'Agencia' : resolvedPlan === 'starter' ? 'Starter' : 'Free'
  const planColor = resolvedPlan === 'pro' ? '#e91e8c' : resolvedPlan === 'agency' ? '#f59e0b' : resolvedPlan === 'starter' ? '#f472b6' : '#62c4b0'

  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed)
  const creditsPct       = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0
  const creditsLow       = creditsRemaining === 0 || creditsPct >= 80

  const barGrad = creditsRemaining === 0
    ? '#ef4444, #ef4444'
    : creditsPct >= 80
      ? '#f59e0b, #ef8c22'
      : '#e91e8c, #62c4b0'   // brand pink → teal

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        />
      )}
    <aside
      className={`fixed left-0 top-0 h-screen w-56 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{
        /* Premium sidebar: slightly lighter than background, teal-tinted border */
        background: 'linear-gradient(180deg, rgba(10,3,6,0.97) 0%, rgba(6,8,6,0.99) 100%)',
        borderRight: '1px solid rgba(98,196,176,0.12)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        zIndex: 50,
        boxShadow: '4px 0 48px rgba(0,0,0,0.65), 0 0 80px rgba(0,0,0,0.30)',
      }}
    >
      {/* ── Multi-layer inner gradient overlays ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(234,27,126,0.10) 0%, rgba(234,27,126,0.03) 30%, transparent 55%, rgba(98,196,176,0.05) 100%)',
        borderRadius: 'inherit',
      }} />
      {/* Right edge pink glow line */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, rgba(234,27,126,0.20) 30%, rgba(98,196,176,0.15) 70%, transparent 100%)',
      }} />

      {/* ── Logo ── */}
      <div
        className="flex items-center gap-3 px-5 py-[18px]"
        style={{ borderBottom: '1px solid rgba(98,196,176,0.10)', position: 'relative', zIndex: 1 }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
            /* Stronger, layered glow for logo */
            boxShadow: '0 0 24px rgba(233,30,140,0.70), 0 0 48px rgba(233,30,140,0.25), 0 2px 8px rgba(0,0,0,0.40)',
          }}
        >
          <Zap size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.04em', color: '#ffffff', textShadow: '0 0 20px rgba(255,255,255,0.15)' }}>
            AdFlow
          </span>
          <div className="ambient-line mt-0.5" style={{ width: 44 }} />
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>
        <p className="section-label px-2 pb-2.5">Plataforma</p>

        {navItems.map(({ href, icon: Icon, label, badge }) => {
          const active = isActive(href)
          return (
            <Link key={href} href={href} onClick={close}
              className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon
                size={16}
                strokeWidth={active ? 2.2 : 1.75}
                style={{
                  color: active ? '#e91e8c' : '#8892b0',
                  filter: active ? 'drop-shadow(0 0 6px rgba(233,30,140,0.60))' : 'none',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontSize: 13,
                color: active ? '#ffffff' : '#a0a8c0',
                textShadow: active ? '0 0 12px rgba(255,255,255,0.15)' : 'none',
              }}>
                {label}
              </span>
              {badge && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{
                    background: 'rgba(234,27,126,0.18)',
                    color: '#f9a8d4',
                    border: '1px solid rgba(234,27,126,0.30)',
                    boxShadow: '0 0 8px rgba(234,27,126,0.20)',
                  }}
                >
                  {badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* ── CREDITS WIDGET ── */}
        <div style={{ marginTop: 14, marginBottom: 2 }}>
          <Link href="/dashboard/billing" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              borderRadius: 14,
              padding: '14px 14px 12px',
              background: creditsLow
                ? 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(220,38,38,0.07) 100%)'
                : 'linear-gradient(135deg, rgba(234,27,126,0.14) 0%, rgba(98,196,176,0.08) 60%, rgba(98,196,176,0.04) 100%)',
              border: creditsLow
                ? '1px solid rgba(239,68,68,0.38)'
                : '1px solid rgba(234,27,126,0.28)',
              boxShadow: creditsLow
                ? '0 4px 16px rgba(239,68,68,0.14), 0 1px 0 rgba(255,255,255,0.05) inset'
                : '0 4px 20px rgba(234,27,126,0.18), 0 1px 0 rgba(255,255,255,0.06) inset',
              cursor: 'pointer',
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}>
              {/* Top edge glow line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: creditsLow
                  ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.55), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(234,27,126,0.60), rgba(98,196,176,0.35), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Plan badge + label row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: creditsLow ? '#ef4444' : planColor,
                    boxShadow: `0 0 8px ${creditsLow ? '#ef4444' : planColor}`,
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: creditsLow ? '#fca5a5' : '#d0d0f0' }}>
                    Plan {planLabel}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#8892b0', letterSpacing: '0.04em' }}>créditos IA</span>
              </div>

              {/* Big credit number */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{
                  fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
                  color: creditsLow ? '#fca5a5' : '#ffffff',
                  textShadow: creditsLow
                    ? '0 0 16px rgba(239,68,68,0.70)'
                    : '0 0 20px rgba(255,255,255,0.25)',
                }}>
                  {creditsRemaining}
                </span>
                <span style={{ fontSize: 12, color: '#8892b0', fontWeight: 500 }}>
                  / {creditsTotal}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, creditsPct)}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${barGrad})`,
                  boxShadow: creditsLow ? '0 0 8px #ef444490' : '0 0 10px rgba(234,27,126,0.70)',
                  transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>

              {/* Status line */}
              <p style={{
                fontSize: 10, fontWeight: 600,
                color: creditsRemaining === 0 ? '#f87171' : creditsPct >= 80 ? '#f59e0b' : '#8892b0',
              }}>
                {creditsRemaining === 0
                  ? '⚠ Sin créditos · Mejorá tu plan →'
                  : creditsPct >= 80
                    ? `⚠ Pocos créditos · Ver planes →`
                    : `Ver planes y créditos →`}
              </p>
            </div>
          </Link>
        </div>

        {/* ── Bottom items ── */}
        <div className="mt-auto pt-4 flex flex-col gap-0.5">
          <div style={{ height: 1, background: 'rgba(98,196,176,0.08)', marginBottom: 10 }} />
          <p className="section-label px-2 pb-2.5">Cuenta</p>

          {bottomItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.75}
                  style={{
                    color: active ? '#e91e8c' : '#8892b0',
                    filter: active ? 'drop-shadow(0 0 5px rgba(233,30,140,0.55))' : 'none',
                    flexShrink: 0,
                  }} />
                <span style={{ fontSize: 13, color: active ? '#ffffff' : '#a0a8c0' }}>{label}</span>
              </Link>
            )
          })}

          {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
            <Link href="/admin" className="nav-item nav-item-inactive">
              <Shield size={16} strokeWidth={1.75} style={{ color: '#62c4b0', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#62c4b0' }}>Panel Admin</span>
            </Link>
          )}

          <button onClick={handleLogout} className="nav-item nav-item-inactive text-left">
            <LogOut size={16} strokeWidth={1.75} style={{ color: '#8892b0', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#8892b0' }}>Cerrar sesión</span>
          </button>
        </div>
      </nav>

      {/* ── User footer ── */}
      <div
        className="px-3 py-3 flex items-center gap-2.5"
        style={{
          borderTop: '1px solid rgba(98,196,176,0.10)',
          position: 'relative', zIndex: 1,
          background: 'rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
            boxShadow: '0 0 16px rgba(233,30,140,0.50), 0 0 32px rgba(233,30,140,0.18)',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 12, fontWeight: 600, color: '#e0e0f8' }} className="truncate">
            {profile?.full_name || user.email?.split('@')[0] || 'Usuario'}
          </p>
          <p style={{ fontSize: 11, color: planColor, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: planColor,
              display: 'inline-block',
              boxShadow: `0 0 8px ${planColor}`,
            }} />
            Plan {planLabel}
          </p>
        </div>
      </div>
    </aside>
    </>
  )
}
