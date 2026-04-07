// src/components/ui/OptionCard.tsx
// Selectable card for wizards, diagnosis flows, strategy pickers.
import type { CSSProperties, ReactNode } from 'react'
import { Check, Lock } from 'lucide-react'

interface OptionCardProps {
  children: ReactNode
  selected?: boolean
  locked?: boolean
  lockMessage?: string
  onClick?: () => void
  icon?: string | ReactNode
  className?: string
  style?: CSSProperties
}

export default function OptionCard({
  children, selected = false, locked = false, lockMessage,
  onClick, icon, className, style,
}: OptionCardProps) {
  const handleClick = locked ? undefined : onClick

  const baseStyle: CSSProperties = {
    position: 'relative',
    padding: 'var(--ds-space-lg)',
    borderRadius: 'var(--ds-card-radius)',
    backdropFilter: 'blur(var(--ds-card-blur))',
    WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
    cursor: locked ? 'not-allowed' : 'pointer',
    transition: 'all var(--ds-transition-normal)',
    background: locked
      ? 'var(--ds-color-locked)'
      : selected
        ? 'var(--ds-color-success-soft)'
        : 'var(--ds-card-bg)',
    border: `1px solid ${
      locked
        ? 'var(--ds-color-locked-border)'
        : selected
          ? 'var(--ds-color-success-border)'
          : 'var(--ds-card-border)'
    }`,
    opacity: locked ? 0.55 : 1,
    boxShadow: selected ? '0 0 0 1px var(--ds-color-success-border)' : 'var(--ds-shadow-sm)',
    ...style,
  }

  return (
    <div
      className={`ds-option-card ${className || ''}`}
      style={baseStyle}
      onClick={handleClick}
      title={locked ? lockMessage : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !locked ? 0 : undefined}
    >
      {/* Selection indicator */}
      {selected && !locked && (
        <span
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 24, height: 24,
            borderRadius: '50%',
            background: 'var(--ds-color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(52, 211, 153, 0.30)',
          }}
        >
          <Check size={14} color="#0c0e16" strokeWidth={3} />
        </span>
      )}

      {/* Lock indicator */}
      {locked && (
        <span
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 24, height: 24,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Lock size={11} color="rgba(255,255,255,0.45)" />
        </span>
      )}

      {icon && (
        <div style={{
          fontSize: 28, marginBottom: 12,
          opacity: locked ? 0.4 : 1,
          lineHeight: 1,
        }}>
          {icon}
        </div>
      )}

      {children}
    </div>
  )
}
