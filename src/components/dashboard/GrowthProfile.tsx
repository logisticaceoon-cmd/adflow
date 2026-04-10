'use client'
// src/components/dashboard/GrowthProfile.tsx
// Compact secondary card — level badge + top capabilities + roadmap link.
// The "what's next at level N+1" column lives in /dashboard/pixel, not here.
import Link from 'next/link'
import { Star, ArrowRight, Check } from 'lucide-react'
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
  // Up to 5 capabilities, ordered by importance
  const unlocked: string[] = []
  unlocked.push('Campañas TOFU con audiencias amplias')
  if (p.availableStrategies.includes('TOFU') || p.level >= 1) unlocked.push('Búsqueda de intereses reales en Meta')
  if (p.canRetargetVC)        unlocked.push('Retargeting de visitantes web')
  if (p.canRetargetATC)       unlocked.push('Retargeting de carrito abandonado')
  if (p.canRetargetPurchase)  unlocked.push('Retargeting de compradores')
  if (p.canCreateLookalike)   unlocked.push('Lookalike Audiences (audiencias similares)')
  if (p.availableStrategies.includes('BOFU')) unlocked.push('Estrategia BOFU completa')
  const topFive = unlocked.slice(0, 5)

  return (
    <div className="card module-enter module-enter-2" style={{ padding: 20 }}>
      <SectionHeader
        title="Perfil de crecimiento"
        action={{ label: 'Ver roadmap →', href: '/dashboard/pixel' }}
      />

      {/* Level badge + growth score inline */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 0',
        borderBottom: '1px solid var(--ds-card-border)',
        marginBottom: 14,
      }}>
        <LevelBadge level={p.level} levelName={p.levelName} size="md" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 99,
            background: 'var(--ds-color-warning-soft)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            <Star size={11} style={{ color: 'var(--ds-color-warning)' }} fill="currentColor" />
            <span style={{
              fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
              color: 'var(--ds-color-warning)',
            }}>
              {p.growthScore.toLocaleString()} pts
            </span>
          </div>
          {p.levelSinceDate && (
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 4 }}>
              Desde {new Date(p.levelSinceDate).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      </div>

      {/* Capabilities list — up to 5 */}
      <p style={{
        fontSize: 10, fontWeight: 600,
        color: 'var(--ds-color-success)',
        textTransform: 'uppercase', letterSpacing: '0.10em',
        marginBottom: 10,
      }}>
        Lo que podés hacer ahora
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
        {topFive.map((item, i) => (
          <li key={i} style={{
            fontSize: 12, color: 'var(--ds-text-primary)',
            display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
          }}>
            <Check size={12} style={{ color: 'var(--ds-color-success)', flexShrink: 0, marginTop: 2 }} strokeWidth={3} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {/* Next-level teaser as a bottom footer link */}
      {p.level < 8 && (
        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: '1px solid var(--ds-card-border)',
        }}>
          <Link href="/dashboard/pixel" style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--ds-color-primary)',
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            Ver próximo desbloqueo <ArrowRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}
