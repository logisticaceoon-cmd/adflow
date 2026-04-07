// src/components/ui/Badge.tsx
import type { CSSProperties, ReactNode } from 'react'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'locked'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  className?: string
  style?: CSSProperties
}

const VARIANT_MAP: Record<BadgeVariant, { bg: string; border: string; color: string; dot: string }> = {
  default: {
    bg: 'rgba(255,255,255,0.05)',
    border: 'var(--ds-card-border)',
    color: 'var(--ds-text-secondary)',
    dot: 'rgba(255,255,255,0.45)',
  },
  success: {
    bg: 'var(--ds-color-success-soft)',
    border: 'var(--ds-color-success-border)',
    color: 'var(--ds-color-success)',
    dot: 'var(--ds-color-success)',
  },
  info: {
    bg: 'var(--ds-color-primary-soft)',
    border: 'var(--ds-color-primary-border)',
    color: 'var(--ds-color-primary)',
    dot: 'var(--ds-color-primary)',
  },
  warning: {
    bg: 'var(--ds-color-warning-soft)',
    border: 'var(--ds-color-warning-border)',
    color: 'var(--ds-color-warning)',
    dot: 'var(--ds-color-warning)',
  },
  danger: {
    bg: 'var(--ds-color-danger-soft)',
    border: 'var(--ds-color-danger-border)',
    color: 'var(--ds-color-danger)',
    dot: 'var(--ds-color-danger)',
  },
  locked: {
    bg: 'var(--ds-color-locked)',
    border: 'var(--ds-color-locked-border)',
    color: 'var(--ds-text-muted)',
    dot: 'var(--ds-text-muted)',
  },
}

const SIZE_MAP: Record<BadgeSize, { padding: string; fontSize: number; dot: number }> = {
  sm: { padding: '2px 8px',  fontSize: 10, dot: 5 },
  md: { padding: '4px 12px', fontSize: 12, dot: 6 },
}

export default function Badge({
  children, variant = 'default', size = 'md', dot = false, className, style,
}: BadgeProps) {
  const v = VARIANT_MAP[variant]
  const s = SIZE_MAP[size]

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 700,
        borderRadius: 99,
        background: v.bg,
        border: `1px solid ${v.border}`,
        color: v.color,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span style={{
          width: s.dot, height: s.dot, borderRadius: '50%',
          background: v.dot,
          flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}
