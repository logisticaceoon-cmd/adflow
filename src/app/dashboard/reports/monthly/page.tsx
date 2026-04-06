'use client'
// src/app/dashboard/reports/monthly/page.tsx — Monthly report viewer
import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { PHASES, type Phase } from '@/lib/budget-engine'
import LevelBadge from '@/components/dashboard/LevelBadge'

interface MonthlyReportRow {
  month_year: string
  total_spend: number
  total_revenue: number
  total_conversions: number
  avg_roas: number
  avg_cpa: number
  phase_metrics: Record<string, { spend: number; revenue: number; roas: number; conversions: number; cpa: number }>
  pixel_level_start: number
  pixel_level_end: number
  budget_planned: number
  budget_spent: number
  budget_efficiency: number
  growth_rate: number
  campaigns_created: number
  campaigns_active: number
  ai_analysis: string
  recommendations: any[]
}

function buildMonthOptions(): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

function ChangeArrow({ value }: { value: number }) {
  if (value > 0) return <span style={{ color: '#06d6a0', display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingUp size={14} /> +{value.toFixed(0)}%</span>
  if (value < 0) return <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }}><TrendingDown size={14} /> {value.toFixed(0)}%</span>
  return <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Minus size={14} /> 0%</span>
}

export default function MonthlyReportPage() {
  const months = buildMonthOptions()
  const [selected, setSelected] = useState<string>(months[0])
  const [report, setReport] = useState<MonthlyReportRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  async function loadReport(monthYear: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/monthly?month_year=${monthYear}`)
      const data = await res.json()
      if (data.report) setReport(data.report)
      else setReport(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReport(selected) }, [selected])

  async function regenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/reports/monthly?month_year=${selected}&force=1`)
      const data = await res.json()
      if (data.report) setReport(data.report)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
            Reporte mensual · AdFlow
          </p>
          <h1 className="page-title mb-1.5">Cómo te fue este mes 📊</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Análisis consolidado: gasto, ROAS, fases, evolución del pixel y próximas acciones
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selected} onChange={e => setSelected(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: '#fff', fontSize: 13 }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={regenerate} disabled={generating || loading} className="btn-primary" style={{ fontSize: 12 }}>
            {generating ? 'Regenerando...' : '🤖 Regenerar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center" style={{ color: 'var(--muted)' }}>Cargando reporte...</div>
      ) : !report ? (
        <div className="card p-10 text-center">
          <div style={{ fontSize: 40, marginBottom: 14 }}>📭</div>
          <h2 className="section-title mb-2">No hay reporte para {selected}</h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
            Generá el reporte ahora — vamos a calcular todas las métricas y pedirle a la IA un análisis ejecutivo.
          </p>
          <button onClick={regenerate} disabled={generating} className="btn-primary">
            {generating ? 'Generando...' : 'Generar reporte →'}
          </button>
        </div>
      ) : (
        <>
          {/* ── Top metrics ── */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Gasto total',  value: `$${report.total_spend.toFixed(0)}`, color: '#e91e8c' },
              { label: 'Revenue',      value: `$${report.total_revenue.toFixed(0)}`, color: '#06d6a0' },
              { label: 'ROAS',         value: `${report.avg_roas.toFixed(2)}x`, color: '#f59e0b' },
              { label: 'Conversiones', value: String(report.total_conversions), color: '#62c4b0' },
            ].map(m => (
              <div key={m.label} className="card p-4" style={{ borderTop: `2px solid ${m.color}` }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* ── Growth + level evolution ── */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="card p-5">
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Crecimiento vs mes anterior
              </p>
              <p style={{ fontSize: 22, fontWeight: 800 }}>
                <ChangeArrow value={report.growth_rate} />
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                en conversiones totales del mes
              </p>
            </div>

            <div className="card p-5">
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                Evolución del nivel
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <LevelBadge level={report.pixel_level_start} size="sm" showName={false} />
                <span style={{ fontSize: 18, color: 'var(--muted)' }}>→</span>
                <LevelBadge level={report.pixel_level_end} size="sm" showName={false} />
              </div>
            </div>

            <div className="card p-5">
              <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
                Eficiencia de presupuesto
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {report.budget_efficiency.toFixed(0)}%
              </p>
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', marginTop: 8, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${Math.min(100, report.budget_efficiency)}%`,
                  background: 'linear-gradient(90deg, #e91e8c, #62c4b0)',
                }} />
              </div>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                ${report.budget_spent.toFixed(0)} / ${report.budget_planned.toFixed(0)} planeado
              </p>
            </div>
          </div>

          {/* ── Phase metrics ── */}
          <div className="card p-6 mb-6">
            <h2 className="section-title mb-4">Métricas por fase</h2>
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th>Fase</th><th>Gasto</th><th>Revenue</th><th>ROAS</th><th>Conv.</th><th>CPA</th>
                </tr>
              </thead>
              <tbody>
                {PHASES.map(p => {
                  const m = report.phase_metrics[p.key as Phase]
                  if (!m) return (
                    <tr key={p.key} className="table-row">
                      <td className="px-3 py-3" style={{ fontSize: 12, color: 'var(--muted)' }}>{p.icon} {p.fullName}</td>
                      <td colSpan={5} className="px-3 py-3" style={{ fontSize: 11, color: 'var(--muted)' }}>Sin actividad este mes</td>
                    </tr>
                  )
                  return (
                    <tr key={p.key} className="table-row">
                      <td className="px-3 py-3" style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.icon} {p.fullName}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>${m.spend.toFixed(0)}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>${m.revenue.toFixed(0)}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12, fontWeight: 700, color: m.roas >= 3 ? '#06d6a0' : m.roas > 0 ? '#f59e0b' : 'var(--muted)' }}>
                        {m.roas > 0 ? `${m.roas.toFixed(1)}x` : '—'}
                      </td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>{m.conversions}</td>
                      <td className="px-3 py-3" style={{ fontSize: 12 }}>{m.cpa > 0 ? `$${m.cpa.toFixed(0)}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── AI analysis ── */}
          {report.ai_analysis && (
            <div className="card p-6 mb-6" style={{
              background: 'linear-gradient(135deg, rgba(234,27,126,0.06), rgba(98,196,176,0.04))',
            }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 18 }}>🤖</span>
                <h2 className="section-title">Análisis IA del mes</h2>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {report.ai_analysis}
              </p>
            </div>
          )}

          {/* ── Recommendations ── */}
          {report.recommendations?.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="section-title mb-4">Próximas acciones recomendadas</h2>
              <div className="flex flex-col gap-2.5">
                {report.recommendations.slice(0, 6).map((r, i) => {
                  const color = r.priority === 'high' ? '#f9a8d4' : r.priority === 'medium' ? '#fbbf24' : '#8892b0'
                  const bg    = r.priority === 'high' ? 'rgba(233,30,140,0.06)' : r.priority === 'medium' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)'
                  const border = r.priority === 'high' ? 'rgba(233,30,140,0.30)' : r.priority === 'medium' ? 'rgba(245,158,11,0.30)' : 'rgba(255,255,255,0.10)'
                  return (
                    <div key={i} className="p-3 rounded-xl" style={{ background: bg, border: `1px solid ${border}` }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 4 }}>{r.icon} {r.title}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)' }}>{r.description}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
