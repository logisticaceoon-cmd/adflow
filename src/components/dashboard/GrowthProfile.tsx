'use client'
// src/components/dashboard/GrowthProfile.tsx
// Growth profile card: level + capabilities now + what comes next
// Migrated to unified design system.
import Link from 'next/link'
import { Star, ArrowRight, Check, Lock } from 'lucide-react'
import LevelBadge from './LevelBadge'
import SectionHeader from '@/components/ui/SectionHeader'

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

  const unlocked: string[] = []
  unlocked.push('Campañas TOFU con audiencias amplias')
  if (p.availableStrategies.includes('TOFU') || p.level >= 1) unlocked.push('Búsqueda de intereses reales en Meta')
  if (p.canRetargetVC)        unlocked.push('Retargeting de visitantes web')
  if (p.canRetargetATC)       unlocked.push('Retargeting de carrito abandonado')
  if (p.canRetargetPurchase)  unlocked.push('Retargeting de compradores')
  if (p.canCreateLookalike)   unlocked.push('Lookalike Audiences (audiencias similares)')
  if (p.availableStrategies.includes('BOFU')) unlocked.push('Estrategia BOFU completa')

  const lockedNext: string[] = []
  if (!p.canRetargetVC)       lockedNext.push('Retargeting de visitantes')
  if (!p.canRetargetATC)      lockedNext.push('Retargeting de carrito')
  if (!p.canRetargetPurchase) lockedNext.push('Retargeting de compradores')
  if (!p.canCreateLookalike)  lockedNext.push('Lookalike Audiences')
  if (lockedNext.length === 0) lockedNext.push('Audiencias de expansión global')
  if (lockedNext.length === 1) lockedNext.push('Más recomendaciones de IA')

  return (
    <div className="dash-anim-2" style={{
      marginBottom: 'var(--ds-space-lg)',
      borderRadius: 'var(--ds-card-radius)',
      padding: 'var(--ds-space-lg)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      <SectionHeader
        title="Tu perfil de crecimiento"
        subtitle="Lo que ya podés hacer y lo que vas a desbloquear"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COL 1: Level + score */}
        <div style={{
          padding: 'var(--ds-space-lg)',
          borderRadius: 'var(--ds-card-radius-sm)',
          background: 'var(--ds-bg-elevated)',
          border: '1px solid var(--ds-card-border)',
          textAlign: 'center',
        }}>
          <div className="flex justify-center mb-3">
            <LevelBadge level={p.level} levelName={p.levelName} size="md" />
          </div>
          {p.levelSinceDate && (
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginBottom: 12 }}>
              Desde {new Date(p.levelSinceDate).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 99,
            background: 'var(--ds-color-warning-soft)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            <Star size={13} style={{ color: 'var(--ds-color-warning)' }} fill="currentColor" />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 800,
              color: 'var(--ds-color-warning)',
            }}>
              {p.growthScore.toLocaleString()} pts
            </span>
          </div>
          <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 6 }}>Growth Score</p>
        </div>

        {/* COL 2: Unlocked now */}
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700,
            color: 'var(--ds-color-success)',
            textTransform: 'uppercase', letterSpacing: '0.10em',
            marginBottom: 12,
          }}>
            ✨ Lo que podés hacer ahora
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {unlocked.slice(0, 5).map((item, i) => (
              <li key={i} style={{
                fontSize: 12, color: 'var(--ds-text-primary)',
                display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
              }}>
                <Check size={13} style={{ color: 'var(--ds-color-success)', flexShrink: 0, marginTop: 1 }} strokeWidth={3} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* COL 3: Locked next */}
        <div>
          <p style={{
            fontSize: 10, fontWeight: 700,
            color: 'var(--ds-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.10em',
            marginBottom: 12,
          }}>
            🔒 Lo que viene en nivel {nextLevel}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lockedNext.slice(0, 4).map((item, i) => (
              <li key={i} style={{
                fontSize: 12, color: 'var(--ds-text-secondary)',
                display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
              }}>
                <Lock size={11} style={{ color: 'var(--ds-text-muted)', flexShrink: 0, marginTop: 2 }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {p.level < 8 && p.metricRequired > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--ds-color-primary)' }} />
              </div>
              <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>{progressPct}% del camino · {p.metricLabel}</p>
            </div>
          )}
          <Link href="/dashboard/pixel" style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600,
            color: 'var(--ds-color-primary)',
            textDecoration: 'none',
          }}>
            Ver roadmap de niveles <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}
