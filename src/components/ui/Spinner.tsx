// src/components/ui/Spinner.tsx
// Smooth rotating spinner with optional label.
import type { CSSProperties } from 'react'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  label?: string
  inline?: boolean
}

const SIZES: Record<'sm' | 'md' | 'lg', number> = { sm: 16, md: 24, lg: 40 }

export default function Spinner({
  size = 'md', color = '#e91e8c', label, inline = false,
}: SpinnerProps) {
  const px = SIZES[size]
  const stroke = size === 'lg' ? 3 : 2.5

  const wrapper: CSSProperties = inline
    ? { display: 'inline-flex', alignItems: 'center', gap: 8 }
    : { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }

  return (
    <div style={wrapper}>
      <svg
        width={px} height={px} viewBox="0 0 24 24"
        style={{ animation: 'spinnerRotate 0.9s linear infinite', flexShrink: 0 }}
        aria-label="Cargando"
      >
        <circle
          cx="12" cy="12" r="9"
          fill="none"
          stroke={`${color}25`}
          strokeWidth={stroke}
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      {label && (
        <span style={{
          fontSize: size === 'sm' ? 11 : 12,
          color: 'var(--muted)',
          fontWeight: 600,
        }}>
          {label}
        </span>
      )}
      <style>{`
        @keyframes spinnerRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
