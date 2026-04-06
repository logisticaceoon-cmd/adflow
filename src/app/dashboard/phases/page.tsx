// src/app/dashboard/phases/page.tsx — Dashboard por fases
import { createClient } from '@/lib/supabase/server'
import RecommendationsList from '@/components/dashboard/RecommendationsList'
import { PHASES, type Phase } from '@/lib/budget-engine'

interface CampaignRow {
  name: string
  status: string
  strategy_type: string | null
  daily_budget: number
  metrics: { roas?: number; spend?: number; conversions?: number; cpa?: number } | null
}

// Map a campaign to a phase using its strategy_type and name heuristics
function classifyPhase(c: CampaignRow): Phase {
  const name = (c.name || '').toLowerCase()
  if (/whatsapp|wa\b|mensaje/.test(name)) return 'F4'
  if (/retargeting|remarketing|carrito|tibio|caliente/.test(name)) return 'F3'
  if (c.strategy_type === 'BOFU' || /bofu|conversion|purchase|venta/.test(name)) return 'F2'
  return 'F1'
}

export default async function PhasesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const monthYear = new Date().toISOString().slice(0, 7)
  const [{ data: campaigns }, { data: budget }] = await Promise.all([
    supabase.from('campaigns').select('name, status, strategy_type, daily_budget, metrics').eq('user_id', user.id),
    supabase.from('monthly_budgets').select('total_budget, currency, phase_budgets, phase_budgets_recommended, phase_results').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
  ])

  const rows = (campaigns || []) as CampaignRow[]

  const grouped: Record<Phase, { spend: number; conversions: number; roas: number; count: number }> = {
    F1: { spend: 0, conversions: 0, roas: 0, count: 0 },
    F2: { spend: 0, conversions: 0, roas: 0, count: 0 },
    F3: { spend: 0, conversions: 0, roas: 0, count: 0 },
    F4: { spend: 0, conversions: 0, roas: 0, count: 0 },
  }
  for (const c of rows) {
    const ph = classifyPhase(c)
    const spend = c.metrics?.spend ?? 0
    grouped[ph].spend       += spend
    grouped[ph].conversions += c.metrics?.conversions ?? 0
    grouped[ph].roas        += c.metrics?.roas ?? 0
    grouped[ph].count       += 1
  }
  for (const ph of Object.keys(grouped) as Phase[]) {
    if (grouped[ph].count > 0) grouped[ph].roas = grouped[ph].roas / grouped[ph].count
  }

  const currency = (budget?.currency as string) || 'USD'
  const phaseBudgets = (budget?.phase_budgets as Record<string, number>) || {}
  const phaseBudgetsRec = (budget?.phase_budgets_recommended as Record<string, number>) || {}

  const totalSpend = (Object.values(grouped) as { spend: number }[]).reduce((s, p) => s + p.spend, 0)
  const hasAnyData = totalSpend > 0 || Object.keys(phaseBudgets).length > 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
          Fases · AdFlow
        </p>
        <h1 className="page-title mb-1.5">Inversión por fases del funnel</h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          Cómo estás distribuyendo tu inversión entre las 4 fases del funnel — {monthYear}
        </p>
      </div>

      {!hasAnyData ? (
        <div className="card p-10 text-center">
          <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
          <h2 className="section-title mb-2">Aún no tenés datos de fases</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18, maxWidth: 380, margin: '0 auto 18px' }}>
            Definí tu presupuesto del mes y publicá campañas para ver la distribución por fase del funnel.
          </p>
          <a href="/dashboard/budget" className="btn-primary">Definir presupuesto →</a>
        </div>
      ) : (
        <>
          {/* ── Phase cards ── */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {PHASES.map(p => {
              const g = grouped[p.key]
              const assigned = phaseBudgets[p.key] ?? 0
              return (
                <div key={p.key} className="card p-4" style={{ borderTop: `2px solid ${p.color}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.fullName}</p>
                      <p style={{ fontSize: 10, color: 'var(--muted)' }}>{g.count} campaña{g.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--muted)' }}>Asignado</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    {currency} {assigned.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--muted)' }}>Gastado</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: p.color, marginBottom: 8 }}>
                    {currency} {g.spend.toFixed(0)}
                  </p>
                  <p style={{ fontSize: 11, color: g.roas >= 3 ? '#06d6a0' : 'var(--muted)' }}>
                    ROAS: <b>{g.roas > 0 ? `${g.roas.toFixed(1)}x` : '—'}</b>
                  </p>
                </div>
              )
            })}
          </div>

          {/* ── Comparison table ── */}
          <div className="card p-6 mb-6">
            <h2 className="section-title mb-4">Comparativa por fase</h2>
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th>Fase</th>
                  <th>Recomendado</th>
                  <th>Asignado</th>
                  <th>Gastado real</th>
                  <th>Conversiones</th>
                  <th>ROAS</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map(p => {
                  const g = grouped[p.key]
                  return (
                    <tr key={p.key} className="table-row">
                      <td className="px-3 py-3" style={{ fontSize: 12, fontWeight: 700, color: p.color }}>
                        {p.icon} {p.fullName}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {currency} {(phaseBudgetsRec[p.key] ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>
                        {currency} {(phaseBudgets[p.key] ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
                        {currency} {g.spend.toFixed(0)}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>{g.conversions || '—'}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12, fontWeight: 700, color: g.roas >= 3 ? '#06d6a0' : g.roas > 0 ? '#f59e0b' : 'var(--muted)' }}>
                        {g.roas > 0 ? `${g.roas.toFixed(1)}x` : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Recommendations ── */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Próximos pasos</h2>
            <RecommendationsList limit={5} />
          </div>
        </>
      )}
    </div>
  )
}
