'use client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const DEMO_DATA = [
  { day: 'Lun', gasto: 38 },
  { day: 'Mar', gasto: 62 },
  { day: 'Mié', gasto: 45 },
  { day: 'Jue', gasto: 88 },
  { day: 'Vie', gasto: 74 },
  { day: 'Sáb', gasto: 102 },
  { day: 'Dom', gasto: 58 },
]

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(10,10,26,0.92)',
      border: '1px solid rgba(233,30,140,0.25)',
      backdropFilter: 'blur(16px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(233,30,140,0.08)',
    }}>
      <p style={{ fontSize: 11, color: '#8892b0', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em' }}>
        ${payload[0].value}
      </p>
    </div>
  )
}

interface Props { totalSpend?: number }

export default function SpendChart({ totalSpend }: Props) {
  const data = totalSpend && totalSpend > 0
    ? DEMO_DATA.map(d => ({ ...d, gasto: Math.round(d.gasto * (totalSpend / 467)) }))
    : DEMO_DATA

  return (
    <ResponsiveContainer width="100%" height={170}>
      <AreaChart data={data} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGradPink" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#e91e8c" stopOpacity={0.45} />
            <stop offset="60%"  stopColor="#62c4b0" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#62c4b0" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#e91e8c" />
            <stop offset="100%" stopColor="#62c4b0" />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: '#a8b0c0' }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#a8b0c0' }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(233,30,140,0.20)', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Area
          type="monotone"
          dataKey="gasto"
          stroke="url(#strokeGrad)"
          strokeWidth={2.5}
          fill="url(#spendGradPink)"
          dot={false}
          activeDot={{ r: 5, fill: '#e91e8c', strokeWidth: 2, stroke: 'rgba(233,30,140,0.3)', filter: 'drop-shadow(0 0 6px rgba(233,30,140,0.6))' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
