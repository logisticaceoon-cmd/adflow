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
    <div className="card p-6 mb-6" style={{
      background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(234,27,126,0.04) 100%)',
      border: '1px solid rgba(245,158,11,0.18)',
    }}>
      <div className="mb-5">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          ⭐ Tu Growth Score
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
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
            <Star size={22} style={{ color: '#fbbf24', fill: '#fbbf24', filter: 'drop-shadow(0 0 8px #f59e0b)' }} />
          </div>
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 48, fontWeight: 900, color: '#fbbf24',
            letterSpacing: '-0.04em', lineHeight: 1,
            textShadow: '0 0 32px rgba(245,158,11,0.45)',
          }}>
            {totalScore.toLocaleString()}
          </p>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>puntos</p>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, lineHeight: 1.4, maxWidth: 200, margin: '8px auto 0' }}>
            Tu score crece con cada logro, venta, y nivel alcanzado.
          </p>
        </div>

        {/* ── COL 2: Breakdown ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
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
                  <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: `linear-gradient(90deg, ${b.color}, ${b.color}aa)`,
                      boxShadow: `0 0 8px ${b.color}50`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── COL 3: Monthly stars ── */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            Estrellas de este mes
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginBottom: 12 }}>
            {monthStars.map((s, i) => (
              <div key={i} title={s.label} style={{ flex: 1, textAlign: 'center', cursor: 'help' }}>
                <Star
                  size={26}
                  style={{
                    color: s.earned ? '#fbbf24' : '#3a3a48',
                    fill: s.earned ? '#fbbf24' : 'none',
                    filter: s.earned ? 'drop-shadow(0 0 8px rgba(245,158,11,0.70))' : 'none',
                    transition: 'all 0.3s',
                  }}
                  strokeWidth={s.earned ? 0 : 1.5}
                />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#fbbf24', textAlign: 'center', fontWeight: 700 }}>
            {earnedStars} / {monthStars.length} estrellas ganadas
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {monthStars.map((s, i) => (
              <li key={i} style={{ fontSize: 10, color: s.earned ? '#a0a8c0' : '#5a6478', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ color: s.earned ? '#fbbf24' : '#3a3a48' }}>{s.earned ? '★' : '☆'}</span>
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
