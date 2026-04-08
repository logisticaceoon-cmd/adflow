// src/app/dashboard/strategist/page.tsx
// Premium "coming soon" screen for the AI Strategist (Phase 4 module).
import Link from 'next/link'
import { ArrowRight, Brain, Zap, TrendingUp, Image as ImageIcon, BarChart3 } from 'lucide-react'

const CAPABILITIES: Array<{ icon: string; text: string }> = [
  { icon: '🎯', text: 'Analizar tus campañas y sugerir optimizaciones específicas' },
  { icon: '🧠', text: 'Recomendar estrategias basadas en tus datos reales, no en teoría' },
  { icon: '💬', text: 'Responder cualquier pregunta sobre marketing y crecimiento' },
  { icon: '📋', text: 'Crear planes de acción personalizados según tu nivel actual' },
  { icon: '🔮', text: 'Predecir resultados basándose en tendencias históricas' },
  { icon: '🎓', text: 'Explicarte el por qué de cada métrica y cómo mejorarla' },
]

const UPCOMING: Array<{ Icon: any; title: string; desc: string; color: string }> = [
  { Icon: Zap,         title: 'Auto-scaling con reglas',  desc: 'Reglas automáticas que escalan o pausan campañas según ROAS, CPA, frecuencia', color: 'var(--ds-color-warning)' },
  { Icon: TrendingUp,  title: 'Forecast mensual',         desc: 'Proyección de spend, revenue y conversiones para el próximo mes',           color: 'var(--ds-color-success)' },
  { Icon: ImageIcon,   title: 'Análisis de creativos IA', desc: 'Scoring de atención, claridad, emoción y fuerza del CTA en cada creativo',   color: '#a855f7' },
  { Icon: BarChart3,   title: 'Benchmarks de tu nicho',   desc: 'Comparación de tus métricas contra el promedio de tu industria y país',     color: '#3b82f6' },
]

export default function StrategistPage() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header */}
      <div className="dash-anim-1 mb-6">
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#c4b5fd', marginBottom: 10,
        }}>
          Estratega IA · AdFlow
        </p>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 32, fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em', marginBottom: 10, lineHeight: 1.1,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          🧠 Tu consultor de growth
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ds-text-secondary)', lineHeight: 1.55, maxWidth: 620 }}>
          Un estratega digital con IA, disponible 24/7, que conoce cada métrica, cada campaña y cada decisión que tomaste. Listo para ayudarte a crecer.
        </p>
      </div>

      {/* ─── Main "coming soon" card ─────────────────────────────── */}
      <div className="dash-anim-2 mb-8" style={{
        position: 'relative',
        padding: '36px 34px',
        borderRadius: 24,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, var(--ds-color-primary-soft) 50%, transparent 100%)',
        border: '1.5px solid rgba(168,85,247,0.40)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.50), 0 0 60px rgba(168,85,247,0.18), 0 0 100px var(--ds-color-primary-soft)',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.90), transparent, transparent, transparent)',
        }} />

        {/* Floating orbs */}
        <div style={{
          position: 'absolute', top: -50, right: -30, width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.25), transparent 70%)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -40, left: -20, width: 150, height: 150,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--ds-color-primary-soft), transparent 70%)',
          filter: 'blur(36px)', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 99,
            background: 'rgba(168,85,247,0.18)',
            border: '1px solid rgba(168,85,247,0.55)',
            boxShadow: '0 0 20px rgba(168,85,247,0.30)',
            marginBottom: 18,
          }}>
            <span style={{ fontSize: 14 }}>🔮</span>
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#c4b5fd',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Próximamente
            </span>
          </div>

          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 26, fontWeight: 800, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.15,
          }}>
            Un estratega que entiende tu negocio
          </h2>

          <p style={{ fontSize: 13, color: '#e8eaf0', lineHeight: 1.6, marginBottom: 22, maxWidth: 640 }}>
            El Estratega IA va a tener acceso completo al estado de tu negocio — pixel, campañas, presupuesto, logros, y nivel — para darte respuestas personalizadas basadas en tu situación real. No sugerencias genéricas.
          </p>

          <div style={{
            padding: '20px 22px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 24,
          }}>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 11, fontWeight: 800, color: '#c4b5fd',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
            }}>
              Qué va a poder hacer
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {CAPABILITIES.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
                  <p style={{ fontSize: 12.5, color: '#e8eaf0', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
            Estamos trabajando en esto. Mientras tanto, usá las recomendaciones del dashboard y los reportes mensuales con análisis IA — ya tenés bastante inteligencia a mano.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/dashboard" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff', fontSize: 13, fontWeight: 800,
              padding: '12px 22px', borderRadius: 99,
              boxShadow: '0 10px 28px rgba(168,85,247,0.40), 0 0 24px rgba(168,85,247,0.20)',
              textDecoration: 'none',
            }}>
              Ver recomendaciones actuales <ArrowRight size={14} />
            </Link>
            <Link href="/dashboard/reports" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.05)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              padding: '12px 22px', borderRadius: 99,
              border: '1px solid rgba(255,255,255,0.12)',
              textDecoration: 'none',
            }}>
              Ver reportes mensuales
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Upcoming modules ────────────────────────────────────── */}
      <div className="dash-anim-3">
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16, fontWeight: 700, color: '#fff',
          marginBottom: 4,
        }}>
          También próximamente
        </h3>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 18 }}>
          La arquitectura ya está preparada — las tablas, los tipos y los stubs de los motores están en el repo esperando implementación.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {UPCOMING.map(({ Icon, title, desc, color }, i) => (
            <div key={i} style={{
              padding: '18px 20px',
              borderRadius: 16,
              background: `linear-gradient(135deg, ${color}10, ${color}04)`,
              border: `1px solid ${color}35`,
              boxShadow: `0 0 24px ${color}10`,
            }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 12,
                background: `${color}15`,
                border: `1px solid ${color}45`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Icon size={18} color={color} strokeWidth={2} />
              </div>
              <p style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 13, fontWeight: 800, color: '#fff',
                marginBottom: 4,
              }}>
                {title}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
