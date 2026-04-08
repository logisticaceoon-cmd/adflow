// src/components/intelligence/FunnelHealthCard.tsx
// Visualizes funnel health ratios (pay, buy) against the minimum thresholds
// from strategy settings. Shows per-ratio progress bars + a summary verdict.
interface Props {
  addToCart: number
  initiateCheckout: number
  purchases: number
  /** Minimum pay ratio (initiateCheckout / addToCart). Default 0.30 */
  ratioPayMin?: number
  /** Minimum buy ratio (purchases / initiateCheckout). Default 0.30 */
  ratioCompraMin?: number
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return numerator / denominator
}

export default function FunnelHealthCard({
  addToCart, initiateCheckout, purchases,
  ratioPayMin = 0.30, ratioCompraMin = 0.30,
}: Props) {
  const ratioPago   = pct(initiateCheckout, addToCart)
  const ratioCompra = pct(purchases, initiateCheckout)

  const payOk = ratioPago >= ratioPayMin
  const buyOk = ratioCompra >= ratioCompraMin
  const allOk = payOk && buyOk

  // Verdict
  let verdict: { icon: string; title: string; description: string; color: string } = {
    icon: '✅', title: 'Embudo saludable', description: 'Los ratios de pago y compra están por encima del mínimo.', color: 'var(--ds-color-success)',
  }
  if (!allOk) {
    if (!payOk && !buyOk) {
      verdict = {
        icon: '🔴', title: 'Embudo con doble fricción',
        description: 'Los visitantes agregan al carrito, pero pocos inician pago y pocos completan la compra. Revisá checkout Y proceso de pago.',
        color: 'var(--ds-color-danger)',
      }
    } else if (!payOk) {
      verdict = {
        icon: '🟠', title: 'Fricción en el checkout',
        description: `Solo el ${(ratioPago * 100).toFixed(0)}% de los carritos llega al pago (mínimo ${(ratioPayMin * 100).toFixed(0)}%). Revisá costos de envío, métodos de pago y fluidez del checkout.`,
        color: 'var(--ds-color-warning)',
      }
    } else {
      verdict = {
        icon: '🟠', title: 'Se pierden compras en el cierre',
        description: `Solo el ${(ratioCompra * 100).toFixed(0)}% de los pagos iniciados se completa (mínimo ${(ratioCompraMin * 100).toFixed(0)}%). Verificá el procesador de pagos y el último paso del checkout.`,
        color: 'var(--ds-color-warning)',
      }
    }
  }

  return (
    <div style={{
      padding: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
        }}>
          Salud del embudo
        </p>
        <p style={{
          fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 600,
          color: allOk ? 'var(--ds-color-success)' : 'var(--ds-color-warning)',
        }}>
          {allOk ? 'OK' : 'Revisar'}
        </p>
      </div>

      {/* Ratio 1: Pago (Checkout / Cart) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-primary)' }}>
            Ratio Pago
          </span>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
            color: payOk ? 'var(--ds-color-success)' : 'var(--ds-color-danger)',
          }}>
            {(ratioPago * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{
          height: 8, borderRadius: 99,
          background: 'rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 4,
        }}>
          <div
            className="progress-bar-fill"
            style={{
              height: '100%',
              width: `${Math.min(ratioPago * 100, 100)}%`,
              background: payOk ? 'var(--ds-color-success)' : 'var(--ds-color-danger)',
              borderRadius: 99,
            }}
          />
          {/* Threshold marker */}
          <div style={{
            position: 'absolute', top: -2, bottom: -2,
            left: `${ratioPayMin * 100}%`,
            width: 2,
            background: 'var(--ds-text-muted)',
          }} />
        </div>
        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>
          {initiateCheckout.toLocaleString('es')} pagos iniciados / {addToCart.toLocaleString('es')} carritos · mínimo {(ratioPayMin * 100).toFixed(0)}%
        </p>
      </div>

      {/* Ratio 2: Compra (Purchase / Checkout) */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ds-text-primary)' }}>
            Ratio Compra
          </span>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700,
            color: buyOk ? 'var(--ds-color-success)' : 'var(--ds-color-danger)',
          }}>
            {(ratioCompra * 100).toFixed(0)}%
          </span>
        </div>
        <div style={{
          height: 8, borderRadius: 99,
          background: 'rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          position: 'relative',
          marginBottom: 4,
        }}>
          <div
            className="progress-bar-fill"
            style={{
              height: '100%',
              width: `${Math.min(ratioCompra * 100, 100)}%`,
              background: buyOk ? 'var(--ds-color-success)' : 'var(--ds-color-danger)',
              borderRadius: 99,
            }}
          />
          <div style={{
            position: 'absolute', top: -2, bottom: -2,
            left: `${ratioCompraMin * 100}%`,
            width: 2,
            background: 'var(--ds-text-muted)',
          }} />
        </div>
        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>
          {purchases.toLocaleString('es')} compras / {initiateCheckout.toLocaleString('es')} pagos iniciados · mínimo {(ratioCompraMin * 100).toFixed(0)}%
        </p>
      </div>

      {/* Verdict */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--ds-card-radius-sm)',
        background: allOk ? 'var(--ds-color-success-soft)' : 'var(--ds-color-warning-soft)',
        border: `1px solid ${allOk ? 'var(--ds-color-success-border)' : 'var(--ds-color-warning-border)'}`,
      }}>
        <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{verdict.icon}</span>
        <div>
          <p style={{
            fontSize: 12, fontWeight: 600, color: verdict.color, marginBottom: 2,
          }}>
            {verdict.title}
          </p>
          <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>
            {verdict.description}
          </p>
        </div>
      </div>
    </div>
  )
}
