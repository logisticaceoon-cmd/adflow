'use client'
// src/app/dashboard/budget/page.tsx — Budget planner (premium UX)
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PHASES, type Phase, type BudgetRecommendation } from '@/lib/budget-engine'
import { DollarSign, ChevronDown, ChevronUp } from 'lucide-react'

interface MonthlyBudgetRow {
  month_year: string
  total_budget: number
  currency: string
  phase_budgets: Record<string, number>
  phase_budgets_recommended?: Record<string, number>
}

const LEVEL_COLORS: Record<number, string> = {
  0: '#8892b0', 1: 'var(--ds-color-danger)', 2: 'var(--ds-color-danger)', 3: 'var(--ds-color-warning)', 4: 'var(--ds-color-warning)',
  5: 'var(--ds-color-success)', 6: 'var(--ds-color-success)', 7: '#3b82f6', 8: '#8b5cf6',
}

// Minimum pixel level to unlock each phase
const PHASE_MIN_LEVEL: Record<Phase, number> = { F1: 0, F2: 0, F3: 3, F4: 0 }

// Why each phase matters at this level
const PHASE_DETAIL: Record<Phase, { why: string; growth: string }> = {
  F1: {
    why:    'Atrae personas nuevas a tu negocio. Sin esto el funnel se queda sin visitantes.',
    growth: 'Cuando subas de nivel, este % puede bajar y mover la inversión hacia F3 (donde está el ROAS).',
  },
  F2: {
    why:    'Convierte a los interesados en compradores. Es donde la mayoría del retorno aparece directo.',
    growth: 'A más datos, F2 escala con lookalikes y se vuelve más eficiente.',
  },
  F3: {
    why:    'Recupera a personas que casi compran. Es la fase con mayor ROAS posible.',
    growth: 'Con tu pixel maduro, F3 puede llegar a ROAS de 5x o más.',
  },
  F4: {
    why:    'Canal directo de conversación. Cierra ventas que no se cierran solas.',
    growth: 'WhatsApp es estable: el % se mantiene parecido al subir de nivel.',
  },
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface NumberCardProps {
  icon: string
  label: string
  helper: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  required?: boolean
  big?: boolean
}

function InputCard({ icon, label, helper, value, onChange, prefix, suffix, required, big }: NumberCardProps) {
  return (
    <div style={{
      padding: '18px 20px', borderRadius: 16,
      background: 'var(--ds-card-bg)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
          {label} {required && <span style={{ color: 'var(--ds-color-primary)' }}>*</span>}
        </p>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>{helper}</p>
      <div style={{ position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: big ? 18 : 13, color: 'var(--muted)', fontWeight: 600, pointerEvents: 'none',
          }}>{prefix}</span>
        )}
        <input
          type="number" min={0}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: big ? '14px 14px 14px 36px' : '11px 14px 11px 14px',
            paddingLeft: prefix ? (big ? 36 : 30) : (big ? 14 : 14),
            paddingRight: suffix ? 36 : 14,
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#fff',
            fontSize: big ? 22 : 14,
            fontFamily: big ? 'Syne, sans-serif' : undefined,
            fontWeight: big ? 800 : 500,
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 13, color: 'var(--muted)', fontWeight: 600, pointerEvents: 'none',
          }}>{suffix}</span>
        )}
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const [totalBudget, setTotalBudget] = useState<string>('')
  const [currency,    setCurrency]    = useState('USD')
  const [avgTicket,   setAvgTicket]   = useState<string>('')
  const [marginPct,   setMarginPct]   = useState<string>('')
  const [targetRoas,  setTargetRoas]  = useState<string>('3')
  const [monthGoal,   setMonthGoal]   = useState<string>('')
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null)
  const [pixelLevel,  setPixelLevel]  = useState(0)
  const [pixelLevelName, setPixelLevelName] = useState('Sin Data')
  const [phaseBudgets, setPhaseBudgets] = useState<Record<Phase, number>>({ F1: 0, F2: 0, F3: 0, F4: 0 })
  const [history, setHistory] = useState<MonthlyBudgetRow[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [activeBudget, setActiveBudget] = useState<MonthlyBudgetRow | null>(null)

  const now = new Date()
  const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`

  // Load currency + history + pixel + active budget on mount
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: biz }, { data: hist }, { data: pa }, { data: active }] = await Promise.all([
        supabase.from('business_profiles').select('currency').eq('user_id', user.id).maybeSingle(),
        supabase.from('monthly_budgets')
          .select('month_year, total_budget, currency, phase_budgets, phase_budgets_recommended')
          .eq('user_id', user.id)
          .order('month_year', { ascending: false })
          .limit(6),
        supabase.from('pixel_analysis').select('level, level_name').eq('user_id', user.id).maybeSingle(),
        supabase.from('monthly_budgets').select('*').eq('user_id', user.id).eq('month_year', monthYear).maybeSingle(),
      ])
      if (biz?.currency) setCurrency(biz.currency)
      if (hist) setHistory(hist as MonthlyBudgetRow[])
      if (pa) {
        setPixelLevel(pa.level ?? 0)
        setPixelLevelName(pa.level_name ?? 'Sin Data')
      }
      if (active) {
        setActiveBudget(active as MonthlyBudgetRow)
        setTotalBudget(String(active.total_budget))
        if (active.phase_budgets) setPhaseBudgets(active.phase_budgets as Record<Phase, number>)
      }
    }
    load()
  }, [monthYear])

  async function handleRecommend() {
    const t = Number(totalBudget)
    if (!t || t <= 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/budget/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_budget: t,
          currency,
          avg_ticket:  avgTicket  ? Number(avgTicket)  : undefined,
          margin_pct:  marginPct  ? Number(marginPct)  : undefined,
          target_roas: targetRoas ? Number(targetRoas) : undefined,
        }),
      })
      const data = await res.json()
      if (data.recommendation) {
        setRecommendation(data.recommendation)
        if (typeof data.pixel_level === 'number') setPixelLevel(data.pixel_level)
        // Pre-fill editable amounts. Locked phases get $0.
        setPhaseBudgets({
          F1: pixelLevel >= PHASE_MIN_LEVEL.F1 ? data.recommendation.phases.F1.recommended : 0,
          F2: pixelLevel >= PHASE_MIN_LEVEL.F2 ? data.recommendation.phases.F2.recommended : 0,
          F3: pixelLevel >= PHASE_MIN_LEVEL.F3 ? data.recommendation.phases.F3.recommended : 0,
          F4: pixelLevel >= PHASE_MIN_LEVEL.F4 ? data.recommendation.phases.F4.recommended : 0,
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
          total_budget: Number(totalBudget),
          currency,
          avg_ticket:  avgTicket  ? Number(avgTicket)  : undefined,
          margin_pct:  marginPct  ? Number(marginPct)  : undefined,
          target_roas: targetRoas ? Number(targetRoas) : undefined,
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
        setSavedMsg(`✓ Guardado para ${data.month_year}`)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: hist } = await supabase.from('monthly_budgets')
            .select('month_year, total_budget, currency, phase_budgets, phase_budgets_recommended')
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
  const totalNum = Number(totalBudget) || 0
  const diff = totalAssigned - totalNum
  const lvColor = LEVEL_COLORS[pixelLevel]

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── SECTION A: HERO ───────────────────────────────────────────── */}
      <div className="dash-anim-1 mb-6" style={{
        position: 'relative',
        borderRadius: 22, padding: '28px 32px',
        background: 'linear-gradient(135deg, var(--ds-color-primary-soft) 0%, transparent 50%, var(--ds-color-primary-soft) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.50), 0 0 80px transparent',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(234,27,126,0.55), var(--ds-card-border), transparent)',
        }} />

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Budget Engine · AdFlow
        </p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800,
          color: '#fff', marginBottom: 8, letterSpacing: '-0.03em',
        }}>
          Planificá tu inversión del mes 💰
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--ds-text-secondary)', maxWidth: 580, lineHeight: 1.55, marginBottom: 16 }}>
          Distribuí tu presupuesto entre las fases de crecimiento. El sistema te recomienda la mejor distribución según tu nivel.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: `${lvColor}15`,
            border: `1px solid ${lvColor}40`,
            fontSize: 12, fontWeight: 700, color: lvColor,
          }}>
            ⭐ Nivel {pixelLevel}: {pixelLevelName}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 99,
            background: 'var(--ds-card-border)',
            border: '1px solid var(--ds-card-border)',
            fontSize: 12, fontWeight: 600, color: 'var(--ds-color-primary)',
          }}>
            📅 {monthLabel}
          </span>
          {activeBudget && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 99,
              background: 'var(--ds-color-warning-soft)',
              border: '1px solid var(--ds-color-warning-border)',
              fontSize: 12, fontWeight: 600, color: 'var(--ds-color-warning)',
            }}>
              💼 Presupuesto activo: {currency} {activeBudget.total_budget.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ── SECTION B: 5 INPUT CARDS ──────────────────────────────────── */}
      <div className="mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Datos de tu negocio este mes
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
          Con esta información calculamos la mejor distribución y proyecciones realistas
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputCard
            icon="💵"
            label="Presupuesto mensual total"
            helper="¿Cuánto querés invertir en publicidad este mes?"
            value={totalBudget}
            onChange={setTotalBudget}
            prefix={currency === 'USD' ? '$' : currency}
            required
            big
          />
          <InputCard
            icon="🎫"
            label="Ticket promedio"
            helper="¿Cuánto cobra tu cliente en promedio por compra? Si vendés productos de $50 y de $100, poné $75."
            value={avgTicket}
            onChange={setAvgTicket}
            prefix={currency === 'USD' ? '$' : currency}
          />
          <InputCard
            icon="📊"
            label="Margen de ganancia"
            helper="¿Qué porcentaje de ganancia tenés por venta? Si vendés a $100 y te cuesta $40, tu margen es 60%."
            value={marginPct}
            onChange={setMarginPct}
            suffix="%"
          />
          <InputCard
            icon="🎯"
            label="ROAS objetivo"
            helper="¿Cuánto querés ganar por cada peso invertido? ROAS 3x significa que por cada $1 invertido, ganás $3 en ventas."
            value={targetRoas}
            onChange={setTargetRoas}
            suffix="x"
          />
        </div>

        {/* Goal textarea full-width */}
        <div style={{
          padding: '18px 20px', borderRadius: 16,
          background: 'var(--ds-card-bg)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div className="flex items-center gap-2 mb-2">
            <span style={{ fontSize: 18 }}>📝</span>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Objetivo del mes (opcional)</p>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
            ¿Qué querés lograr este mes? Ej: aumentar ventas, lanzar producto nuevo
          </p>
          <textarea
            rows={2}
            value={monthGoal}
            onChange={e => setMonthGoal(e.target.value)}
            placeholder="Ej: Lanzar mi nueva línea de zapatillas y conseguir 50 ventas el primer mes"
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
              color: '#fff', fontSize: 13, resize: 'vertical', fontFamily: 'inherit',
            }}
          />
        </div>

        <div className="mt-5 flex justify-center">
          <button onClick={handleRecommend} disabled={loading || !totalBudget} className="btn-primary"
            style={{ fontSize: 14, padding: '12px 28px', opacity: (loading || !totalBudget) ? 0.5 : 1 }}>
            {loading ? 'Calculando...' : '📊 Calcular distribución recomendada →'}
          </button>
        </div>
      </div>

      {/* ── SECTION C: PHASE DISTRIBUTION ─────────────────────────────── */}
      {recommendation && (
        <div className="card p-6 mb-6">
          <div className="mb-4">
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
              Distribución de presupuesto por fases
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>
              El sistema recomienda basándose en tu nivel de pixel. Podés ajustar los montos.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PHASES.map(p => {
              const rec = recommendation.phases[p.key]
              const minLevel = PHASE_MIN_LEVEL[p.key]
              const isLocked = pixelLevel < minLevel
              const assignedPct = totalNum > 0 ? Math.round(((phaseBudgets[p.key] || 0) / totalNum) * 100) : 0
              const recPct = rec.percentage
              const deviation = Math.abs(assignedPct - recPct)
              const deviated = deviation > 15
              const detail = PHASE_DETAIL[p.key]

              return (
                <div key={p.key} style={{
                  padding: '20px 22px', borderRadius: 16,
                  background: isLocked
                    ? 'rgba(255,255,255,0.015)'
                    : `linear-gradient(135deg, ${p.color}10, ${p.color}03)`,
                  border: `1px solid ${isLocked ? 'rgba(255,255,255,0.06)' : `${p.color}30`}`,
                  opacity: isLocked ? 0.55 : 1,
                  position: 'relative',
                }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                        background: `${p.color}20`, border: `1px solid ${p.color}50`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        boxShadow: isLocked ? 'none' : `0 0 16px ${p.color}30`,
                      }}>{p.icon}</div>
                      <div>
                        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: p.color }}>
                          {p.fullName}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>{p.objective}</p>
                      </div>
                    </div>
                    {isLocked ? (
                      <span style={{
                        padding: '4px 12px', borderRadius: 99,
                        fontSize: 10, fontWeight: 700,
                        background: 'var(--ds-color-warning-soft)',
                        color: 'var(--ds-color-warning)',
                        border: '1px solid var(--ds-color-warning-border)',
                      }}>🔒 Disponible en Nivel {minLevel}</span>
                    ) : (
                      <span style={{
                        padding: '4px 12px', borderRadius: 99,
                        fontSize: 11, fontWeight: 700,
                        background: `${p.color}15`,
                        color: p.color,
                        border: `1px solid ${p.color}40`,
                      }}>{assignedPct}% del total</span>
                    )}
                  </div>

                  {/* Recommended vs assigned row */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                        Recomendado
                      </p>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#a0a8c0' }}>
                        {currency} {rec.recommended.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                        Asignado por vos
                      </p>
                      <input
                        type="number" min={0}
                        disabled={isLocked}
                        value={phaseBudgets[p.key] || 0}
                        onChange={e => setPhaseBudgets(prev => ({ ...prev, [p.key]: Number(e.target.value) }))}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: 8,
                          background: isLocked ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${p.color}40`,
                          color: '#fff', fontSize: 16, fontWeight: 700,
                          fontFamily: 'Syne, sans-serif',
                          cursor: isLocked ? 'not-allowed' : 'text',
                        }}
                      />
                    </div>
                  </div>

                  {/* Visual progress bar */}
                  <div style={{
                    height: 10, borderRadius: 99,
                    background: 'rgba(255,255,255,0.05)',
                    overflow: 'hidden', marginBottom: 10,
                  }}>
                    <div style={{
                      height: '100%', width: `${Math.min(100, assignedPct)}%`,
                      background: `linear-gradient(90deg, ${p.color}, ${p.color}aa)`,
                      boxShadow: `0 0 12px ${p.color}50`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>

                  {/* Why + growth note */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
                      <b style={{ color: p.color }}>¿Por qué?</b> {isLocked ? 'Tu pixel aún no tiene datos suficientes para esta fase. Invertí en F1 para llegar más rápido.' : detail.why}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      💡 {detail.growth}
                    </p>
                  </div>

                  {!isLocked && deviated && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px', borderRadius: 8,
                      background: 'var(--ds-color-warning-soft)',
                      border: '1px solid rgba(245,158,11,0.25)',
                      fontSize: 11, color: 'var(--ds-color-warning)',
                    }}>
                      ⚠️ Estás asignando {assignedPct < recPct ? 'menos' : 'más'} de lo recomendado ({recPct}% sugerido)
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Total bar */}
          <div style={{ marginTop: 22, padding: '16px 20px', borderRadius: 14, background: 'var(--ds-card-bg)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                Total asignado
              </span>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {currency} {totalAssigned.toLocaleString()}{' '}
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
                  / {currency} {totalNum.toLocaleString()} disponible
                </span>
              </span>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{
                height: '100%', width: `${Math.min(100, totalNum > 0 ? (totalAssigned / totalNum) * 100 : 0)}%`,
                background: diff === 0
                  ? 'linear-gradient(90deg, var(--ds-color-success), var(--ds-color-primary))'
                  : diff > 0
                    ? 'linear-gradient(90deg, var(--ds-color-danger), #f87171)'
                    : 'linear-gradient(90deg, var(--ds-color-warning), var(--ds-color-warning))',
                boxShadow: '0 0 14px var(--ds-card-border)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <p style={{ fontSize: 12, color: diff === 0 ? 'var(--ds-color-success)' : diff > 0 ? 'var(--ds-color-danger)' : 'var(--ds-color-warning)', fontWeight: 600 }}>
              {diff === 0
                ? '✅ Presupuesto completamente asignado'
                : diff > 0
                  ? `❌ Excediste el presupuesto en ${currency} ${diff.toLocaleString()}`
                  : `⚠️ Te sobran ${currency} ${Math.abs(diff).toLocaleString()} sin asignar`}
            </p>
          </div>
        </div>
      )}

      {/* ── SECTION D: PROJECTIONS ────────────────────────────────────── */}
      {recommendation && (
        <div className="card p-6 mb-6">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Proyecciones estimadas
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
            Basadas en tu presupuesto, nivel y datos históricos. Después del primer mes ajustamos con datos reales.
          </p>

          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: '👥', label: 'Alcance estimado',    value: recommendation.projections.estimatedReach,       color: 'var(--ds-color-primary)', tooltip: `Con ${currency} ${totalNum.toLocaleString()} invertidos` },
              { icon: '🖱', label: 'Clicks estimados',    value: recommendation.projections.estimatedClicks,      color: 'var(--ds-color-primary)', tooltip: 'Personas que harán click en tus anuncios' },
              { icon: '🛒', label: 'Conversiones',         value: recommendation.projections.estimatedConversions, color: 'var(--ds-color-warning)', tooltip: 'Ventas o leads estimados según tu nivel' },
              { icon: '📈', label: 'ROAS proyectado',      value: recommendation.projections.estimatedRoas,        color: 'var(--ds-color-success)', tooltip: 'Retorno por cada peso invertido' },
            ].map(p => (
              <div key={p.label} title={p.tooltip} className="p-4 rounded-xl" style={{
                background: `${p.color}08`,
                border: `1px solid ${p.color}30`,
                borderTop: `2px solid ${p.color}`,
                cursor: 'help',
              }}>
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em' }}>
                    {p.label}
                  </p>
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: p.color, lineHeight: 1.2 }}>
                  {p.value}
                </p>
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                  {p.tooltip}
                </p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 14, fontStyle: 'italic' }}>
            💡 Estimaciones generales basadas en tu nivel de pixel ({pixelLevel}). A más datos históricos, más precisas las proyecciones.
          </p>
        </div>
      )}

      {/* ── SECTION E: SAVE + HISTORY ─────────────────────────────────── */}
      {recommendation && (
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={handleSave} disabled={saving} className="btn-primary"
              style={{ fontSize: 14, padding: '14px 32px', boxShadow: '0 0 32px rgba(234,27,126,0.45), 0 6px 24px var(--ds-color-primary-border)' }}>
              {saving ? 'Guardando...' : '💾 Guardar presupuesto del mes'}
            </button>
            {savedMsg && <span style={{ fontSize: 13, color: 'var(--ds-color-success)', fontWeight: 600 }}>{savedMsg}</span>}
          </div>
        </div>
      )}

      {/* History collapsible */}
      <div className="card p-5 mb-6">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>
              📅 Historial de meses anteriores
            </h2>
            <p style={{ fontSize: 11, color: 'var(--muted)' }}>
              {history.length === 0 ? 'Este es tu primer mes planificando. ¡Gran paso!' : `${history.length} mes${history.length !== 1 ? 'es' : ''} con presupuesto guardado`}
            </p>
          </div>
          {historyOpen ? <ChevronUp size={18} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--muted)' }} />}
        </button>

        {historyOpen && history.length > 0 && (
          <div className="mt-4 space-y-2">
            {history.map(h => (
              <div key={h.month_year} className="p-3 rounded-lg flex items-center justify-between" style={{ background: 'var(--ds-card-bg)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{h.month_year}</p>
                  <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                    F1 {(h.phase_budgets?.F1 ?? 0).toLocaleString()} · F2 {(h.phase_budgets?.F2 ?? 0).toLocaleString()} · F3 {(h.phase_budgets?.F3 ?? 0).toLocaleString()} · F4 {(h.phase_budgets?.F4 ?? 0).toLocaleString()}
                  </p>
                </div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--ds-color-success)' }}>
                  {h.currency} {h.total_budget?.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION F: EDUCATION ──────────────────────────────────────── */}
      <div className="card p-6 mb-6" style={{
        background: 'linear-gradient(135deg, transparent, rgba(98,196,176,0.04))',
        border: '1px solid var(--ds-color-primary-soft)',
      }}>
        <div className="flex items-start gap-4">
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid var(--ds-color-primary-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            boxShadow: '0 0 16px var(--ds-color-primary-border)',
          }}>💡</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
              ¿Cómo funciona la distribución por fases?
            </h3>
            <p style={{ fontSize: 12.5, color: 'var(--ds-text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
              Tu negocio necesita 4 tipos de campañas trabajando juntas:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PHASES.map(p => (
                <li key={p.key} style={{ fontSize: 12, color: 'var(--ds-text-secondary)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <span>
                    <b style={{ color: p.color }}>{p.fullName}:</b> {PHASE_DETAIL[p.key].why}
                  </span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginTop: 12, fontStyle: 'italic' }}>
              La distribución ideal cambia según tu nivel. Al inicio, la mayor inversión va a F1 para generar datos. A medida que crecés, F3 se vuelve tu motor de ventas más rentable.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
