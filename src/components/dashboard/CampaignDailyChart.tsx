'use client'
// src/components/dashboard/CampaignDailyChart.tsx
// Daily evolution chart for a single campaign with metric switcher.
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

interface DailyRow {
  date: string
  spend?: number
  roas?: number
  clicks?: number
  purchases?: number
  impressions?: number
}

interface Props {
  data: DailyRow[]
  currency?: string
}

type MetricKey = 'spend' | 'roas' | 'clicks' | 'purchases'

const METRICS: Array<{ key: MetricKey; label: string; color: string; format: (v: number) => string }> = [
  { key: 'spend',     label: 'Inversión', color: 'var(--ds-color-primary)', format: v => `$${Math.round(v).toLocaleString('es')}` },
  { key: 'roas',      label: 'ROAS',      color: 'var(--ds-color-primary)', format: v => `${v.toFixed(2)}x` },
  { key: 'clicks',    label: 'Clicks',    color: '#2dd4bf', format: v => Math.round(v).toLocaleString('es') },
  { key: 'purchases', label: 'Ventas',    color: 'var(--ds-color-warning)', format: v => Math.round(v).toLocaleString('es') },
]

function formatDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function CustomTooltip({ active, payload, label, formatter, color }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(10, 15, 13, 0.95)',
      border: `1px solid ${color}40`,
    }}>
      <p style={{ fontSize: 11, color: '#8892b0', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
        {formatter(payload[0].value || 0)}
      </p>
    </div>
  )
}

export default function CampaignDailyChart({ data }: Props) {
  const [active, setActive] = useState<MetricKey>('spend')
  const metric = METRICS.find(m => m.key === active)!

  const chartData = useMemo(
    () => data.map(d => ({
      label: formatDate(d.date),
      value: Number(d[active] ?? 0),
    })),
    [data, active],
  )

  if (!data.length) {
    return (
      <div style={{
        padding: '40px 20px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.10)',
        borderRadius: 14,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📊</p>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
          Sincronizá métricas para ver la evolución diaria
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {METRICS.map(m => {
          const isActive = m.key === active
          return (
            <button key={m.key} onClick={() => setActive(m.key)}
              style={{
                fontSize: 11, fontWeight: 700,
                padding: '7px 14px', borderRadius: 99,
                background: isActive ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                color: isActive ? m.color : 'var(--ds-text-secondary)',
                border: isActive ? `1px solid ${m.color}55` : '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', transition: 'all 0.18s',
              }}>
              {m.label}
            </button>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`stroke-${active}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={metric.color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={metric.color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#a8b0c0' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#a8b0c0' }}
            axisLine={false} tickLine={false}
            tickFormatter={v => active === 'spend' ? `$${Math.round(v)}` : active === 'roas' ? `${v.toFixed(1)}x` : String(Math.round(v))}
          />
          <Tooltip content={<CustomTooltip formatter={metric.format} color={metric.color} />}
                   cursor={{ stroke: `${metric.color}40`, strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Line type="monotone" dataKey="value"
                stroke={`url(#stroke-${active})`}
                strokeWidth={2.5}
                dot={{ r: 3, fill: metric.color, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: metric.color, strokeWidth: 2, stroke: `${metric.color}55` }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
