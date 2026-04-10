'use client'
// src/components/admin/AdminPlanSelect.tsx
import { useState } from 'react'

const PLANS = ['free', 'starter', 'pro', 'agency']
const PLAN_COLORS: Record<string, string> = {
  free: '#62c4b0', starter: '#f472b6', pro: '#2dd4a8', agency: '#f59e0b',
}

interface Props {
  userId: string
  currentPlan: string
}

export default function AdminPlanSelect({ userId, currentPlan }: Props) {
  const [plan, setPlan]       = useState(currentPlan)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)

  async function handleChange(newPlan: string) {
    if (newPlan === plan) return
    setLoading(true)
    setSaved(false)
    const res = await fetch('/api/admin/set-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan: newPlan }),
    })
    setLoading(false)
    if (res.ok) {
      setPlan(newPlan)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const color = PLAN_COLORS[plan] ?? '#8892b0'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <select
        value={plan}
        onChange={e => handleChange(e.target.value)}
        disabled={loading}
        style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 8,
          background: `${color}15`,
          color,
          border: `1px solid ${color}40`,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {PLANS.map(p => (
          <option key={p} value={p} style={{ background: '#120307', color: '#ffffff' }}>
            {p}
          </option>
        ))}
      </select>
      {loading && <span style={{ fontSize: 10, color: '#8892b0' }}>...</span>}
      {saved   && <span style={{ fontSize: 10, color: '#2dd4a8' }}>✓</span>}
    </div>
  )
}
