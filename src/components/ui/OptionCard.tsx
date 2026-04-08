// src/components/ui/OptionCard.tsx
// Selectable card for wizards, diagnosis flows, strategy pickers.
// Visual treatment is centralized in styles.css under .ds-option-card —
// this component only manages state classes.
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

  // State classes drive all the visual treatment via global CSS rules.
  const stateClass = locked ? 'is-locked' : selected ? 'is-selected' : ''

  return (
    <div
      className={`ds-option-card ${stateClass} ${className || ''}`.trim()}
      style={{
        position: 'relative',
        padding: 'var(--ds-space-lg)',
        borderRadius: 'var(--ds-card-radius)',
        background: 'var(--ds-card-bg)',
        border: '1px solid var(--ds-card-border)',
        backdropFilter: 'blur(var(--ds-card-blur))',
        WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
        cursor: locked ? 'not-allowed' : onClick ? 'pointer' : 'default',
        boxShadow: 'var(--ds-shadow-sm)',
        ...style,
      }}
      onClick={handleClick}
      title={locked ? lockMessage : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !locked ? 0 : undefined}
    >
      {/* Selection indicator — green check on dark background */}
      {selected && !locked && (
        <span
          style={{
            position: 'absolute', top: 12, right: 12,
            width: 26, height: 26,
            borderRadius: '50%',
            background: 'var(--ds-color-success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow:
              '0 0 0 2px rgba(52, 211, 153, 0.30), ' +
              '0 6px 16px rgba(16, 185, 129, 0.40), ' +
              '0 0 24px rgba(16, 185, 129, 0.30)',
            zIndex: 2,
          }}
        >
          <Check size={14} color="#06241a" strokeWidth={3} />
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
            zIndex: 2,
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
          position: 'relative', zIndex: 2,
        }}>
          {icon}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
