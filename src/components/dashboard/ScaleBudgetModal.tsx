'use client'
// src/components/dashboard/ScaleBudgetModal.tsx — Premium scale budget modal
import { useEffect, useState } from 'react'
import { X, TrendingUp } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (pctChange: number) => Promise<void>
  campaignName: string
  currentBudget: number
  currency?: string
}

export default function ScaleBudgetModal({ open, onClose, onConfirm, campaignName, currentBudget, currency = '$' }: Props) {
  const [pct, setPct] = useState<number>(15)
  const [customMode, setCustomMode] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setPct(15); setCustomMode(false); setLoading(false) }
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    if (open) document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, loading, onClose])

  if (!open) return null

  const newBudget = currentBudget * (1 + pct / 100)
  const delta = newBudget - currentBudget
  const monthlyImpact = delta * 30

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm(pct)
    } finally {
      setLoading(false)
    }
  }

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
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          borderColor: 'var(--ds-color-primary-border)',
          padding: '28px 28px 24px',
          animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative',
        }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, transparent, var(--ds-card-border), transparent)',
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid var(--ds-color-primary-border)',
            boxShadow: '0 0 28px transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={26} style={{ color: 'var(--ds-color-primary)', filter: 'drop-shadow(0 0 6px transparent)' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Escalar presupuesto
            </h2>
            <p style={{ fontSize: 11, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
              Aumentá la inversión en Meta
            </p>
          </div>
        </div>

        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 18,
          background: 'var(--ds-card-bg)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
            Campaña
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10, wordBreak: 'break-word' }}>
            {campaignName}
          </p>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
            Presupuesto actual
          </p>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            {currency}{currentBudget.toFixed(0)}<span style={{ fontSize: 12, color: 'var(--ds-text-secondary)', fontWeight: 500 }}>/día</span>
          </p>
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
          Seleccioná cuánto escalar
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { label: '+10%', val: 10 },
            { label: '+15%', val: 15 },
            { label: '+20%', val: 20 },
            { label: 'Custom', val: -1 },
          ].map(opt => {
            const active = opt.val === -1 ? customMode : (!customMode && pct === opt.val)
            return (
              <button
                key={opt.label}
                onClick={() => {
                  if (opt.val === -1) { setCustomMode(true) }
                  else { setCustomMode(false); setPct(opt.val) }
                }}
                style={{
                  padding: '11px 0', borderRadius: 12,
                  background: active
                    ? 'linear-gradient(135deg, var(--ds-color-primary-soft), transparent)'
                    : 'rgba(255,255,255,0.03)',
                  border: `${active ? '1.5px' : '1px'} solid ${active ? 'transparent' : 'rgba(255,255,255,0.10)'}`,
                  color: active ? 'var(--ds-color-primary)' : '#a0a8c0',
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 18px transparent' : 'none',
                  transition: 'all 0.2s',
                }}>
                {opt.label}
              </button>
            )
          })}
        </div>

        {customMode && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 11, color: 'var(--ds-text-secondary)', display: 'block', marginBottom: 6 }}>
              Porcentaje personalizado
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={pct}
                onChange={e => setPct(Number(e.target.value))}
                min={-100}
                max={500}
                style={{
                  width: '100%', padding: '11px 34px 11px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--ds-color-primary-border)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  fontFamily: 'Syne, sans-serif',
                }}
              />
              <span style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 13, color: 'var(--ds-text-secondary)', fontWeight: 600, pointerEvents: 'none',
              }}>%</span>
            </div>
          </div>
        )}

        {/* Preview */}
        <div style={{
          padding: '16px 18px', borderRadius: 14, marginBottom: 18,
          background: 'linear-gradient(135deg, rgba(45, 212, 191,0.08), transparent)',
          border: '1px solid var(--ds-color-success-border)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-color-success)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            Nuevo presupuesto
          </p>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--ds-color-success)', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
            {currency}{newBudget.toFixed(0)}<span style={{ fontSize: 13, color: 'rgba(45, 212, 191,0.70)', fontWeight: 600 }}>/día</span>
            <span style={{ fontSize: 13, marginLeft: 10, color: pct >= 0 ? 'var(--ds-color-success)' : 'var(--ds-color-danger)' }}>
              ({pct >= 0 ? '+' : ''}{pct}%)
            </span>
          </p>
          <div className="flex items-center justify-between gap-4" style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)' }}>
            <span>
              {delta >= 0 ? 'Incremento' : 'Reducción'}:{' '}
              <b style={{ color: '#fff' }}>
                {delta >= 0 ? '+' : ''}{currency}{delta.toFixed(0)}/día
              </b>
            </span>
            <span>
              Impacto mensual:{' '}
              <b style={{ color: '#fff' }}>
                {monthlyImpact >= 0 ? '+' : ''}{currency}{monthlyImpact.toFixed(0)}
              </b>
            </span>
          </div>
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 18,
          background: 'var(--ds-color-warning-soft)',
          border: '1px solid var(--ds-color-warning-border)',
          fontSize: 11, color: 'var(--ds-color-warning)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚠️ El cambio se aplica inmediatamente en Meta Ads Manager
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '11px 18px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#a0a8c0', fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || pct === 0}
            style={{
              padding: '11px 22px', borderRadius: 10,
              background: loading ? 'rgba(255,255,255,0.06)' : 'var(--ds-color-primary)',
              border: '1px solid transparent',
              color: '#fff', fontSize: 13, fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px var(--ds-color-primary-border), 0 0 32px var(--ds-color-primary-soft)',
              transition: 'all 0.2s',
            }}>
            {loading ? 'Escalando...' : 'Confirmar escalado →'}
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
