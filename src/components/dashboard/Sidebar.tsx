'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Megaphone, Sparkles, Images,
  BarChart2, Settings, HelpCircle, LogOut, Zap, Shield, CreditCard,
  Activity, DollarSign, Brain,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'
import { PLAN_CREDITS } from '@/lib/plans'
import { useSidebar } from './SidebarContext'

type NavItem = { href: string; icon: any; label: string; badge?: string; badgeColor?: string }

interface Props { user: User; profile: Profile | null }

// Level color mapping
const LEVEL_COLORS: Record<number, string> = {
  0: '#8892b0', 1: '#ef4444', 2: '#ef4444', 3: '#f59e0b', 4: '#f59e0b',
  5: '#06d6a0', 6: '#06d6a0', 7: '#3b82f6', 8: '#8b5cf6',
}

const LEVEL_ICONS: Record<number, string> = {
  0: '🌑', 1: '🌱', 2: '📚', 3: '🧠', 4: '🛒', 5: '💼', 6: '🚀', 7: '👑', 8: '🏰',
}

// Compute next-level metric from pixel events
function nextLevelMetric(level: number, events: any) {
  const map: Record<number, { metric: string; target: number; current: number }> = {
    0: { metric: 'PageView', target: 100,  current: events?.PageView?.count_30d    ?? 0 },
    1: { metric: 'PageView', target: 500,  current: events?.PageView?.count_30d    ?? 0 },
    2: { metric: 'ViewContent', target: 1000, current: events?.ViewContent?.count_30d ?? 0 },
    3: { metric: 'AddToCart', target: 100,  current: events?.AddToCart?.count_30d   ?? 0 },
    4: { metric: 'Purchase', target: 50,    current: events?.Purchase?.count_30d    ?? 0 },
    5: { metric: 'Purchase', target: 100,   current: events?.Purchase?.count_30d    ?? 0 },
    6: { metric: 'Purchase', target: 500,   current: events?.Purchase?.count_180d   ?? 0 },
    7: { metric: 'Purchase', target: 1000,  current: events?.Purchase?.count_180d   ?? 0 },
  }
  return map[level] || { metric: '', target: 1, current: 1 }
}

