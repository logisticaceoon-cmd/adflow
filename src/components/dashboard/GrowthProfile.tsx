'use client'
// src/components/dashboard/GrowthProfile.tsx
// Growth profile card: level + capabilities now + what comes next
import Link from 'next/link'
import { Star, ArrowRight } from 'lucide-react'
import LevelBadge from './LevelBadge'

interface Props {
  level:                 number
  levelName:             string
  levelSinceDate?:       string | null
  growthScore:           number
  availableStrategies:   string[]
  canRetargetVC:         boolean
  canRetargetATC:        boolean
  canRetargetPurchase:   boolean
  canCreateLookalike:    boolean
  metricCurrent:         number
  metricRequired:        number
  metricLabel:           string
}

export default function GrowthProfile(p: Props) {
  const nextLevel = Math.min(p.level + 1, 8)
  const progressPct = p.metricRequired > 0
    ? Math.min(100, Math.round((p.metricCurrent / p.metricRequired) * 100))
    : 0

  // Build the "now unlocked" list dynamically based on capabilities
  const unlocked: string[] = []
  unlocked.push('Campañas TOFU con audiencias amplias')
  if (p.availableStrategies.includes('TOFU') || p.level >= 1) unlocked.push('Búsqueda de intereses reales en Meta')
  if (p.canRetargetVC)        unlocked.push('Retargeting de visitantes web')
  if (p.canRetargetATC)       unlocked.push('Retargeting de carrito abandonado')
  if (p.canRetargetPurchase)  unlocked.push('Retargeting de compradores')
  if (p.canCreateLookalike)   unlocked.push('Lookalike Audiences (audiencias similares)')
  if (p.availableStrategies.includes('BOFU')) unlocked.push('Estrategia BOFU completa')

  // Locked teaser based on the next level
  const lockedNext: string[] = []
  if (!p.canRetargetVC)      lockedNext.push('Retargeting de visitantes')
  if (!p.canRetargetATC)     lockedNext.push('Retargeting de carrito')
  if (!p.canRetargetPurchase) lockedNext.push('Retargeting de compradores')
  if (!p.canCreateLookalike)  lockedNext.push('Lookalike Audiences')
  if (lockedNext.length === 0) lockedNext.push('Audiencias de expansión global')
  if (lockedNext.length === 1) lockedNext.push('Más recomendaciones de IA')

  return (
    <div className="dash-anim-2 mb-6" style={{
      borderRadius: 22, padding: 2,
      background: 'linear-gradient(135deg, rgba(233,30,140,0.55), rgba(98,196,176,0.45))',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
    }}>
      <div style={{
        borderRadius: 20, padding: '24px 28px',
        background: 'linear-gradient(160deg, rgba(14,4,9,0.96) 0%, rgba(8,2,5,0.98) 100%)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="mb-5">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Tu perfil de crecimiento
          </h2>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Lo que ya podés hacer y lo que vas a desbloquear
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* ── COL 1: Level + score ── */}
          <div style={{
            padding: '20px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <div className="flex justify-center mb-3">
              <LevelBadge level={p.level} levelName={p.levelName} size="md" />
            </div>
            {p.levelSinceDate && (
              <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
                Desde {new Date(p.levelSinceDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 99,
              background: 'rgba(245,158,11,0.10)',
              border: '1px solid rgba(245,158,11,0.30)',
            }}>
              <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>
                {p.growthScore.toLocaleString()} pts
              </span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>Growth Score</p>
          </div>

          {/* ── COL 2: Unlocked now ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#06d6a0', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              ✨ Lo que podés hacer ahora
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {unlocked.slice(0, 5).map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                  <span style={{ color: '#06d6a0', flexShrink: 0, fontWeight: 700 }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── COL 3: Locked next ── */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
              🔒 Lo que viene en nivel {nextLevel}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lockedNext.slice(0, 4).map((item, i) => (
                <li key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4 }}>
                  <span style={{ color: '#fbbf24', flexShrink: 0 }}>🔒</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {p.level < 8 && p.metricRequired > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, #f59e0b, #06d6a0)' }} />
                </div>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>{progressPct}% del camino · {p.metricLabel}</p>
              </div>
            )}
            <Link href="/dashboard/pixel" style={{
              marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 600, color: '#f9a8d4', textDecoration: 'none',
            }}>
              Ver roadmap de niveles <ArrowRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
