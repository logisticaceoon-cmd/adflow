'use client'
// src/components/dashboard/ConfirmModal.tsx — Reusable premium confirmation modal
import { useEffect } from 'react'
import { X } from 'lucide-react'

type ConfirmColor = 'fucsia' | 'green' | 'red' | 'amber' | 'teal'

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: ConfirmColor
  loading?: boolean
  icon?: string
}

const COLORS: Record<ConfirmColor, { bg: string; border: string; glow: string; text: string }> = {
  fucsia: { bg: 'linear-gradient(135deg, #ea1b7e, #c5006a)',  border: 'rgba(234,27,126,0.40)', glow: 'rgba(234,27,126,0.45)', text: '#fff' },
  green:  { bg: 'linear-gradient(135deg, #06d6a0, #059669)',  border: 'rgba(6,214,160,0.40)',  glow: 'rgba(6,214,160,0.45)',  text: '#fff' },
  red:    { bg: 'linear-gradient(135deg, #ef4444, #dc2626)',  border: 'rgba(239,68,68,0.40)',  glow: 'rgba(239,68,68,0.45)',  text: '#fff' },
  amber:  { bg: 'linear-gradient(135deg, #f59e0b, #d97706)',  border: 'rgba(245,158,11,0.40)', glow: 'rgba(245,158,11,0.45)', text: '#fff' },
  teal:   { bg: 'linear-gradient(135deg, #62c4b0, #3a9a8a)',  border: 'rgba(98,196,176,0.40)', glow: 'rgba(98,196,176,0.45)', text: '#fff' },
}

export default function ConfirmModal({
  open, onClose, onConfirm,
  title, description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = 'fucsia',
  loading = false,
  icon,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, loading, onClose])

  if (!open) return null
  const color = COLORS[confirmColor]

  return (
    <div
      onClick={loading ? undefined : onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.70)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease',
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 440,
          background: 'linear-gradient(160deg, rgba(14,4,9,0.98) 0%, rgba(8,2,5,0.99) 100%)',
          border: `1px solid ${color.border}`,
          borderRadius: 20,
          padding: '28px 28px 24px',
          boxShadow: `0 24px 80px rgba(0,0,0,0.80), 0 0 80px ${color.glow}`,
          animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative',
        }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${color.glow}, transparent)`,
          borderRadius: 20,
        }} />

        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute', top: 16, right: 16,
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.3 : 1,
          }}>
          <X size={14} style={{ color: '#a0a8c0' }} />
        </button>

        {icon && (
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: `${color.glow}`,
            border: `1px solid ${color.border}`,
            boxShadow: `0 0 28px ${color.glow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 18,
          }}>{icon}</div>
        )}

        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 20, fontWeight: 800, color: '#fff',
          marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          {title}
        </h2>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, marginBottom: 22 }}>
          {description}
        </p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#a0a8c0', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 22px', borderRadius: 10,
              background: loading ? 'rgba(255,255,255,0.06)' : color.bg,
              border: `1px solid ${color.border}`,
              color: color.text, fontSize: 13, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : `0 4px 20px ${color.glow}, 0 0 32px ${color.glow}`,
              transition: 'all 0.2s',
            }}>
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  )
}
