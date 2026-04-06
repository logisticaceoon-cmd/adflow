'use client'
// src/components/dashboard/PhaseSummary.tsx
// Compact phase view: F1/F2/F3/F4 with budget vs spent, ROAS, status badge.
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PHASES, type Phase } from '@/lib/budget-engine'

interface PhaseRow {
  recommended: number
  spent: number
  roas: number
  conversions: number
  status: 'healthy' | 'risk' | 'optimize' | 'locked'
  insight: string
}

interface Props {
  currency: string
  phaseData: Record<Phase, PhaseRow>
}

const STATUS_CONFIG = {
  healthy:  { label: '✅ Saludable',     color: '#06d6a0', bg: 'rgba(6,214,160,0.10)',  border: 'rgba(6,214,160,0.30)'  },
  risk:     { label: '⚠️ En riesgo',     color: '#fbbf24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.30)' },
  optimize: { label: '🔧 Por optimizar', color: '#f9a8d4', bg: 'rgba(234,27,126,0.10)', border: 'rgba(234,27,126,0.30)' },
  locked:   { label: '🔒 Bloqueada',     color: '#8892b0', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
}

export default function PhaseSummary({ currency, phaseData }: Props) {
  return (
    <div className="dash-anim-5 mb-6 card p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
          Tus 4 fases del funnel
        </h2>
        <Link href="/dashboard/phases" style={{ fontSize: 11, color: '#f9a8d4', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Ver detalle <ArrowRight size={11} />
        </Link>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
        Cómo está rindiendo cada fase de tu funnel este mes
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PHASES.map(p => {
          const data = phaseData[p.key]
          if (!data) return null
          const cfg = STATUS_CONFIG[data.status]
          const isLocked = data.status === 'locked'
          const budgetPct = data.recommended > 0 ? Math.min(100, (data.spent / data.recommended) * 100) : 0

          return (
            <div key={p.key} style={{
              padding: '14px 18px',
              borderRadius: 14,
              background: isLocked ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${isLocked ? 'rgba(255,255,255,0.06)' : `${p.color}25`}`,
              opacity: isLocked ? 0.45 : 1,
              display: 'grid',
              gridTemplateColumns: '180px 1fr 100px 80px 130px',
              gap: 16,
              alignItems: 'center',
            }}>
              {/* Phase name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${p.color}20`, border: `1px solid ${p.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  flexShrink: 0,
                }}>{p.icon}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: p.color, lineHeight: 1.2 }}>{p.fullName}</p>
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{p.objective}</p>
                </div>
              </div>

              {/* Budget bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {currency}{data.spent.toFixed(0)} / {currency}{data.recommended.toFixed(0)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: p.color }}>
                    {budgetPct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${budgetPct}%`,
                    background: `linear-gradient(90deg, ${p.color}, ${p.color}90)`,
                    boxShadow: `0 0 8px ${p.color}50`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>{data.insight}</p>
              </div>

              {/* Conversions */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>Ventas</p>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                  {data.conversions || 0}
                </p>
              </div>

              {/* ROAS */}
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>ROAS</p>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800,
                  color: data.roas >= 3 ? '#06d6a0' : data.roas >= 1.5 ? '#fbbf24' : data.roas > 0 ? '#fca5a5' : '#8892b0',
                }}>
                  {data.roas > 0 ? `${data.roas.toFixed(1)}x` : '—'}
                </p>
              </div>

              {/* Status badge */}
              <div>
                <span style={{
                  display: 'inline-block', width: '100%', textAlign: 'center',
                  fontSize: 10, fontWeight: 700,
                  padding: '6px 10px', borderRadius: 99,
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                }}>
                  {cfg.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
