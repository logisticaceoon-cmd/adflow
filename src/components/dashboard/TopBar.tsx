'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Check, Menu, ChevronRight } from 'lucide-react'
import { useSidebar } from './SidebarContext'

// ── Notification types ─────────────────────────────────────────────────────
interface NotificationItem {
  id: string
  type: string
  title: string
  body: string | null
  severity: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  action_url: string | null
  created_at: string
}

// Icon + color per notification type
const TYPE_ICONS: Record<string, string> = {
  achievement_unlocked: '🏆',
  sync_completed:       '✅',
  sync_failed:          '❌',
  campaign_published:   '🚀',
  campaign_activated:   '▶',
  campaign_paused:      '⏸',
  campaign_scaled:      '📈',
  campaign_duplicated:  '✨',
  level_up:             '⬆️',
  budget_saved:         '💰',
  monthly_report_ready: '📊',
  pixel_threshold_reached: '📡',
  recommendation_new:   '💡',
  token_expiring:       '⚠️',
}

const SEVERITY_COLOR: Record<string, string> = {
  info:    '#62c4b0',
  success: '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
}

function iconFor(type: string, severity: string): string {
  return TYPE_ICONS[type] || (severity === 'error' ? '⚠️' : severity === 'success' ? '✅' : 'ℹ️')
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  const weeks = Math.floor(days / 7)
  return `hace ${weeks}sem`
}

