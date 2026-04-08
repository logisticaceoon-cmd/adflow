'use client'
// src/components/dashboard/OnboardingChecklist.tsx
// Compact setup widget. Shown only when setup is incomplete.
// Does NOT compete with hero or GPS — max ~140px tall, neutral background.
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
    <div className="dash-anim-3" style={{
      marginBottom: 24,
      padding: '16px 20px',
      borderRadius: 'var(--ds-card-radius)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 10, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 14, fontWeight: 600, color: 'var(--ds-text-primary)',
          }}>
            Setup
          </h3>
          <span style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>
            {status.completedSteps}/{status.totalSteps} completados
          </span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, color: 'var(--ds-color-primary)',
        }}>
          {status.completionScore}%
        </span>
      </div>

      {/* Thin progress bar */}
      <div style={{
        height: 6, borderRadius: 99,
        background: 'rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <div
          className="progress-bar-fill"
          style={{
            height: '100%', width: `${status.completionScore}%`,
            background: 'var(--ds-color-primary)',
            borderRadius: 99,
          }}
        />
      </div>

      {/* Bottom row — mini-list + CTA link */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{
          display: 'flex', gap: 4, rowGap: 6, flexWrap: 'wrap',
          fontSize: 12, alignItems: 'center',
        }}>
          {status.stepOrder.slice(0, 6).map(key => {
            const step = status.steps[key]
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '3px 10px',
                borderRadius: 99,
                background: step.done ? 'var(--ds-color-success-soft)' : 'rgba(255,255,255,0.03)',
                border: step.done ? '1px solid var(--ds-color-success-border)' : '1px solid var(--ds-card-border)',
                color: step.done ? 'var(--ds-color-success)' : 'var(--ds-text-muted)',
              }}>
                {step.done
                  ? <Check size={10} color="var(--ds-color-success)" strokeWidth={3} />
                  : <Clock size={9} color="var(--ds-text-muted)" />}
                <span style={{ fontSize: 11, whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {step.label.replace(/^(Conectar|Seleccionar|Configurar|Analizar|Definir|Crear) /, '')}
                </span>
              </div>
            )
          })}
        </div>

        {next && (
          <Link href={next.href} style={{
            fontSize: 12, fontWeight: 600,
            color: 'var(--ds-color-primary)',
            textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap',
          }}>
            Siguiente paso <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  )
}
