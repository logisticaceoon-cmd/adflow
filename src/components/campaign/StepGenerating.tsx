'use client'
// Step 3: Full-screen AI loading — shows what the AI is building in real time

interface Props {
  genStep: number
  businessName: string
}

const STEPS = [
  { icon: '🔍', label: 'Analizando tu negocio y audiencia ideal...',     detail: 'Revisando perfil, historial de campañas y datos del pixel' },
  { icon: '🎯', label: 'Definiendo estrategia y targeting...',           detail: 'Eligiendo objetivo, audiencias y estructura de campaña' },
  { icon: '✍️', label: 'Escribiendo copies para cada anuncio...',         detail: 'Generando headlines, textos y CTAs optimizados' },
  { icon: '📊', label: 'Calculando presupuestos y estimaciones...',       detail: 'Distribuyendo inversión entre ad sets y proyectando resultados' },
  { icon: '✅', label: '¡Campaña lista!',                                 detail: 'Preparando tu campaña para revisión' },
]

export default function StepGenerating({ genStep, businessName }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Animated orb */}
      <div style={{
        width: 120, height: 120, borderRadius: '50%', marginBottom: 32,
        background: 'linear-gradient(135deg, rgba(79,110,247,0.3), rgba(124,58,237,0.3))',
        border: '2px solid rgba(79,110,247,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 48 }}>🤖</span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8, textAlign: 'center' }}>
        La IA está armando tu campaña
      </h2>
      <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 40, textAlign: 'center', maxWidth: 400 }}>
        {businessName
          ? `Diseñando la estrategia perfecta para ${businessName}`
          : 'Diseñando tu estrategia publicitaria personalizada'}
      </p>

      {/* Progress steps */}
      <div className="w-full max-w-md space-y-3">
        {STEPS.map((s, i) => {
          const done    = genStep > i
          const active  = genStep === i
          const pending = genStep < i

          return (
            <div key={i} className="flex items-center gap-3 transition-all" style={{
              padding: '12px 16px', borderRadius: 12,
              background: active ? 'rgba(79,110,247,0.08)' : 'transparent',
              border: active ? '1px solid rgba(79,110,247,0.2)' : '1px solid transparent',
              opacity: pending ? 0.35 : 1,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
                background: done ? 'var(--ds-color-success-soft)' : active ? 'rgba(79,110,247,0.15)' : 'var(--ds-bg-elevated)',
                border: `1px solid ${done ? 'var(--ds-color-success-border)' : active ? 'rgba(79,110,247,0.3)' : 'var(--ds-card-border)'}`,
              }}>
                {done ? '✓' : s.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--ds-color-success)' : active ? '#fff' : 'var(--ds-text-muted)' }}>
                  {s.label}
                </p>
                {active && (
                  <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 2 }}>
                    {s.detail}
                  </p>
                )}
              </div>
              {active && (
                <div className="ml-auto w-4 h-4 rounded-full border-2 border-white/20 border-t-primary animate-spin flex-shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
