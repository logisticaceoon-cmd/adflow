// src/app/dashboard/labs/page.tsx
// AdFlow Labs — showcase of upcoming features with a visual roadmap.
// Server component; the "Notify me" interaction lives in a small client child.
import SectionHeader from '@/components/ui/SectionHeader'
import NotifyMeButton from '@/components/labs/NotifyMeButton'

type FeatureStatus = 'coming_soon' | 'in_development' | 'beta'

interface FutureFeature {
  id: string
  icon: string
  title: string
  tagline: string
  status: FeatureStatus
  description: string
  benefits: string[]
  tech: string
}

const STATUS_BADGE: Record<FeatureStatus, { label: string; bg: string; color: string; border: string }> = {
  coming_soon: {
    label: 'Próximamente',
    bg: 'var(--ds-color-warning-soft)',
    color: 'var(--ds-color-warning)',
    border: 'var(--ds-color-warning-border)',
  },
  in_development: {
    label: 'En desarrollo',
    bg: 'var(--ds-color-primary-soft)',
    color: 'var(--ds-color-primary)',
    border: 'var(--ds-color-primary-border)',
  },
  beta: {
    label: 'Beta',
    bg: 'var(--ds-color-success-soft)',
    color: 'var(--ds-color-success)',
    border: 'var(--ds-color-success-border)',
  },
}

const FEATURES: FutureFeature[] = [
  {
    id: 'ai_strategist',
    icon: '🧠',
    title: 'Estratega IA Conversacional',
    tagline: 'Tu consultor digital 24/7',
    status: 'coming_soon',
    description:
      'Hablá con tu estratega digital en tiempo real. Preguntale qué hacer con tus campañas, pedile que analice tu rendimiento o que te ayude a planificar el próximo mes.',
    benefits: [
      'Reemplaza horas de análisis manual',
      'Respuestas basadas en TUS datos reales',
      'Estrategia personalizada 24/7',
    ],
    tech: 'Claude AI + contexto completo de tu negocio, pixel, campañas y métricas.',
  },
  {
    id: 'auto_scaling',
    icon: '⚡',
    title: 'Escalado Autónomo de Campañas',
    tagline: 'Decisiones que no esperan',
    status: 'in_development',
    description:
      'El sistema escala y pausa campañas automáticamente basándose en reglas inteligentes y evaluación de riesgo en tiempo real.',
    benefits: [
      'Escalar cuando el momento es óptimo',
      'Pausar antes de perder dinero',
      'Decisiones 24/7 sin intervención manual',
    ],
    tech: 'Automation Engine + Scaling Evaluator + Risk Engine ya implementados. Solo falta activar ejecución automática.',
  },
  {
    id: 'creative_intelligence',
    icon: '🎨',
    title: 'Inteligencia de Creativos',
    tagline: 'Qué funciona, qué no, por qué',
    status: 'coming_soon',
    description:
      'Analizá tus imágenes y videos con IA para detectar qué funciona, qué no, y qué patrones tienen tus creativos ganadores.',
    benefits: [
      'Saber qué tipo de creativo convierte más',
      'Detectar fatiga de creativos',
      'Sugerencias de mejora automáticas',
    ],
    tech: 'Claude Vision + correlación de rendimiento con métricas de Meta.',
  },
]

interface RoadmapItem {
  quarter: string
  title: string
  status: 'near' | 'mid' | 'far'
}

const ROADMAP: RoadmapItem[] = [
  { quarter: 'Q2 2026', title: 'AI Strategist Chat (Beta)',       status: 'near' },
  { quarter: 'Q3 2026', title: 'Auto-Scaling Autónomo',           status: 'mid' },
  { quarter: 'Q3 2026', title: 'Creative Intelligence',           status: 'mid' },
  { quarter: 'Q4 2026', title: 'Industry Benchmarks',             status: 'far' },
  { quarter: 'Q4 2026', title: 'Multi-channel (TikTok, Google)',  status: 'far' },
]

