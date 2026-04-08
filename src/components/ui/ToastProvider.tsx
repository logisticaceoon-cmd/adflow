'use client'
// src/components/ui/ToastProvider.tsx
// Global toast system. Wrap the dashboard with <ToastProvider> and use the
// `useToast()` hook from anywhere in the tree:
//
//   const { toast } = useToast()
//   toast.success('Campaña activada')
//   toast.error('Error al sincronizar', { description: 'Token expirado' })
//   toast.achievement('Nuevo logro: 100 ventas')
//
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Trophy, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'achievement'

export interface ToastOptions {
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastItem extends ToastOptions {
  id: string
  type: ToastType
  title: string
}

interface ToastApi {
  success: (title: string, opts?: ToastOptions) => void
  error: (title: string, opts?: ToastOptions) => void
  warning: (title: string, opts?: ToastOptions) => void
  info: (title: string, opts?: ToastOptions) => void
  achievement: (title: string, opts?: ToastOptions) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<{ toast: ToastApi } | null>(null)

const TYPE_META: Record<ToastType, { color: string; bg: string; border: string; Icon: any; defaultDuration: number }> = {
  success:     { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.55)',  Icon: CheckCircle2,  defaultDuration: 5000 },
  error:       { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.55)',  Icon: AlertCircle,   defaultDuration: 6000 },
  warning:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.55)', Icon: AlertTriangle, defaultDuration: 5000 },
  info:        { color: 'var(--ds-color-primary)', bg: 'transparent', border: 'transparent', Icon: Info,          defaultDuration: 5000 },
  achievement: { color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.70)', Icon: Trophy,        defaultDuration: 8000 },
}

const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type: ToastType, title: string, opts?: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const item: ToastItem = { id, type, title, ...opts }
    setToasts(prev => [...prev, item].slice(-MAX_VISIBLE))
  }, [])

  const api: ToastApi = {
    success:     (t, o) => push('success', t, o),
    error:       (t, o) => push('error', t, o),
    warning:     (t, o) => push('warning', t, o),
    info:        (t, o) => push('info', t, o),
    achievement: (t, o) => push('achievement', t, o),
    dismiss,
  }

  return (
    <ToastContext.Provider value={{ toast: api }}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed', top: 20, right: 20,
          display: 'flex', flexDirection: 'column', gap: 10,
          zIndex: 9998, pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const meta = TYPE_META[toast.type]
  const duration = toast.duration ?? meta.defaultDuration
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showT = setTimeout(() => setVisible(true), 20)
    const hideT = setTimeout(() => setVisible(false), duration - 400)
    const removeT = setTimeout(onDismiss, duration)
    return () => { clearTimeout(showT); clearTimeout(hideT); clearTimeout(removeT) }
  }, [duration, onDismiss])

  const Icon = meta.Icon
  const isAchievement = toast.type === 'achievement'

  return (
    <div
      style={{
        pointerEvents: 'auto',
        width: 340,
        transform: visible ? 'translateX(0)' : 'translateX(380px)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s',
        background: 'linear-gradient(160deg, rgba(20,22,40,0.92), rgba(10,12,24,0.96))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 14,
        borderLeft: `3px solid ${meta.color}`,
        border: `1px solid ${meta.border}`,
        boxShadow: isAchievement
          ? `0 18px 50px rgba(0,0,0,0.55), 0 0 32px ${meta.color}55, 0 0 60px ${meta.color}25`
          : `0 18px 40px rgba(0,0,0,0.45), 0 0 16px ${meta.color}25`,
        padding: '14px 14px 14px 16px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}
    >
      <div style={{
        width: 32, height: 32, flexShrink: 0,
        borderRadius: '50%',
        background: meta.bg,
        border: `1px solid ${meta.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={meta.color} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 13, fontWeight: 700, color: '#fff',
          lineHeight: 1.3, marginBottom: toast.description ? 3 : 0,
        }}>
          {toast.title}
        </p>
        {toast.description && (
          <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); onDismiss() }}
            style={{
              marginTop: 8,
              fontSize: 11, fontWeight: 700, color: meta.color,
              background: 'none', border: 'none', padding: 0,
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--ds-text-secondary)', padding: 2, flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Soft fallback so components don't crash if used outside the provider.
    // (Console-only — no UI side-effects.)
    const noop = (t: string) => console.log('[toast]', t)
    return {
      toast: {
        success: noop, error: noop, warning: noop, info: noop, achievement: noop,
        dismiss: () => {},
      } as ToastApi,
    }
  }
  return ctx
}