export default function Sidebar({ user, profile }: Props) {
  const pathname = usePathname()
  const router   = useRouter()
  const { mobileOpen, close } = useSidebar()

  // ── Live data ────────────────────────────────────────────────────────────
  const [liveCredits, setLiveCredits] = useState<{ total: number; used: number; plan: string } | null>(null)
  const [pixelLevel,    setPixelLevel]    = useState<number>(0)
  const [pixelLevelName, setPixelLevelName] = useState<string>('Sin Data')
  const [pixelEvents,    setPixelEvents]    = useState<any>(null)
  const [campaignCount,  setCampaignCount]  = useState<number>(0)
  const [hasPixel,       setHasPixel]       = useState<boolean>(false)
  const [onboarding,     setOnboarding]     = useState<{ isComplete: boolean; completedSteps: number; totalSteps: number; completionScore: number } | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    // Credits
    supabase.from('profiles').select('credits_total, credits_used, plan').eq('id', user.id).single()
      .then(({ data }) => {
        if (data && active) {
          setLiveCredits({
            total: data.credits_total ?? PLAN_CREDITS[data.plan ?? 'free'] ?? 10,
            used:  data.credits_used  ?? 0,
            plan:  data.plan          ?? 'free',
          })
        }
      })

    // Pixel
    supabase.from('pixel_analysis').select('level, level_name, events_data').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data && active) {
          setPixelLevel(data.level ?? 0)
          setPixelLevelName(data.level_name ?? 'Sin Data')
          setPixelEvents(data.events_data)
          setHasPixel(true)
        }
      })

    // Campaigns count
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => {
        if (active && typeof count === 'number') setCampaignCount(count)
      })

    // Onboarding status (lightweight fetch)
    fetch('/api/onboarding/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (active && data) {
          setOnboarding({
            isComplete: data.isComplete,
            completedSteps: data.completedSteps,
            totalSteps: data.totalSteps,
            completionScore: data.completionScore,
          })
        }
      })
      .catch(() => { /* ignore */ })

    return () => { active = false }
  }, [user.id, pathname])

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

  const resolvedPlan = liveCredits?.plan ?? profile?.plan ?? 'free'
  const creditsTotal = liveCredits?.total ?? profile?.credits_total ?? PLAN_CREDITS[profile?.plan ?? 'free'] ?? 10
  const creditsUsed  = liveCredits?.used  ?? profile?.credits_used  ?? 0
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed)
  const creditsPct       = creditsTotal > 0 ? (creditsUsed / creditsTotal) * 100 : 0
  const creditsLow       = creditsRemaining === 0 || creditsPct >= 80
  const creditsPlenty    = !creditsLow && creditsPct < 50

  const planLabel = resolvedPlan === 'pro' ? 'Pro' : resolvedPlan === 'agency' ? 'Agencia' : resolvedPlan === 'starter' ? 'Starter' : 'Free'
  const planColor = resolvedPlan === 'pro' ? 'var(--ds-color-primary)' : resolvedPlan === 'agency' ? '#f59e0b' : resolvedPlan === 'starter' ? 'var(--ds-color-primary)' : 'var(--ds-color-primary)'

  // Growth score
  const growthScore = hasPixel
    ? Math.round(
        pixelLevel * 100 +
        Math.min(200, (pixelEvents?.PageView?.count_30d  ?? 0) / 5) +
        Math.min(150, (pixelEvents?.Purchase?.count_180d ?? 0) * 2) +
        campaignCount * 10,
      )
    : 0

  // Next level progress
  const nextMetric = nextLevelMetric(pixelLevel, pixelEvents)
  const progressPct = nextMetric.target > 0
    ? Math.min(100, Math.round((nextMetric.current / nextMetric.target) * 100))
    : 100
  const lvColor = LEVEL_COLORS[pixelLevel]
  const nextLevel = Math.min(pixelLevel + 1, 8)
  const remaining = Math.max(0, nextMetric.target - nextMetric.current)

  // Nav items
  const platformItems: NavItem[] = [
    { href: '/dashboard',           icon: LayoutDashboard, label: 'Resumen' },
    { href: '/dashboard/pixel',     icon: Activity,        label: 'Mi Pixel',     badge: hasPixel ? `Nv${pixelLevel}` : undefined },
    { href: '/dashboard/create',    icon: Sparkles,        label: 'Crear campaña', badge: 'IA' },
    { href: '/dashboard/campaigns', icon: Megaphone,       label: 'Mis campañas', badge: campaignCount > 0 ? String(campaignCount) : undefined },
    { href: '/dashboard/creatives', icon: Images,          label: 'Creativos' },
    { href: '/dashboard/strategist', icon: Brain,          label: 'Estratega IA', badge: 'Pronto', badgeColor: '#a855f7' },
  ]

  const managementItems: NavItem[] = [
    { href: '/dashboard/budget',  icon: DollarSign, label: 'Presupuesto' },
    { href: '/dashboard/phases',  icon: BarChart2,  label: 'Fases' },
    { href: '/dashboard/reports', icon: BarChart2,  label: 'Reportes' },
  ]

  const accountItems: NavItem[] = [
    { href: '/dashboard/billing',  icon: CreditCard, label: 'Plan y créditos' },
    { href: '/dashboard/settings', icon: Settings,   label: 'Configuración' },
    { href: '/dashboard/help',     icon: HelpCircle, label: 'Ayuda' },
  ]

  const barGrad = creditsRemaining === 0 ? '#ef4444, #ef4444'
    : creditsPct >= 80 ? '#f59e0b, #ef8c22'
    : 'var(--ds-color-primary), var(--ds-color-primary)'

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
        className={`fixed left-0 top-0 h-screen w-60 flex flex-col transition-transform duration-300 ease-out md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'rgba(11, 15, 36, 0.65)',
          borderRight: '1px solid var(--ds-border-soft)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          zIndex: 50,
        }}
      >

        {/* ── LOGO ── */}
        <div
          className="flex items-center gap-3 px-5 py-[18px]"
          style={{ borderBottom: '1px solid var(--ds-card-border)', position: 'relative', zIndex: 1 }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--ds-color-primary-soft)',
              border: '1px solid var(--ds-color-primary-border)',
            }}
          >
            <Zap size={14} color="var(--ds-color-primary)" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ds-text-primary)' }}>
              AdFlow
            </span>
          </div>
        </div>

        {/* ── SCROLL CONTAINER ── */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto" style={{ position: 'relative', zIndex: 1 }}>
          {/* ── LEVEL WIDGET ── */}
          <Link href={hasPixel ? '/dashboard/pixel' : '/dashboard/settings'} onClick={close} style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}>
            <div style={{
              padding: '14px 14px 12px',
              borderRadius: 14,
              background: hasPixel
                ? `linear-gradient(135deg, ${lvColor}14, ${lvColor}04)`
                : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
              border: hasPixel ? `1px solid ${lvColor}40` : '1px solid rgba(255,255,255,0.08)',
              boxShadow: hasPixel ? `0 4px 20px rgba(0,0,0,0.25), 0 0 24px ${lvColor}10` : '0 4px 16px rgba(0,0,0,0.25)',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
              transition: 'all 0.2s ease',
            }}>
              {hasPixel ? (
                <>
                  {/* Top glow */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: `linear-gradient(90deg, transparent, ${lvColor}80, transparent)`,
                    pointerEvents: 'none',
                  }} />
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 18 }}>{LEVEL_ICONS[pixelLevel]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                        Nivel {pixelLevel}: {pixelLevelName}
                      </p>
                      <p style={{ fontSize: 10, fontWeight: 700, color: lvColor, marginTop: 1 }}>
                        ⭐ {growthScore.toLocaleString()} pts
                      </p>
                    </div>
                  </div>
                  {pixelLevel < 8 && (
                    <>
                      <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 5 }}>
                        <div style={{
                          height: '100%',
                          width: `${progressPct}%`,
                          background: `linear-gradient(90deg, ${lvColor}, ${LEVEL_COLORS[nextLevel]})`,
                          boxShadow: `0 0 8px ${lvColor}80`,
                          borderRadius: 99,
                          transition: 'width 0.6s ease',
                        }} />
                      </div>
                      <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>
                        {remaining > 0
                          ? `${remaining} ${nextMetric.metric} para Nivel ${nextLevel}`
                          : `¡Listo para Nivel ${nextLevel}!`}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 18 }}>🌑</span>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Sin pixel</p>
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>
                    Configuralo para empezar a medir
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
                    Configurar →
                  </p>
                </>
              )}
            </div>
          </Link>

          {/* ── SETUP MINI WIDGET (only if onboarding incomplete) ── */}
          {onboarding && !onboarding.isComplete && (
            <Link href="/dashboard/onboarding" onClick={close} style={{ textDecoration: 'none', display: 'block', marginBottom: 14 }}>
              <div style={{
                padding: '11px 12px',
                borderRadius: 12,
                background: 'var(--ds-color-primary-soft)',
                border: '1px solid var(--ds-color-primary-border)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 13 }}>🚀</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ds-text-primary)', flex: 1 }}>
                    Setup: {onboarding.completedSteps}/{onboarding.totalSteps}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--ds-color-primary)' }}>
                    {onboarding.completionScore}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${onboarding.completionScore}%`,
                    background: 'var(--ds-color-primary)',
                    borderRadius: 99,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            </Link>
          )}

          {/* ── SECTION: PLATAFORMA ── */}
          <p className="section-label px-2 pb-2">Plataforma</p>
          {platformItems.map(({ href, icon: Icon, label, badge, badgeColor }) => {
            const active = isActive(href)
            const isLevelBadge = label === 'Mi Pixel' && badge && hasPixel
            const customBadge = !!badgeColor
            return (
              <Link key={href} href={href} onClick={close}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.75}
                  style={{
                    color: active ? 'var(--ds-color-primary)' : 'var(--ds-text-secondary)',
                    filter: 'none',
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
                    style={isLevelBadge ? {
                      background: `${lvColor}20`,
                      color: lvColor,
                      border: `1px solid ${lvColor}50`,
                      boxShadow: `0 0 8px ${lvColor}30`,
                    } : customBadge ? {
                      background: `${badgeColor}1f`,
                      color: badgeColor,
                      border: `1px solid ${badgeColor}66`,
                      opacity: 0.85,
                    } : {
                      background: 'var(--ds-color-primary-soft)',
                      color: 'var(--ds-color-primary)',
                      border: '1px solid var(--ds-color-primary-border)',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* ── SECTION: GESTIÓN ── */}
          <p className="section-label px-2 pt-4 pb-2">Gestión</p>
          {managementItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} onClick={close}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.75}
                  style={{
                    color: active ? 'var(--ds-color-primary)' : 'var(--ds-text-secondary)',
                    filter: 'none',
                    flexShrink: 0,
                  }} />
                <span style={{
                  fontSize: 13,
                  color: active ? '#ffffff' : '#a0a8c0',
                  textShadow: active ? '0 0 12px rgba(255,255,255,0.15)' : 'none',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* ── CREDITS WIDGET ── */}
          <div style={{ marginTop: 14, marginBottom: 4 }}>
            <Link href="/dashboard/billing" onClick={close} style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{
                borderRadius: 14,
                padding: '14px 14px 12px',
                background: creditsLow
                  ? 'linear-gradient(135deg, rgba(239,68,68,0.14) 0%, rgba(220,38,38,0.07) 100%)'
                  : creditsPlenty
                    ? 'linear-gradient(135deg, var(--ds-color-primary-soft) 0%, transparent 100%)'
                    : 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, transparent 100%)',
                border: creditsLow
                  ? '1px solid rgba(239,68,68,0.40)'
                  : creditsPlenty
                    ? '1.5px solid transparent'
                    : '1px solid rgba(245,158,11,0.30)',
                backgroundImage: creditsPlenty
                  ? 'linear-gradient(rgba(10,3,6,0.8), rgba(6,8,6,0.8)), linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary))'
                  : undefined,
                backgroundOrigin: creditsPlenty ? 'border-box' : undefined,
                backgroundClip: creditsPlenty ? 'padding-box, border-box' : undefined,
                boxShadow: creditsLow
                  ? '0 4px 16px rgba(239,68,68,0.14), 0 1px 0 rgba(255,255,255,0.05) inset'
                  : '0 4px 20px var(--ds-color-primary-soft), 0 1px 0 rgba(255,255,255,0.06) inset',
                cursor: 'pointer',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  background: creditsLow
                    ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.55), transparent)'
                    : 'linear-gradient(90deg, transparent, transparent, transparent, transparent)',
                  pointerEvents: 'none',
                }} />

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Zap size={10} style={{ color: creditsLow ? '#fca5a5' : 'var(--ds-color-primary)' }} strokeWidth={2.2} />
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: creditsLow ? '#fca5a5' : '#d0d0f0' }}>
                      Créditos IA
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5 mb-2">
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 24, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
                    color: creditsLow ? '#fca5a5' : '#ffffff',
                    textShadow: creditsLow ? '0 0 16px rgba(239,68,68,0.70)' : '0 0 20px rgba(255,255,255,0.25)',
                  }}>
                    {creditsRemaining}
                  </span>
                  <span style={{ fontSize: 11, color: '#8892b0', fontWeight: 500 }}>
                    / {creditsTotal}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 5, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, creditsPct)}%`,
                    borderRadius: 99,
                    background: `linear-gradient(90deg, ${barGrad})`,
                    boxShadow: creditsLow ? '0 0 8px #ef444490' : '0 0 10px transparent',
                    transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>

                <p style={{
                  fontSize: 10, fontWeight: 600,
                  color: creditsRemaining === 0 ? '#f87171' : creditsPct >= 80 ? '#f59e0b' : '#a0a8c0',
                }}>
                  {creditsRemaining === 0
                    ? '⚠ Sin créditos · Mejorar →'
                    : creditsPct >= 80
                      ? `⚠ Pocos créditos · Ver planes →`
                      : `Ver planes →`}
                </p>
              </div>
            </Link>
          </div>

          {/* ── SECTION: CUENTA ── */}
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <div style={{ height: 1, background: 'transparent', marginBottom: 10 }} />
            <p className="section-label px-2 pb-2">Cuenta</p>

            {accountItems.map(({ href, icon: Icon, label }) => {
              const active = isActive(href)
              return (
                <Link key={href} href={href} onClick={close}
                  className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.75}
                    style={{
                      color: active ? 'var(--ds-color-primary)' : '#8892b0',
                      filter: active ? 'drop-shadow(0 0 5px transparent)' : 'none',
                      flexShrink: 0,
                    }} />
                  <span style={{ fontSize: 13, color: active ? '#ffffff' : '#a0a8c0' }}>{label}</span>
                </Link>
              )
            })}

            {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link href="/admin" onClick={close} className="nav-item nav-item-inactive">
                <Shield size={16} strokeWidth={1.75} style={{ color: 'var(--ds-color-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--ds-color-primary)' }}>Panel Admin</span>
              </Link>
            )}

            <button onClick={handleLogout} className="nav-item nav-item-inactive text-left">
              <LogOut size={16} strokeWidth={1.75} style={{ color: '#8892b0', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#8892b0' }}>Cerrar sesión</span>
            </button>
          </div>
        </nav>

        {/* ── USER FOOTER ── */}
        <div
          className="px-3 py-3 flex items-center gap-2.5"
          style={{
            borderTop: '1px solid transparent',
            position: 'relative', zIndex: 1,
            background: 'rgba(0,0,0,0.35)',
          }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary))',
              boxShadow: '0 0 16px transparent, 0 0 32px var(--ds-color-primary-soft)',
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
