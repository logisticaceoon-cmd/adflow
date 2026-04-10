// src/components/ui/Card.tsx
// Base Card primitive for the unified design system.
// Variants drive a state class — visual treatment lives in styles.css under
// `.ds-glow-{green|blue|purple|red}` and `.ds-card.is-{selected|completed|disabled}`.
// This keeps every interactive surface in the app on the same premium recipe.
import type { CSSProperties, ReactNode } from 'react'

export type CardVariant = 'default' | 'selected' | 'info' | 'danger' | 'locked' | 'completed' | 'secondary'
export type CardPadding = 'sm' | 'md' | 'lg'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  hover?: boolean
  padding?: CardPadding
  className?: string
  onClick?: () => void
  style?: CSSProperties
  as?: 'div' | 'button' | 'a'
  href?: string
}

const PADDING_MAP: Record<CardPadding, string> = {
  sm: 'var(--ds-space-md)',
  md: 'var(--ds-space-lg)',
  lg: 'var(--ds-space-xl)',
}

// Variants → state classes that the global CSS picks up
const VARIANT_CLASS: Record<CardVariant, string> = {
  default:   '',
  selected:  'ds-glow-green',
  completed: 'is-completed',
  info:      'ds-glow-blue',
  secondary: 'ds-glow-purple',
  danger:    'ds-glow-red',
  locked:    'is-disabled',
}

export default function Card({
  children, variant = 'default', hover = false, padding = 'md',
  className, onClick, style, as = 'div', href,
}: CardProps) {
  const baseStyle: CSSProperties = {
    border: '1px solid var(--ds-card-border)',
    borderRadius: 'var(--ds-card-radius)',
    padding: PADDING_MAP[padding],
    transition: 'all var(--ds-transition-normal)',
    cursor: onClick || href ? 'pointer' : undefined,
    boxShadow: 'var(--ds-shadow-md)',
    position: 'relative',
    ...style,
  }

  const cls = [
    'ds-card',
    hover ? 'ds-card--hover' : '',
    VARIANT_CLASS[variant],
    className || '',
  ].filter(Boolean).join(' ')

  if (as === 'a' && href) {
    return (
      <a href={href} className={cls} style={baseStyle} onClick={onClick}>
        {children}
      </a>
    )
  }
  if (as === 'button') {
    return (
      <button type="button" className={cls} style={{ ...baseStyle, textAlign: 'left' }} onClick={onClick}>
        {children}
      </button>
    )
  }
  return (
    <div className={cls} style={baseStyle} onClick={onClick}>
      {children}
    </div>
  )
}
