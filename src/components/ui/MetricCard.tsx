// src/components/ui/MetricCard.tsx
import type { ReactNode } from 'react'
import { ArrowUp, ArrowDown } from 'lucide-react'
import Card from './Card'

export type MetricStatus = 'neutral' | 'good' | 'warning' | 'bad'

interface MetricCardProps {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
  trend?: { value: number; isPositive: boolean; label?: string }
  icon?: ReactNode
  tooltip?: string
  status?: MetricStatus
  className?: string
}

const STATUS_COLOR: Record<MetricStatus, string> = {
  neutral: 'var(--ds-text-primary)',
  good:    'var(--ds-color-success)',
  warning: 'var(--ds-color-warning)',
  bad:     'var(--ds-color-danger)',
}

export default function MetricCard({
  label, value, prefix, suffix, trend, icon, tooltip,
  status = 'neutral', className,
}: MetricCardProps) {
  const valueColor = STATUS_COLOR[status]

  return (
    <Card padding="md" className={className}>
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            opacity: 0.5, color: 'var(--ds-text-secondary)',
            display: 'inline-flex',
          }}>
            {icon}
          </span>
        )}

        <p
          title={tooltip}
          style={{
            fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ds-text-label)',
            marginBottom: 8,
            cursor: tooltip ? 'help' : 'default',
          }}
        >
          {label}
        </p>

        <p style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28, fontWeight: 800,
          color: valueColor,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          {prefix}{value}{suffix}
        </p>

        {trend && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginTop: 6,
            fontSize: 11, fontWeight: 600,
            color: trend.isPositive ? 'var(--ds-color-success)' : 'var(--ds-color-danger)',
          }}>
            {trend.isPositive ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
            <span>{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span style={{ color: 'var(--ds-text-muted)', fontWeight: 500 }}>
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
