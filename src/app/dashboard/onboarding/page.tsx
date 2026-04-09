// src/app/dashboard/onboarding/page.tsx
// Full guided onboarding flow. Never blocks the user — it's a guide, not a barrier.
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { calculateOnboardingStatus, type OnboardingStepKey } from '@/lib/onboarding-engine'
import { ArrowRight, Check, Lock } from 'lucide-react'

export default async function OnboardingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [fbRes, bizRes, pixelRes, budgetRes, countRes] = await Promise.all([
    supabase.from('facebook_connections').select('access_token').eq('user_id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('selected_ad_account_id, pixel_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pixel_analysis').select('level').eq('user_id', user.id).maybeSingle(),
    supabase.from('monthly_budgets').select('id').eq('user_id', user.id).limit(1),
    supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const status = calculateOnboardingStatus({
    hasFbConnection: !!fbRes.data?.access_token,
    hasAdAccount: !!bizRes.data?.selected_ad_account_id,
    hasPixel: !!bizRes.data?.pixel_id,
    pixelLevel: pixelRes.data?.level ?? null,
    hasBudget: (budgetRes.data?.length || 0) > 0,
    campaignCount: countRes.count || 0,
  })

  // The first pending step is the "current" one that gets expanded
  const currentKey: OnboardingStepKey | null = status.nextStep

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="module-enter module-enter-1 mb-8" style={{ paddingTop: 4 }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 32, fontWeight: 700, color: 'var(--ds-text-primary)',
          letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1,
        }}>
          Bienvenido a AdFlow ✨
        </h1>
        <p style={{ fontSize: 15, color: 'var(--ds-text-secondary)', marginBottom: 18, lineHeight: 1.5 }}>
          Tu sistema de crecimiento está casi listo. Seguí estos pasos para empezar a escalar tu negocio con campañas inteligentes.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, fontWeight: 700,
            padding: '6px 14px', borderRadius: 99,
            background: 'var(--ds-color-warning-soft)', color: 'var(--ds-color-warning)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            {status.completedSteps} de {status.totalSteps} completados
          </span>
          {status.isComplete && (
            <span style={{
              fontSize: 12, fontWeight: 700,
              padding: '6px 14px', borderRadius: 99,
              background: 'var(--ds-color-success-soft)', color: 'var(--ds-color-success)',
              border: '1px solid var(--ds-color-success-border)',
            }}>
              🎉 Setup completo
            </span>
          )}
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <div className="card module-enter module-enter-2 mb-8" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 12, fontWeight: 700,
            color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            Progreso general
          </span>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {status.completionScore}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div
            className="progress-bar-fill progress-animated"
            style={{ width: `${status.completionScore}%` }}
          />
        </div>
        {status.isComplete && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ds-color-success)', fontWeight: 600 }}>
            🎉 ¡Todo listo! Ya podés crear tu primera campaña.
          </p>
        )}
      </div>

      {/* ── Steps list ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {status.stepOrder.map((key, idx) => {
          const step = status.steps[key]
          const isDone = step.done
          const isCurrent = key === currentKey
          // A step is "locked" if it's not done AND it's not the current one AND a previous step is still pending
          const previousIncomplete = status.stepOrder.slice(0, idx).some(k => !status.steps[k].done)
          const isLocked = !isDone && !isCurrent && previousIncomplete

          const bg = isDone
            ? 'linear-gradient(135deg, var(--ds-color-success-soft), rgba(34,197,94,0.02))'
            : isCurrent
              ? 'linear-gradient(135deg, var(--ds-color-primary-soft), transparent)'
              : 'rgba(255,255,255,0.02)'

          const border = isDone
            ? '1px solid var(--ds-color-success-border)'
            : isCurrent
              ? '1.5px solid var(--ds-color-primary-border)'
              : '1px solid rgba(255,255,255,0.06)'

          const glow = isCurrent
            ? '0 0 32px var(--ds-color-primary-soft), 0 20px 50px rgba(0,0,0,0.30)'
            : isDone
              ? '0 0 16px var(--ds-color-success-soft)'
              : 'none'

          return (
            <div key={key} className={`card module-enter module-enter-${Math.min(3 + idx, 8)}`}
              style={{
                padding: isCurrent ? '24px 26px' : '18px 22px',
                background: bg,
                border: border,
                boxShadow: glow !== 'none' ? `${glow}, var(--ds-card-inner-glow)` : undefined,
                opacity: isLocked ? 0.45 : 1,
                transition: 'all 0.3s ease',
              }}>
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: 'linear-gradient(90deg, transparent, transparent, transparent, transparent)',
                }} />
              )}

              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Step number / status icon */}
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: '50%',
                  background: isDone
                    ? 'var(--ds-color-success-soft)'
                    : isCurrent
                      ? 'var(--ds-color-primary-soft)'
                      : 'rgba(255,255,255,0.04)',
                  border: isDone
                    ? '1.5px solid rgba(34,197,94,0.55)'
                    : isCurrent
                      ? '1.5px solid transparent'
                      : '1px solid rgba(255,255,255,0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15, fontWeight: 800,
                  color: isDone ? 'var(--ds-color-success)' : isCurrent ? 'var(--ds-color-primary)' : '#8892b0',
                }}>
                  {isDone
                    ? <Check size={18} strokeWidth={3} color="var(--ds-color-success)" />
                    : isLocked
                      ? <Lock size={14} color="#8892b0" />
                      : idx + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: isCurrent ? 17 : 15, fontWeight: 700,
                      color: '#fff', letterSpacing: '-0.01em',
                    }}>
                      {step.label}
                    </h3>
                    {isDone && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99,
                        background: 'var(--ds-color-success-soft)', color: 'var(--ds-color-success)',
                        border: '1px solid var(--ds-color-success-border)',
                      }}>
                        ✓ Completado
                      </span>
                    )}
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 99,
                        background: 'var(--ds-color-primary-soft)', color: 'var(--ds-color-primary)',
                        border: '1px solid var(--ds-color-primary-border)',
                      }}>
                        ← Próximo paso
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontSize: 13, color: 'var(--ds-text-secondary)', lineHeight: 1.5,
                    marginBottom: isCurrent ? 16 : 0,
                  }}>
                    {step.description}
                  </p>

                  {isCurrent && (
                    <>
                      <div style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        marginBottom: 16,
                      }}>
                        <p style={{
                          fontSize: 10, fontWeight: 700, color: 'var(--ds-color-warning)',
                          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
                        }}>
                          ¿Por qué importa?
                        </p>
                        <p style={{ fontSize: 13, color: '#e8eaf0', lineHeight: 1.55 }}>{step.why}</p>
                      </div>
                      <Link href={step.href} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'var(--ds-color-primary)',
                        color: '#fff', fontSize: 13, fontWeight: 800,
                        padding: '11px 22px', borderRadius: 99,
                        boxShadow: '0 8px 24px var(--ds-color-primary-border), 0 0 24px var(--ds-color-primary-soft)',
                        textDecoration: 'none',
                      }}>
                        {step.label} <ArrowRight size={14} />
                      </Link>
                    </>
                  )}

                  {isLocked && (
                    <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', fontStyle: 'italic', marginTop: 4 }}>
                      Requiere completar los pasos anteriores
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Celebration card when everything is done ──────────────────── */}
      {status.isComplete && (
        <div className="card module-enter module-enter-8 mt-8" style={{
          padding: '36px 32px',
          borderColor: 'var(--ds-color-success-border)',
          boxShadow: 'var(--ds-shadow-md), 0 0 60px rgba(52, 211, 153, 0.14), var(--ds-card-inner-glow)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 44, marginBottom: 12 }}>🎉</p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            ¡Tu sistema de crecimiento está listo!
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.55, marginBottom: 24, maxWidth: 560, margin: '0 auto 24px' }}>
            Tu negocio está configurado y listo para crecer. AdFlow va a analizar tu pixel, recomendar estrategias, crear audiencias inteligentes, y guiarte mes a mes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              padding: '12px 22px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.15)',
              textDecoration: 'none',
            }}>
              Ir al dashboard <ArrowRight size={14} />
            </Link>
            <Link href="/dashboard/create" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--ds-color-success)',
              color: '#fff', fontSize: 13, fontWeight: 800,
              padding: '12px 22px', borderRadius: 99,
              boxShadow: '0 8px 24px var(--ds-color-success-border)',
              textDecoration: 'none',
            }}>
              Crear primera campaña <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
