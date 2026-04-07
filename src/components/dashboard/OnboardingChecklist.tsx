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
      background: 'linear-gradient(135deg, rgba(233,30,140,0.12) 0%, rgba(98,196,176,0.06) 100%)',
      border: '1px solid rgba(233,30,140,0.30)',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 50px rgba(0,0,0,0.35), 0 0 40px rgba(233,30,140,0.10)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(233,30,140,0.80), rgba(98,196,176,0.60), transparent)',
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
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
            {status.completedSteps} de {status.totalSteps} completados
          </span>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fbbf24' }}>
            {status.completionScore}%
          </span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${status.completionScore}%`,
            background: 'linear-gradient(90deg, #e91e8c, #62c4b0)',
            boxShadow: '0 0 12px rgba(233,30,140,0.45)',
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
          background: 'rgba(233,30,140,0.08)',
          border: '1px solid rgba(233,30,140,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
          marginBottom: 16,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 700, color: '#f9a8d4',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2,
            }}>
              Siguiente paso
            </p>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{next.label}</p>
          </div>
          <Link href={next.href} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
            color: '#fff', fontSize: 11, fontWeight: 800,
            padding: '9px 16px', borderRadius: 99,
            boxShadow: '0 6px 20px rgba(233,30,140,0.35)',
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
              color: step.done ? '#fff' : 'var(--muted)',
              opacity: step.done ? 1 : 0.75,
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step.done ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.04)',
                border: step.done ? '1px solid rgba(34,197,94,0.55)' : '1px solid rgba(255,255,255,0.12)',
                flexShrink: 0,
              }}>
                {step.done
                  ? <Check size={10} color="#22c55e" strokeWidth={3} />
                  : <Clock size={9} color="#8892b0" />}
              </span>
              {step.label}
            </div>
          )
        })}
      </div>

      <div style={{ textAlign: 'right' }}>
        <Link href="/dashboard/onboarding" style={{
          fontSize: 11, fontWeight: 700, color: '#fbbf24', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          Ver todos los pasos <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  )
}
