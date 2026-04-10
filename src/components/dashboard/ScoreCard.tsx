'use client'
// src/components/dashboard/ScoreCard.tsx — Growth Score with breakdown + monthly stars
import { Star } from 'lucide-react'

interface Breakdown {
  label: string
  points: number
  color: string
}

interface MonthStarDef {
  label: string
  earned: boolean
}

interface Props {
  totalScore:  number
  breakdown:   Breakdown[]
  monthStars:  MonthStarDef[]
}

export default function ScoreCard({ totalScore, breakdown, monthStars }: Props) {
  const totalBreakdown = breakdown.reduce((s, b) => s + b.points, 0)
  const earnedStars    = monthStars.filter(s => s.earned).length

  return (
    <div className="card" style={{
      padding: 24, marginBottom: 32,
      borderColor: 'rgba(245, 197, 66, 0.20)',
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600,
          color: 'var(--ds-text-primary)', letterSpacing: '-0.01em', marginBottom: 4,
        }}>
          ⭐ Tu Growth Score
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          Puntos que ganás por crecer, vender, y subir de nivel
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* ── COL 1: Big number ── */}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 4,
          }}>
            <Star size={22} style={{ color: 'var(--ds-color-warning)', fill: 'var(--ds-color-warning)' }} />
          </div>
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 44, fontWeight: 700, color: 'var(--ds-color-warning)',
            letterSpacing: '-0.04em', lineHeight: 1,
          }}>
            {totalScore.toLocaleString()}
          </p>
          <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 4 }}>puntos</p>
          <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 8, lineHeight: 1.4, maxWidth: 200, margin: '8px auto 0' }}>
            Tu score crece con cada logro, venta, y nivel alcanzado.
          </p>
        </div>

        {/* ── COL 2: Breakdown ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-warning)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            Cómo ganaste tus puntos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {breakdown.map(b => {
              const pct = totalBreakdown > 0 ? (b.points / totalBreakdown) * 100 : 0
              return (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 11, color: '#a0a8c0' }}>{b.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>+{Math.round(b.points)} pts</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: b.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── COL 3: Monthly stars ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-color-warning)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            Estrellas de este mes
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginBottom: 12 }}>
            {monthStars.map((s, i) => (
              <div key={i} title={s.label} style={{ flex: 1, textAlign: 'center', cursor: 'help' }}>
                <Star
                  size={26}
                  style={{
                    color: s.earned ? 'var(--ds-color-warning)' : '#3a3a48',
                    fill: s.earned ? 'var(--ds-color-warning)' : 'none',
                    transition: 'all 0.3s',
                  }}
                  strokeWidth={s.earned ? 0 : 1.5}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ds-color-warning)', textAlign: 'center', fontWeight: 700 }}>
            {earnedStars} / {monthStars.length} estrellas ganadas
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {monthStars.map((s, i) => (
              <li key={i} style={{ fontSize: 10, color: s.earned ? '#a0a8c0' : '#5a6478', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ color: s.earned ? 'var(--ds-color-warning)' : '#3a3a48' }}>{s.earned ? '★' : '☆'}</span>
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
