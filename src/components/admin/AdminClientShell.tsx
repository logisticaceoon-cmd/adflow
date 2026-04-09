'use client'
// src/components/admin/AdminClientShell.tsx
import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import { ChevronRight, Zap } from 'lucide-react'

export default function AdminClientShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Expand tab */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 20, height: 56, borderRadius: '0 8px 8px 0',
            background: 'rgba(233,30,140,0.12)',
            border: '1px solid rgba(233,30,140,0.28)', borderLeft: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 60, color: '#22d3ee',
          }}
        >
          <ChevronRight size={12} />
        </button>
      )}

      {/* Main area */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Sticky top bar */}
        <div
          className="flex items-center justify-between px-8"
          style={{
            height: 52,
            background: 'rgba(8,8,20,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            position: 'sticky', top: 0, zIndex: 40,
            flexShrink: 0,
            boxShadow: '0 1px 0 rgba(233,30,140,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: 'linear-gradient(135deg, #22d3ee, #c5006a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 10px rgba(233,30,140,0.4)',
            }}>
              <Zap size={10} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              background: 'linear-gradient(90deg, #22d3ee, #62c4b0)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Admin Panel
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#22d3ee',
              boxShadow: '0 0 8px rgba(233,30,140,0.8)',
              display: 'inline-block',
            }} className="glow-dot" />
            <span style={{ fontSize: 11, color: '#8892b0', letterSpacing: '0.04em' }}>adflow.ai</span>
          </div>
        </div>

        <main style={{ flex: 1, padding: 32 }}>
          {children}
        </main>
      </div>
    </div>
  )
}
