'use client'
// src/components/dashboard/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

const navItems = [
  { href: '/dashboard',            icon: '📊', label: 'Resumen general' },
  { href: '/dashboard/campaigns',  icon: '📣', label: 'Mis campañas' },
  { href: '/dashboard/create',     icon: '✨', label: 'Crear campaña IA' },
  { href: '/dashboard/reports',    icon: '📩', label: 'Reportes diarios' },
]

const bottomItems = [
  { href: '/dashboard/settings',   icon: '⚙️', label: 'Configuración' },
]

interface Props {
  user: User
  profile: Profile | null
}

export default function Sidebar({ user, profile }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r"
           style={{ background: 'var(--surface)', borderColor: 'var(--border)', zIndex: 50 }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
             style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}>⚡</div>
        <span className="font-display text-lg font-bold">AdFlow</span>
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-bold px-2 pb-1.5 tracking-widest uppercase"
           style={{ color: 'var(--muted)' }}>Principal</p>
        {navItems.map(item => {
          const active = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
              style={{
                color: active ? 'var(--accent)' : 'var(--muted)',
                background: active ? 'rgba(79,110,247,0.12)' : 'transparent',
                fontWeight: active ? 500 : 400,
              }}>
              <span className="w-4 text-center text-[15px]">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4">
          <p className="text-[10px] font-bold px-2 pb-1.5 tracking-widest uppercase"
             style={{ color: 'var(--muted)' }}>Cuenta</p>
          {bottomItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={{
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  background: active ? 'rgba(79,110,247,0.12)' : 'transparent',
                }}>
                <span className="w-4 text-center text-[15px]">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <button onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm w-full text-left transition-all duration-150 hover:bg-white/5"
            style={{ color: 'var(--muted)' }}>
            <span className="w-4 text-center text-[15px]">🚪</span>
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t flex items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
             style={{ background: 'linear-gradient(135deg, #4f6ef7, #7c3aed)' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{profile?.full_name || 'Usuario'}</p>
          <p className="text-xs" style={{ color: 'var(--accent3)' }}>
            Plan {profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'agency' ? 'Agencia' : 'Gratuito'}
          </p>
        </div>
      </div>
    </aside>
  )
}