export default function LabsPage() {
  return (
    <div>
      {/* ─── HERO ────────────────────────────────────────────────── */}
      <div
        className="card module-enter module-enter-1"
        style={{
          position: 'relative',
          padding: '40px 44px',
          marginBottom: 48,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'var(--ds-color-primary-soft)',
            border: '1px solid var(--ds-color-primary-border)',
            marginBottom: 18,
          }}
        >
          <span style={{ fontSize: 12 }}>🔬</span>
          <span
            style={{
              fontSize: 10, fontWeight: 700, color: 'var(--ds-color-primary)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            Beta & Coming Soon
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 28, fontWeight: 700,
            color: 'var(--ds-text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 12,
            lineHeight: 1.2,
          }}
        >
          🔬 AdFlow Labs
        </h1>
        <p
          style={{
            fontSize: 14, lineHeight: 1.6,
            color: 'var(--ds-text-secondary)',
            maxWidth: 620,
          }}
        >
          Funcionalidades en desarrollo que van a transformar cómo gestionás tu negocio.
          Probá las betas y sé el primero en acceder.
        </p>
      </div>

      {/* ─── 3 FEATURE CARDS ─────────────────────────────────────── */}
      <div style={{ marginBottom: 48 }}>
        <SectionHeader
          title="Próximas funcionalidades"
          subtitle="En desarrollo activo — estas son las capacidades que vienen"
        />

        <div className="ds-grid-3">
          {FEATURES.map((f, i) => {
            const badge = STATUS_BADGE[f.status]
            return (
              <div
                key={f.id}
                className={`card labs-card module-enter module-enter-${i + 2}`}
                style={{
                  padding: 'var(--ds-space-lg)',
                  display: 'flex', flexDirection: 'column', gap: 16,
                }}
              >
                {/* Icon + badge */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: 'var(--ds-color-primary-soft)',
                      border: '1px solid var(--ds-color-primary-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 28, lineHeight: 1,
                      boxShadow: '0 0 24px var(--ds-color-primary-glow)',
                    }}
                  >
                    {f.icon}
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '5px 12px', borderRadius: 99,
                      background: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Title + tagline */}
                <div>
                  <h3
                    style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: 18, fontWeight: 700,
                      color: 'var(--ds-text-primary)',
                      letterSpacing: '-0.01em',
                      marginBottom: 4,
                      lineHeight: 1.25,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 11, fontWeight: 600,
                      color: 'var(--ds-color-primary)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}
                  >
                    {f.tagline}
                  </p>
                </div>

                {/* Description */}
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--ds-text-secondary)',
                    lineHeight: 1.6,
                  }}
                >
                  {f.description}
                </p>

                {/* Benefits */}
                <div>
                  <p
                    style={{
                      fontSize: 10, fontWeight: 700,
                      color: 'var(--ds-text-label)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 6,
                    }}
                  >
                    ¿Qué resuelve?
                  </p>
                  <ul
                    style={{
                      listStyle: 'none', padding: 0, margin: 0,
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    {f.benefits.map((b, j) => (
                      <li
                        key={j}
                        style={{
                          fontSize: 12, color: 'var(--ds-text-primary)',
                          display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--ds-color-success)',
                            flexShrink: 0,
                            marginTop: 1,
                          }}
                        >
                          ✓
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tech */}
                <div
                  style={{
                    paddingTop: 12,
                    borderTop: '1px solid var(--ds-card-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--ds-text-label)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: 4,
                    }}
                  >
                    Tecnología
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: 'var(--ds-text-muted)',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                    }}
                  >
                    {f.tech}
                  </p>
                </div>

                {/* Notify button (client child) */}
                <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                  <NotifyMeButton featureId={f.id} featureName={f.title} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── ROADMAP TIMELINE ────────────────────────────────────── */}
      <div className="module-enter module-enter-6" style={{ marginBottom: 32 }}>
        <SectionHeader
          title="Roadmap 2026"
          subtitle="Qué estamos construyendo y cuándo va a estar listo"
        />

        <div
          className="card"
          style={{
            padding: 'var(--ds-space-xl)',
          }}
        >
          <div style={{ position: 'relative' }}>
            {/* Connecting line */}
            <div
              style={{
                position: 'absolute',
                top: 11,
                left: 11,
                right: 11,
                height: 2,
                background:
                  'linear-gradient(90deg, var(--ds-color-primary) 0%, var(--ds-card-border) 30%, var(--ds-card-border) 100%)',
                zIndex: 0,
              }}
            />

            {/* Dots + labels */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
                zIndex: 1,
              }}
            >
              {ROADMAP.map((item, i) => {
                const color =
                  item.status === 'near'
                    ? 'var(--ds-color-primary)'
                    : item.status === 'mid'
                      ? 'var(--ds-color-primary-soft)'
                      : 'var(--ds-bg-elevated)'
                const borderColor =
                  item.status === 'near'
                    ? 'var(--ds-color-primary)'
                    : 'var(--ds-card-border)'
                const textColor =
                  item.status === 'near'
                    ? 'var(--ds-text-primary)'
                    : 'var(--ds-text-muted)'
                const quarterColor =
                  item.status === 'near'
                    ? 'var(--ds-color-primary)'
                    : 'var(--ds-text-muted)'

                return (
                  <div
                    key={i}
                    style={{
                      flex: 1, minWidth: 120,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: color,
                        border: `2px solid ${borderColor}`,
                        marginBottom: 12,
                        boxShadow:
                          item.status === 'near'
                            ? '0 0 16px var(--ds-color-primary-glow)'
                            : 'none',
                      }}
                    />
                    <p
                      style={{
                        fontSize: 10, fontWeight: 700,
                        color: quarterColor,
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                        marginBottom: 4,
                      }}
                    >
                      {item.quarter}
                    </p>
                    <p
                      style={{
                        fontSize: 12, fontWeight: 500,
                        color: textColor,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <p
          style={{
            marginTop: 14,
            fontSize: 11,
            color: 'var(--ds-text-muted)',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Las fechas pueden moverse según la prioridad del feedback de usuarios activos.
        </p>
      </div>
    </div>
  )
}
