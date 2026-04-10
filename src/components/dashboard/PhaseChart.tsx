'use client'
// src/components/dashboard/PhaseChart.tsx — Comparative bar chart for phases
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

interface PhaseData {
  name: string
  color: string
  recomendado: number
  asignado: number
  gastado: number
}

interface Props {
  data: PhaseData[]
}

export default function PhaseChart({ data }: Props) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: '#a0a8c0', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.10)' }} />
          <YAxis tick={{ fill: '#a0a8c0', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.10)' }} />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 15, 13, 0.95)',
              border: '1px solid var(--ds-color-primary-border)',
              borderRadius: 10,
              fontSize: 12,
            }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
            iconType="circle"
          />
          <Bar dataKey="recomendado" fill="#5a6478" name="Recomendado" radius={[6, 6, 0, 0]} />
          <Bar dataKey="asignado"    fill="var(--ds-color-primary)" name="Asignado"    radius={[6, 6, 0, 0]} />
          <Bar dataKey="gastado"     fill="var(--ds-color-primary)" name="Gastado"     radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
