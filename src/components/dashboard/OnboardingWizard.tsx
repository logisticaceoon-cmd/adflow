'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Plug, Building2, Sparkles, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    icon: Plug,
    title: 'Conectá tu cuenta de Facebook',
    desc: 'Vinculá tu cuenta publicitaria para poder publicar campañas directamente desde AdFlow.',
    action: { label: 'Conectar Facebook →', href: '/api/auth/facebook', external: true },
    color: '#1877f2',
  },
  {
    icon: Building2,
    title: 'Completá tu perfil de negocio',
    desc: 'Agregá la info de tu negocio: nombre, industria, colores y tono. La IA usa estos datos para generar mejores copies.',
    action: { label: 'Completar perfil →', href: '/dashboard/settings', external: false },
    color: '#e91e8c',
  },
  {
    icon: Sparkles,
    title: 'Creá tu primera campaña con IA',
    desc: 'Describí tu producto y en 20 segundos la IA genera headlines, textos y audiencias optimizadas.',
    action: { label: 'Crear campaña →', href: '/dashboard/create', external: false },
    color: '#06d6a0',
  },
]

interface Props { show: boolean }

export default function OnboardingWizard({ show }: Props) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!show) return
    const dismissed = localStorage.getItem('adflow_onboarding_dismissed')
    if (!dismissed) setVisible(true)
  }, [show])

  function dismiss() {
    localStorage.setItem('adflow_onboarding_dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  const current = STEPS[step]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
           style={{ background: 'rgba(18,4,10,0.97)', border: '1px solid rgba(98,196,176,0.18)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
              Primeros pasos · {step + 1} / {STEPS.length}
            </p>
            <h2 className="text-lg font-bold mt-0.5">Bienvenido a AdFlow 🚀</h2>
          </div>
          <button onClick={dismiss}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: 'var(--muted)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-2 px-6 pb-5">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 rounded-full flex-1 transition-all"
                 style={{ background: i <= step ? 'var(--accent)' : 'rgba(98,196,176,0.20)' }} />
          ))}
        </div>

        {/* Step content */}
        <div className="px-6 pb-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl mb-6"
               style={{ background: 'rgba(18,4,10,0.92)', border: '1px solid rgba(98,196,176,0.18)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: `${current.color}18`, border: `1px solid ${current.color}30` }}>
              <Icon size={22} style={{ color: current.color }} strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] mb-1">{current.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{current.desc}</p>
            </div>
          </div>

          {/* Completed steps */}
          {step > 0 && (
            <div className="space-y-2 mb-5">
              {STEPS.slice(0, step).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--accent3)' }}>
                  <CheckCircle2 size={14} /> {s.title}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {current.action.external ? (
              <a href={current.action.href} className="btn-primary flex-1 justify-center text-[13px]">
                {current.action.label}
              </a>
            ) : (
              <Link href={current.action.href} onClick={dismiss}
                className="btn-primary flex-1 justify-center text-[13px]">
                {current.action.label}
              </Link>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="btn-ghost text-[13px] px-4">
                Saltar
              </button>
            ) : (
              <button onClick={dismiss} className="btn-ghost text-[13px] px-4">
                Empezar
              </button>
            )}
          </div>

          <button onClick={dismiss}
            className="w-full mt-3 text-xs text-center py-1 transition-opacity hover:opacity-80"
            style={{ color: '#8892b0' }}>
            Recordarme después
          </button>
        </div>
      </div>
    </div>
  )
}