// Map pathname (or prefix) → breadcrumb trail
const BREADCRUMBS: Array<{ match: (p: string) => boolean; trail: Array<{ label: string; href?: string }> }> = [
  { match: p => p === '/dashboard',                             trail: [{ label: 'Resumen' }] },
  { match: p => p === '/dashboard/pixel',                       trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mi Pixel' }] },
  { match: p => p === '/dashboard/onboarding',                  trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Onboarding' }] },
  { match: p => p === '/dashboard/create',                      trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Crear campaña' }] },
  { match: p => p === '/dashboard/campaigns',                   trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mis campañas' }] },
  { match: p => p.startsWith('/dashboard/campaigns/'),          trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mis campañas', href: '/dashboard/campaigns' }, { label: 'Detalle' }] },
  { match: p => p === '/dashboard/creatives',                   trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Creativos' }] },
  { match: p => p === '/dashboard/budget',                      trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Presupuesto' }] },
  { match: p => p === '/dashboard/phases',                      trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fases' }] },
  { match: p => p === '/dashboard/reports',                     trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reportes' }] },
  { match: p => p.startsWith('/dashboard/reports/monthly'),     trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reportes', href: '/dashboard/reports' }, { label: 'Mensual' }] },
  { match: p => p === '/dashboard/billing',                     trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Plan y créditos' }] },
  { match: p => p === '/dashboard/settings',                    trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Configuración' }] },
  { match: p => p === '/dashboard/help',                        trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Ayuda' }] },
]

function resolveBreadcrumb(pathname: string) {
  const match = BREADCRUMBS.find(b => b.match(pathname))
  return match?.trail || [{ label: 'Dashboard' }]
}

export default function TopBar() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const ref = useRef<HTMLDivElement>(null)
  const { toggle } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const trail = resolveBreadcrumb(pathname)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Refresh when route changes (catches new notifications after actions)
  useEffect(() => {
    fetchNotifications()
  }, [pathname, fetchNotifications])

  // Poll every 60s when tab is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = useCallback(async () => {
    const hadUnread = unreadCount > 0
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    if (!hadUnread) return
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      })
    } catch { /* ignore */ }
  }, [unreadCount])

  const handleNotificationClick = useCallback(async (n: NotificationItem) => {
    // Mark as read (optimistic)
    if (!n.is_read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      setUnreadCount(prev => Math.max(0, prev - 1))
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', ids: [n.id] }),
        })
      } catch { /* ignore */ }
    }
    setOpen(false)
    if (n.action_url) router.push(n.action_url)
  }, [router])

  const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

  return (
    <header className="topbar" style={{ justifyContent: 'space-between' }}>
      {/* ── Left: hamburger + breadcrumb ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
          aria-label="Abrir menú"
        >
          <Menu size={18} style={{ color: 'var(--muted)' }} strokeWidth={1.75} />
        </button>

        {/* Breadcrumb (hidden on small mobile) */}
        <nav className="hidden sm:flex items-center gap-1.5" style={{ minHeight: 36 }}>
          {trail.map((item, i) => {
            const isLast = i === trail.length - 1
            return (
              <div key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.25)' }} />
                )}
                {item.href && !isLast ? (
                  <Link href={item.href} style={{
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.55)',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f9a8d4' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)' }}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span style={{
                    fontSize: 12.5,
                    fontWeight: isLast ? 700 : 400,
                    color: isLast ? '#ffffff' : 'rgba(255,255,255,0.55)',
                    letterSpacing: isLast ? '-0.01em' : undefined,
                  }}>
                    {item.label}
                  </span>
                )}
              </div>
            )
          })}
        </nav>
      </div>

      {/* ── Right: notifications ── */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
          style={{
            background: open ? 'rgba(234,27,126,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${open ? 'rgba(234,27,126,0.40)' : 'rgba(255,255,255,0.09)'}`,
            boxShadow: unreadCount > 0
              ? '0 0 16px rgba(234,27,126,0.35), 0 0 28px rgba(234,27,126,0.15)'
              : (open ? '0 0 16px rgba(234,27,126,0.20)' : 'none'),
          }}
          onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.16)' } }}
          onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' } }}
          aria-label="Notificaciones"
        >
          <Bell size={16} style={{
            color: unreadCount > 0 || open ? '#f9a8d4' : 'var(--muted)',
            filter: unreadCount > 0 ? 'drop-shadow(0 0 4px rgba(234,27,126,0.60))' : 'none',
          }} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                minWidth: 16, height: 16, padding: unreadCount > 9 ? '0 4px' : 0,
                background: 'linear-gradient(135deg,#e91e8c,#c5006a)',
                color: '#fff',
                boxShadow: '0 0 10px rgba(233,30,140,0.80), 0 0 16px rgba(233,30,140,0.40)',
                animation: 'glowPulse 2.4s ease-in-out infinite',
              }}>
              {badgeLabel}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-96 rounded-2xl shadow-2xl overflow-hidden z-50"
               style={{
                 background: 'linear-gradient(160deg, rgba(14,8,22,0.98), rgba(8,8,16,0.99))',
                 border: '1px solid rgba(255,255,255,0.08)',
                 boxShadow: '0 24px 72px rgba(0,0,0,0.80), 0 0 40px rgba(234,27,126,0.08)',
                 backdropFilter: 'blur(24px)',
                 maxHeight: 520,
                 display: 'flex',
                 flexDirection: 'column',
               }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>🔔 Notificaciones</h3>
                {unreadCount > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 800,
                    padding: '2px 8px', borderRadius: 99,
                    background: 'rgba(233,30,140,0.15)', color: '#f9a8d4',
                    border: '1px solid rgba(233,30,140,0.35)',
                  }}>
                    {unreadCount} nuevas
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Check size={12} /> Marcar todas
                </button>
              )}
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>Cargando…</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 32, marginBottom: 8 }}>🌙</p>
                  <p style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                    Todo tranquilo por acá
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Las novedades de tus campañas van a aparecer acá
                  </p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                  {notifications.map(n => {
                    const sevColor = SEVERITY_COLOR[n.severity] || SEVERITY_COLOR.info
                    const icon = iconFor(n.type, n.severity)
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        role="button"
                        tabIndex={0}
                        style={{
                          display: 'flex', gap: 12, padding: '14px 16px',
                          cursor: n.action_url ? 'pointer' : 'default',
                          background: n.is_read ? 'transparent' : `${sevColor}08`,
                          borderLeft: n.is_read ? '3px solid transparent' : `3px solid ${sevColor}`,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = n.is_read ? 'rgba(255,255,255,0.03)' : `${sevColor}14` }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.is_read ? 'transparent' : `${sevColor}08` }}
                      >
                        <div style={{
                          width: 32, height: 32, flexShrink: 0,
                          borderRadius: '50%',
                          background: `${sevColor}14`,
                          border: `1px solid ${sevColor}40`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15,
                        }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{
                              fontSize: 12.5,
                              fontWeight: n.is_read ? 500 : 700,
                              color: n.is_read ? 'rgba(255,255,255,0.65)' : '#fff',
                              lineHeight: 1.35,
                              flex: 1, minWidth: 0,
                            }}>
                              {n.title}
                            </p>
                            <span style={{ fontSize: 10, color: 'var(--muted)', flexShrink: 0 }}>
                              {formatRelative(n.created_at)}
                            </span>
                          </div>
                          {n.body && (
                            <p style={{
                              fontSize: 11,
                              color: 'var(--muted)',
                              lineHeight: 1.4,
                              marginTop: 3,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical' as any,
                              overflow: 'hidden',
                            }}>
                              {n.body}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>
                  Mostrando las últimas {notifications.length}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
