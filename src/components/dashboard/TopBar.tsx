'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Check, Menu, ChevronRight } from 'lucide-react'
import { useSidebar } from './SidebarContext'

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: 'AdFlow está listo. Conectá tu cuenta de Facebook para empezar.', time: 'Ahora', read: false },
  { id: 2, text: 'Tip: Configurá tu perfil de negocio para mejores copies con IA.', time: 'Hace 1h', read: false },
  { id: 3, text: 'El reporte diario se enviará a tu email mañana a las 8:00 AM.', time: 'Ayer', read: true },
]

// Map pathname (or prefix) → breadcrumb trail
const BREADCRUMBS: Array<{ match: (p: string) => boolean; trail: Array<{ label: string; href?: string }> }> = [
  { match: p => p === '/dashboard',                             trail: [{ label: 'Resumen' }] },
  { match: p => p === '/dashboard/pixel',                       trail: [{ label: 'Dashboard', href: '/dashboard' }, { label: 'Mi Pixel' }] },
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
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)
  const { toggle } = useSidebar()
  const pathname = usePathname()
  const trail = resolveBreadcrumb(pathname)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

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
            boxShadow: unread > 0
              ? '0 0 16px rgba(234,27,126,0.35), 0 0 28px rgba(234,27,126,0.15)'
              : (open ? '0 0 16px rgba(234,27,126,0.20)' : 'none'),
          }}
          onMouseEnter={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.16)' } }}
          onMouseLeave={e => { if (!open) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.09)' } }}
          aria-label="Notificaciones"
        >
          <Bell size={16} style={{
            color: unread > 0 || open ? '#f9a8d4' : 'var(--muted)',
            filter: unread > 0 ? 'drop-shadow(0 0 4px rgba(234,27,126,0.60))' : 'none',
          }} strokeWidth={1.75} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,#e91e8c,#c5006a)',
                    color: '#fff',
                    boxShadow: '0 0 10px rgba(233,30,140,0.80), 0 0 16px rgba(233,30,140,0.40)',
                  }}>
              {unread}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
               style={{
                 background: 'linear-gradient(160deg, rgba(14,8,22,0.98), rgba(8,8,16,0.99))',
                 border: '1px solid rgba(255,255,255,0.08)',
                 boxShadow: '0 24px 72px rgba(0,0,0,0.80), 0 0 40px rgba(234,27,126,0.08)',
                 backdropFilter: 'blur(24px)',
               }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700 }}>Notificaciones</h3>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
                  style={{ color: 'var(--accent3)' }}>
                  <Check size={12} /> Marcar como leídas
                </button>
              )}
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {notifications.map(n => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3.5"
                     style={{ background: n.read ? 'transparent' : 'rgba(233,30,140,0.05)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                       style={{ background: n.read ? 'transparent' : '#e91e8c' }} />
                  <div className="flex-1">
                    <p className="text-[13px] leading-snug" style={{ color: n.read ? 'var(--muted)' : 'var(--text)' }}>{n.text}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
