'use client'
// src/components/dashboard/OnboardingChecklist.tsx
// Compact dashboard widget that surfaces the next onboarding step.
// Hides itself entirely when the onboarding is complete.
import Link from 'next/link'
import { ArrowRight, Check, Clock } from 'lucide-react'
import type { OnboardingStatus } from '@/lib/onboarding-engine'

interface Props {
  status: OnboardingStatus
}

export default function OnboardingChecklist({ status }: Props) {
  if (status.isComplete) return null

  const next = status.nextStep ? status.steps[status.nextStep] : null

  return (
    <div className="dash-anim-1 mb-6" style={{
      position: 'relative',
      borderRadius: 20,
      padding: '24px 26px',
      background: 'linear-gradient(135deg, var(--ds-color-primary-soft) 0%, transparent 100%)',
      border: '1px solid var(--ds-color-primary-border)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.35), 0 0 40px var(--ds-color-primary-soft)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, transparent, transparent, transparent)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>🚀</span>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 17, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.01em',
        }}>
          Configurá tu sistema de crecimiento
        </h2>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-text-secondary)' }}>
            {status.completedSteps} de {status.totalSteps} completados
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ds-color-warning)' }}>
            {status.completionScore}%
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${status.completionScore}%`,
            background: 'var(--ds-color-primary)',
            boxShadow: '0 0 12px var(--ds-color-primary-border)',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Next step CTA */}
      {next && (
        <div style={{
          padding: '14px 16px',
          borderRadius: 12,
          background: 'var(--ds-color-primary-soft)',
          border: '1px solid var(--ds-color-primary-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: 'var(--ds-color-primary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
            }}>
              Siguiente paso
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{next.label}</p>
          </div>
          <Link href={next.href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--ds-color-primary)',
            color: '#fff', fontSize: 11, fontWeight: 800,
            padding: '9px 16px', borderRadius: 99,
            boxShadow: '0 6px 20px var(--ds-color-primary-border)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Completar paso <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Mini list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
        {status.stepOrder.map(key => {
          const step = status.steps[key]
          return (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11,
              color: step.done ? '#fff' : 'var(--ds-text-secondary)',
              opacity: step.done ? 1 : 0.75,
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? 'var(--ds-color-success-soft)' : 'rgba(255,255,255,0.04)',
                border: step.done ? '1px solid rgba(34,197,94,0.55)' : '1px solid rgba(255,255,255,0.12)',
                flexShrink: 0,
              }}>
                {step.done
                  ? <Check size={10} color="var(--ds-color-success)" strokeWidth={3} />
                  : <Clock size={9} color="#8892b0" />}
              </span>
              {step.label}
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'right' }}>
        <Link href="/dashboard/onboarding" style={{
          fontSize: 11, fontWeight: 700, color: 'var(--ds-color-warning)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          Ver todos los pasos <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
