'use client'
// src/components/admin/AdminSidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Megaphone, Sparkles,
  CalendarDays, LogOut, Shield, Zap, Eye, Settings,
  ChevronLeft,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard',     exact: true },
  { href: '/admin/users',     icon: Users,           label: 'Usuarios'                    },
  { href: '/admin/campaigns', icon: Megaphone,       label: 'Campañas'                    },
  { href: '/admin/ai-usage',  icon: Sparkles,        label: 'Uso de IA'                   },
  { href: '/admin/events',    icon: CalendarDays,    label: 'Eventos'                     },
  { href: '/admin/settings',  icon: Settings,        label: 'Configuración'               },
]

export default function AdminSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside
      style={{
        width: collapsed ? 0 : 224,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        position: 'sticky',
        top: 0,
        height: '100vh',
        alignSelf: 'flex-start',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(255,255,255,0.09)',
        zIndex: 50,
      }}
    >
      {/* Inner container — always 224px wide so content doesn't squish during transition */}
      <div style={{ width: 224, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Logo + collapse button */}
        <div className="flex items-center justify-between px-5"
          style={{ height: 64, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #c5006a)' }}>
              <Shield size={14} color="#fff" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display text-[15px] font-bold tracking-tight text-white">AdFlow</span>
              <span className="block text-[9px] font-bold tracking-widest uppercase"
                style={{ color: '#62c4b0', marginTop: -2 }}>Admin</span>
            </div>
          </div>
          {/* Collapse button */}
          <button onClick={onToggle}
            className="flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/10"
            style={{ width: 28, height: 28, color: '#62c4b0', flexShrink: 0 }}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold px-2 pb-2 tracking-widest uppercase"
            style={{ color: '#4a6060', whiteSpace: 'nowrap' }}>Panel de control</p>

          {navItems.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link key={href} href={href}
                className={`nav-item ${active ? 'nav-item-active' : 'nav-item-inactive'}`}
                style={active ? {
                  background: 'rgba(233,30,140,0.20)',
                  color: '#ffffff',
                  boxShadow: 'inset 3px 0 0 #2dd4bf',
                } : {}}>
                <Icon
                  size={16}
                  style={{ color: active ? '#ffffff' : '#2dd4bf', opacity: active ? 1 : 0.7 }}
                  strokeWidth={active ? 2 : 1.75}
                />
                <span className="text-[13px] font-medium whitespace-nowrap"
                  style={{ color: active ? '#ffffff' : '#c8d8d8' }}>
                  {label}
                </span>
              </Link>
            )
          })}

          {/* Bottom links */}
          <div className="mt-auto pt-4 flex flex-col gap-0.5">
            <div className="h-px mb-2" style={{ background: 'rgba(255,255,255,0.07)' }} />
            <Link href="/dashboard"
              className="nav-item nav-item-inactive"
              style={{ color: '#6b8a8a' }}>
              <Eye size={16} strokeWidth={1.75} style={{ color: '#2dd4bf', opacity: 0.5 }} />
              <span className="text-[13px] whitespace-nowrap">Ver panel usuario</span>
            </Link>
            <button onClick={handleLogout}
              className="nav-item nav-item-inactive text-left"
              style={{ color: '#6b8a8a' }}>
              <LogOut size={16} strokeWidth={1.75} style={{ color: '#2dd4bf', opacity: 0.5 }} />
              <span className="text-[13px] whitespace-nowrap">Cerrar sesión</span>
            </button>
          </div>
        </nav>

        {/* Admin badge */}
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: '#62c4b0', boxShadow: '0 0 8px rgba(98,196,176,0.8)' }} />
          <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: '#62c4b0' }}>
            Modo administrador
          </span>
          <Zap size={11} style={{ color: '#62c4b0', marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }} />
        </div>
      </div>
    </aside>
  )
}
