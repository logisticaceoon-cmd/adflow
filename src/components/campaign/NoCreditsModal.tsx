'use client'
// src/components/campaign/NoCreditsModal.tsx — Modal shown when user has no AI credits left

interface Props {
  open: boolean
  onClose: () => void
  onUpgrade: () => void
}

export default function NoCreditsModal({ open, onClose, onUpgrade }: Props) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{
        borderColor: 'rgba(239,68,68,0.28)',
        padding: 36, width: '100%', maxWidth: 380,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 38, marginBottom: 14 }}>⚡</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#ffffff' }}>
          Sin créditos disponibles
        </h3>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 28, lineHeight: 1.65, maxWidth: 300, margin: '0 auto 28px' }}>
          Usaste todos tus créditos de IA este mes. Mejorá tu plan para seguir generando estrategias.
        </p>
        <button
          onClick={onUpgrade}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 12, cursor: 'pointer',
            background: 'var(--ds-color-primary)',
            color: '#ffffff', fontSize: 14, fontWeight: 700, border: 'none',
            marginBottom: 12, display: 'block',
          }}
        >
          Mejorar plan →
        </button>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--ds-text-secondary)', fontSize: 13, cursor: 'pointer', padding: 8 }}
        >
          Cerrar
        </button>
      </div>
    </div>
  )
}
