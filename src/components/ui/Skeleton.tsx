// src/components/ui/Skeleton.tsx
// Reusable skeleton primitive built on the existing .skeleton CSS class
// (defined in src/app/styles.css with the skeletonShimmer keyframe).
import type { CSSProperties } from 'react'

export type SkeletonVariant = 'text' | 'circle' | 'card' | 'chart' | 'badge' | 'metric'

interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  className?: string
  count?: number
  style?: CSSProperties
}

const VARIANT_STYLES: Record<SkeletonVariant, CSSProperties> = {
  text:   { height: 12, borderRadius: 6, width: '100%' },
  circle: { height: 40, width: 40, borderRadius: '50%' },
  card:   { height: 140, borderRadius: 16, width: '100%' },
  chart:  { height: 220, borderRadius: 14, width: '100%' },
  badge:  { height: 22, width: 90, borderRadius: 99 },
  metric: { height: 60, borderRadius: 12, width: '100%' },
}

export default function Skeleton({
  variant = 'text', width, height, className, count = 1, style,
}: SkeletonProps) {
  const base = VARIANT_STYLES[variant]
  const mergedStyle: CSSProperties = {
    ...base,
    ...(width != null && { width }),
    ...(height != null && { height }),
    ...style,
  }

  if (count === 1) {
    return <div className={`skeleton ${className || ''}`} style={mergedStyle} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`skeleton ${className || ''}`}
          style={{
            ...mergedStyle,
            // Vary text widths for a more natural look
            ...(variant === 'text' && i === count - 1 && { width: '70%' }),
          }}
        />
      ))}
    </div>
  )
}
