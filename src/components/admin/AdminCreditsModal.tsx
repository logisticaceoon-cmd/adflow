'use client'
// src/components/admin/AdminCreditsModal.tsx
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import { PLAN_CREDITS, PLAN_LABEL, PLAN_COLOR } from '@/lib/plans'

const QUICK_ADDS = [10, 50, 100, 500] as const
const PLANS = ['free', 'starter', 'pro', 'agency'] as const

interface Props {
  userId: string
  userFullName: string
  userEmail: string
  currentPlan: string
  creditsTotal: number
  creditsUsed: number
  onSaved?: (updated: { plan: string; credits_total: number; credits_used: number }) => void
}

export default function AdminCreditsModal({
  userId, userFullName, userEmail, currentPlan, creditsTotal, creditsUsed, onSaved,
}: Props) {
  const router = useRouter()
  const [open, setOpen]             = useState(false)
  const [plan, setPlan]             = useState(currentPlan)
  const [total, setTotal]           = useState(creditsTotal)
  const [customAdd, setCustomAdd]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [toast, setToast]           = useState(false)
  const [mounted, setMounted]       = useState(false)

  // Portal requires DOM to be mounted
  useEffect(() => { setMounted(true) }, [])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open])

  const newAvailable = Math.max(0, total - creditsUsed)
  const usedPct      = total > 0 ? Math.min(100, Math.round((creditsUsed / total) * 100)) : 0
  const barColor     = newAvailable === 0 ? '#ef4444' : usedPct >= 80 ? '#f59e0b' : '#2dd4a8'
  const planColor    = PLAN_COLOR[plan] ?? '#62c4b0'

  function handleOpen() {
    setPlan(currentPlan)
    setTotal(creditsTotal)
    setCustomAdd('')
    setError('')
    setToast(false)
    setOpen(true)
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
  }

  function handlePlanChange(newPlan: string) {
    setPlan(newPlan)
    setTotal(PLAN_CREDITS[newPlan] ?? 10)
  }

  function handleQuickAdd(amount: number) {
    setTotal(prev => prev + amount)
  }

  function handleCustomAdd() {
    const n = parseInt(customAdd, 10)
    if (!isNaN(n) && n > 0) {
      setTotal(prev => prev + n)
      setCustomAdd('')
    }
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/update-user-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, credits_total: total, plan }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      if (onSaved) {
        onSaved({
          plan: data.profile.plan,
          credits_total: data.profile.credits_total,
          credits_used: data.profile.credits_used,
        })
      } else {
        router.refresh()
      }

      setOpen(false)
      setToast(true)
      setTimeout(() => setToast(false), 3500)
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  // ── Modal JSX (rendered via portal) ──────────────────────────────────────────
  const modal = (
    // Full-viewport overlay — rendered at document.body, escapes all containing blocks
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeInOverlay 0.18s ease both',
      }}
    >
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>

      {/* Modal panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 22,
          padding: '28px 28px 24px',
          background: 'linear-gradient(160deg, #0e0a1a 0%, #080810 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow:
            '0 0 0 1px rgba(255,255,255,0.05) inset,' +
            '0 32px 80px rgba(0,0,0,0.80),' +
            '0 0 60px rgba(234,27,126,0.10),' +
            '0 0 30px rgba(98,196,176,0.06)',
          animation: 'slideUpModal 0.22s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(234,27,126,0.60), rgba(98,196,176,0.40), transparent)',
          borderRadius: '22px 22px 0 0',
          pointerEvents: 'none',
        }} />
        {/* Top gloss */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)',
          borderRadius: '22px 22px 0 0',
          pointerEvents: 'none',
        }} />

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#f0f0ff', marginBottom: 1 }}>
              Editar créditos
            </h3>
            <p style={{ fontSize: 11, color: '#5a5a7a', letterSpacing: '0.03em' }}>
              Ajustá el plan y créditos del usuario
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 9,
              cursor: 'pointer',
              color: '#8892b0',
              padding: '5px 7px',
              lineHeight: 1,
              transition: 'all 0.15s',
              flexShrink: 0,
              marginTop: 2,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLElement).style.color = '#b0b8d0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#8892b0' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── User info (read-only) ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: '11px 14px', marginBottom: 18,
          position: 'relative', zIndex: 1,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#d0d0f0', marginBottom: 2 }}>
            {userFullName || '—'}
          </p>
          <p style={{ fontSize: 11, color: '#5a5a8a' }}>{userEmail}</p>
        </div>

        {/* ── Current credit summary ── */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 20,
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#4a4a70', marginBottom: 4 }}>Usados</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#c0c0e0', letterSpacing: '-0.02em' }}>{creditsUsed}</p>
            </div>
            <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center' }}>
              <p style={{ fontSize: 10, color: '#3a3a5a' }}>de {creditsTotal}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#4a4a70', marginBottom: 4 }}>Disponibles</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: barColor, letterSpacing: '-0.02em', textShadow: `0 0 14px ${barColor}80` }}>{newAvailable}</p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
            <div style={{
              width: `${usedPct}%`, height: '100%',
              background: barColor,
              borderRadius: 99,
              boxShadow: `0 0 8px ${barColor}80`,
              transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>

        {/* ── Plan selector ── */}
        <label style={{
          display: 'block', fontSize: 9, fontWeight: 700,
          color: '#7070a0', marginBottom: 6,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          position: 'relative', zIndex: 1,
        }}>
          Plan actual
        </label>
        <select
          value={plan}
          onChange={e => handlePlanChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 11, marginBottom: 18,
            background: `${planColor}15`,
            color: planColor,
            border: `1px solid ${planColor}42`,
            fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer',
            transition: 'all 0.15s',
            position: 'relative', zIndex: 1,
            boxShadow: `0 0 20px ${planColor}15`,
          }}
        >
          {PLANS.map(p => (
            <option key={p} value={p} style={{ background: '#0a0610', color: '#ffffff' }}>
              {PLAN_LABEL[p]} — {PLAN_CREDITS[p]} créditos/mes
            </option>
          ))}
        </select>

        {/* ── Credits total input ── */}
        <label style={{
          display: 'block', fontSize: 9, fontWeight: 700,
          color: '#7070a0', marginBottom: 6,
          letterSpacing: '0.10em', textTransform: 'uppercase',
          position: 'relative', zIndex: 1,
        }}>
          Establecer total en
        </label>
        <input
          type="number"
          min={0}
          value={total}
          onChange={e => setTotal(Math.max(0, parseInt(e.target.value, 10) || 0))}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 11, marginBottom: 12,
            background: 'rgba(255,255,255,0.05)',
            color: '#f0f0ff',
            border: '1px solid rgba(255,255,255,0.12)',
            fontSize: 18, fontWeight: 800,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            position: 'relative', zIndex: 1,
            letterSpacing: '-0.02em',
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = 'rgba(234,27,126,0.60)'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234,27,126,0.12), 0 0 20px rgba(234,27,126,0.15)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />

        {/* ── Quick add buttons ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, position: 'relative', zIndex: 1 }}>
          {QUICK_ADDS.map(n => (
            <button
              key={n}
              onClick={() => handleQuickAdd(n)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(98,196,176,0.08)',
                color: '#62c4b0',
                border: '1px solid rgba(98,196,176,0.20)',
                fontSize: 12, fontWeight: 700,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.16)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(98,196,176,0.40)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.08)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(98,196,176,0.20)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              +{n}
            </button>
          ))}
          {/* Custom add */}
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="number"
              min={1}
              placeholder="N"
              value={customAdd}
              onChange={e => setCustomAdd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              style={{
                width: 50, padding: '7px 8px', borderRadius: 9,
                background: 'rgba(255,255,255,0.05)',
                color: '#f0f0ff',
                border: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12, outline: 'none',
              }}
            />
            <button
              onClick={handleCustomAdd}
              style={{
                padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
                background: 'rgba(98,196,176,0.10)',
                color: '#62c4b0',
                border: '1px solid rgba(98,196,176,0.22)',
                display: 'flex', alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.20)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.10)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <Plus size={13} />
            </button>
          </div>
        </div>

        {/* ── Available preview ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderRadius: 11, marginBottom: 20,
          background: 'rgba(98,196,176,0.05)',
          border: '1px solid rgba(98,196,176,0.14)',
          position: 'relative', zIndex: 1,
        }}>
          <span style={{ fontSize: 12, color: '#6a6a9a' }}>Disponibles al guardar</span>
          <span style={{
            fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em',
            color: newAvailable > 0 ? '#62c4b0' : '#ef4444',
            textShadow: newAvailable > 0 ? '0 0 12px rgba(98,196,176,0.60)' : '0 0 12px rgba(239,68,68,0.60)',
          }}>
            {newAvailable}
          </span>
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{
            fontSize: 12, color: '#f87171', marginBottom: 14,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.22)',
            padding: '9px 12px', borderRadius: 10,
            position: 'relative', zIndex: 1,
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              flex: 1, padding: '11px 0', borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.05)',
              color: '#8892b0',
              border: '1px solid rgba(255,255,255,0.10)',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'
                ;(e.currentTarget as HTMLElement).style.color = '#b0b8d0'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
              ;(e.currentTarget as HTMLElement).style.color = '#8892b0'
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 2, padding: '11px 0', borderRadius: 12,
              cursor: loading ? 'wait' : 'pointer',
              background: loading
                ? 'rgba(234,27,126,0.55)'
                : 'linear-gradient(135deg, #ea1b7e, #c5006a)',
              color: '#ffffff',
              fontSize: 13, fontWeight: 700,
              border: 'none',
              boxShadow: loading ? 'none' : '0 0 28px rgba(234,27,126,0.45), 0 0 56px rgba(234,27,126,0.16)',
              opacity: loading ? 0.8 : 1,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(234,27,126,0.65), 0 0 80px rgba(234,27,126,0.22)'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 28px rgba(234,27,126,0.45), 0 0 56px rgba(234,27,126,0.16)'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.30)',
                  borderTopColor: '#fff',
                  animation: 'spin 0.65s linear infinite',
                }} />
                Guardando…
              </>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Toast — también via portal para evitar el mismo problema */}
      {mounted && toast && createPortal(
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 10000,
          background: 'linear-gradient(135deg, #2dd4a8, #059669)',
          color: '#ffffff', borderRadius: 12, padding: '12px 20px',
          fontSize: 14, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(45, 212, 168,0.36)',
          animation: 'fadeInUp 0.25s ease both',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ✓ Créditos actualizados correctamente
        </div>,
        document.body,
      )}

      {/* Trigger button */}
      <button
        onClick={handleOpen}
        style={{
          fontSize: 11, padding: '4px 11px', borderRadius: 8, cursor: 'pointer',
          background: 'rgba(98,196,176,0.10)',
          color: '#62c4b0',
          border: '1px solid rgba(98,196,176,0.28)',
          fontWeight: 600, whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.18)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(98,196,176,0.50)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(98,196,176,0.10)'
          ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(98,196,176,0.28)'
        }}
      >
        Editar créditos
      </button>

      {/* Modal — rendered via createPortal directly at document.body */}
      {mounted && open && createPortal(modal, document.body)}
    </>
  )
}
