'use client'
// src/app/dashboard/budget/page.tsx — Budget engine UI
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PHASES, type Phase, type BudgetRecommendation } from '@/lib/budget-engine'
import { DollarSign } from 'lucide-react'

interface MonthlyBudgetRow {
  month_year: string
  total_budget: number
  currency: string
  phase_budgets: Record<string, number>
}

export default function BudgetPage() {
  const [totalBudget, setTotalBudget] = useState<number>(0)
  const [currency,    setCurrency]    = useState('USD')
  const [avgTicket,   setAvgTicket]   = useState<string>('')
  const [marginPct,   setMarginPct]   = useState<string>('')
  const [targetRoas,  setTargetRoas]  = useState<string>('')
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null)
  const [pixelLevel,  setPixelLevel]  = useState(0)
  const [phaseBudgets, setPhaseBudgets] = useState<Record<Phase, number>>({ F1: 0, F2: 0, F3: 0, F4: 0 })
  const [history, setHistory] = useState<MonthlyBudgetRow[]>([])
  const [savedMsg, setSavedMsg] = useState('')

  // Load currency + history on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: biz }, { data: hist }] = await Promise.all([
        supabase.from('business_profiles').select('currency').eq('user_id', user.id).maybeSingle(),
        supabase.from('monthly_budgets')
          .select('month_year, total_budget, currency, phase_budgets')
          .eq('user_id', user.id)
          .order('month_year', { ascending: false })
          .limit(6),
      ])
      if (biz?.currency) setCurrency(biz.currency)
      if (hist) setHistory(hist as MonthlyBudgetRow[])
    }
    load()
  }, [])

  async function handleRecommend() {
    if (!totalBudget || totalBudget <= 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/budget/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_budget: totalBudget,
          currency,
          avg_ticket:   avgTicket  ? Number(avgTicket)  : undefined,
          margin_pct:   marginPct  ? Number(marginPct)  : undefined,
          target_roas:  targetRoas ? Number(targetRoas) : undefined,
        }),
      })
      const data = await res.json()
      if (data.recommendation) {
        setRecommendation(data.recommendation)
        setPixelLevel(data.pixel_level || 0)
        // Pre-fill editable amounts with the recommended values
        setPhaseBudgets({
          F1: data.recommendation.phases.F1.recommended,
          F2: data.recommendation.phases.F2.recommended,
          F3: data.recommendation.phases.F3.recommended,
          F4: data.recommendation.phases.F4.recommended,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!recommendation) return
    setSaving(true); setSavedMsg('')
    try {
      const res = await fetch('/api/budget/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_budget:  totalBudget,
          currency,
          avg_ticket:    avgTicket  ? Number(avgTicket)  : undefined,
          margin_pct:    marginPct  ? Number(marginPct)  : undefined,
          target_roas:   targetRoas ? Number(targetRoas) : undefined,
          phase_budgets: phaseBudgets,
          phase_budgets_recommended: {
            F1: recommendation.phases.F1.recommended,
            F2: recommendation.phases.F2.recommended,
            F3: recommendation.phases.F3.recommended,
            F4: recommendation.phases.F4.recommended,
          },
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setSavedMsg(`✓ Presupuesto del mes ${data.month_year} guardado`)
        // Reload history
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: hist } = await supabase.from('monthly_budgets')
            .select('month_year, total_budget, currency, phase_budgets')
            .eq('user_id', user.id)
            .order('month_year', { ascending: false })
            .limit(6)
          if (hist) setHistory(hist as MonthlyBudgetRow[])
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const totalAssigned = (Object.values(phaseBudgets) as number[]).reduce((s, n) => s + (n || 0), 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
          Budget Engine · AdFlow
        </p>
        <h1 className="page-title mb-1.5">Presupuesto del mes 💰</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Distribuí tu inversión entre las 4 fases del funnel según tu nivel actual del pixel
        </p>
      </div>

      {/* ── Inputs ── */}
      <div className="card p-6 mb-6">
        <h2 className="section-title mb-4">Datos del mes</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Presupuesto mensual total
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min={0} value={totalBudget || ''} onChange={e => setTotalBudget(Number(e.target.value))}
                placeholder="1000"
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14 }} />
              <input type="text" value={currency} onChange={e => setCurrency(e.target.value.toUpperCase())}
                style={{ width: 80, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Ticket promedio (opcional)
            </label>
            <input type="number" min={0} value={avgTicket} onChange={e => setAvgTicket(e.target.value)}
              placeholder="50"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              Margen de ganancia % (opcional)
            </label>
            <input type="number" min={0} max={100} value={marginPct} onChange={e => setMarginPct(e.target.value)}
              placeholder="40"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
              ROAS objetivo (opcional)
            </label>
            <input type="number" min={0} step={0.1} value={targetRoas} onChange={e => setTargetRoas(e.target.value)}
              placeholder="3"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 14 }} />
          </div>
        </div>
        <button onClick={handleRecommend} disabled={loading || !totalBudget} className="btn-primary">
          {loading ? 'Calculando...' : '🤖 Obtener recomendación'}
        </button>
      </div>

      {/* ── Recommendation table ── */}
      {recommendation && (
        <>
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Distribución por fases</h2>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  Recomendación basada en tu nivel del pixel ({pixelLevel}). Editá los montos asignados como prefieras.
                </p>
              </div>
              <span style={{
                fontSize: 11, padding: '4px 12px', borderRadius: 20,
                background: 'rgba(98,196,176,0.10)', color: '#62c4b0',
                border: '1px solid rgba(98,196,176,0.25)',
              }}>
                Total: {currency} {totalAssigned.toLocaleString()}
              </span>
            </div>

            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th>Fase</th><th>Recomendado</th><th>Asignado</th><th>%</th><th>Razón</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map(p => {
                  const rec = recommendation.phases[p.key]
                  return (
                    <tr key={p.key} className="table-row">
                      <td className="px-3 py-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{p.icon}</span>
                          <div>
                            <p style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.fullName}</p>
                            <p style={{ fontSize: 11, color: 'var(--muted)' }}>{p.objective}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {currency} {rec.recommended.toLocaleString()}
                      </td>
                      <td className="px-3 py-3">
                        <input type="number" min={0}
                          value={phaseBudgets[p.key] || 0}
                          onChange={e => setPhaseBudgets(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                          style={{ width: 110, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 12 }} />
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>
                        {totalBudget > 0 ? Math.round(((phaseBudgets[p.key] || 0) / totalBudget) * 100) : 0}%
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 280 }}>
                        {rec.reason}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Projections ── */}
          <div className="card p-6 mb-6">
            <h2 className="section-title mb-4">Proyecciones del mes</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Reach',       value: recommendation.projections.estimatedReach,       color: '#62c4b0' },
                { label: 'Clicks',      value: recommendation.projections.estimatedClicks,      color: '#e91e8c' },
                { label: 'Conversiones', value: recommendation.projections.estimatedConversions, color: '#f59e0b' },
                { label: 'ROAS',        value: recommendation.projections.estimatedRoas,        color: '#06d6a0' },
              ].map(p => (
                <div key={p.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${p.color}30` }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                    {p.label}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : '💾 Guardar presupuesto del mes'}
            </button>
            {savedMsg && <span style={{ fontSize: 12, color: '#06d6a0' }}>{savedMsg}</span>}
          </div>
        </>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Historial</h2>
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th>Mes</th><th>Total</th><th>F1</th><th>F2</th><th>F3</th><th>F4</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.month_year} className="table-row">
                  <td className="px-3 py-3" style={{ fontSize: 12 }}>{h.month_year}</td>
                  <td className="px-3 py-3" style={{ fontSize: 12, fontWeight: 700 }}>{h.currency} {h.total_budget?.toLocaleString()}</td>
                  {(['F1','F2','F3','F4'] as const).map(p => (
                    <td key={p} className="px-3 py-3" style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {(h.phase_budgets?.[p] ?? 0).toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
