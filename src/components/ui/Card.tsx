// src/components/ui/Card.tsx
// Base Card primitive for the unified design system.
// All new feature work should use this — legacy `.card` class still works.
import type { CSSProperties, ReactNode } from 'react'

export type CardVariant = 'default' | 'selected' | 'info' | 'danger' | 'locked'
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

function variantStyles(variant: CardVariant): CSSProperties {
  switch (variant) {
    case 'selected':
      return {
        background: 'var(--ds-color-success-soft)',
        border: '1px solid var(--ds-color-success-border)',
      }
    case 'info':
      return {
        background: 'var(--ds-color-warning-soft)',
        border: '1px solid var(--ds-color-warning-border)',
      }
    case 'danger':
      return {
        background: 'var(--ds-color-danger-soft)',
        border: '1px solid var(--ds-color-danger-border)',
      }
    case 'locked':
      return {
        background: 'var(--ds-color-locked)',
        border: '1px solid var(--ds-color-locked-border)',
        opacity: 0.6,
      }
    default:
      return {
        background: 'var(--ds-card-bg)',
        border: '1px solid var(--ds-card-border)',
      }
  }
}

export default function Card({
  children, variant = 'default', hover = false, padding = 'md',
  className, onClick, style, as = 'div', href,
}: CardProps) {
  const baseStyle: CSSProperties = {
    ...variantStyles(variant),
    borderRadius: 'var(--ds-card-radius)',
    backdropFilter: 'blur(var(--ds-card-blur))',
    WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
    padding: PADDING_MAP[padding],
    transition: hover ? 'all var(--ds-transition-normal)' : undefined,
    cursor: onClick || href ? 'pointer' : undefined,
    boxShadow: 'var(--ds-shadow-md)',
    ...style,
  }

  const cls = `ds-card ${hover ? 'ds-card--hover' : ''} ${className || ''}`.trim()

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
