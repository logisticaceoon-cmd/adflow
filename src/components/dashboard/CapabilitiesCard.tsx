'use client'
// src/components/dashboard/CapabilitiesCard.tsx
// Two-column card: what the user can do now vs what they will unlock at the next level

interface Capability {
  icon: string
  title: string
  description: string
}

const ALL_CAPS: Array<Capability & { level: number }> = [
  { level: 1, icon: '📢', title: 'Campañas TOFU',                    description: 'Audiencias frías, alcance amplio' },
  { level: 1, icon: '🎯', title: 'Búsqueda de intereses reales',     description: 'IDs de Meta, no nombres genéricos' },
  { level: 3, icon: '🔁', title: 'Retargeting de visitantes',         description: 'Volver a impactar a quien visitó tu web' },
  { level: 4, icon: '🛒', title: 'Retargeting de carrito',            description: 'Recuperar carritos abandonados' },
  { level: 5, icon: '💳', title: 'Retargeting de compradores',        description: 'Reactivar a quienes ya compraron' },
  { level: 5, icon: '📊', title: 'Estrategia BOFU',                   description: 'Optimizar para conversiones directas' },
  { level: 6, icon: '🔮', title: 'Lookalike Audiences (LAL)',         description: 'Audiencias similares a tus compradores' },
  { level: 7, icon: '🌐', title: 'Lookalikes ampliados (5-10%)',      description: 'Expandir a audiencias parecidas más amplias' },
  { level: 8, icon: '🚀', title: 'Expansión global',                  description: 'Múltiples mercados y audiencias premium' },
]

interface Props {
  level: number
}

export default function CapabilitiesCard({ level }: Props) {
  const unlocked = ALL_CAPS.filter(c => c.level <= level)
  const lockedNextLevel = level + 1
  const upcoming = ALL_CAPS.filter(c => c.level === lockedNextLevel)
  const futureLocked = ALL_CAPS.filter(c => c.level > lockedNextLevel)

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* ── Unlocked ── */}
      <div className="card p-5" style={{ borderLeft: '3px solid #06d6a0' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            ✨ Lo que ya podés hacer
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 99,
            background: 'rgba(6,214,160,0.10)', color: '#06d6a0',
            border: '1px solid rgba(6,214,160,0.30)',
          }}>
            {unlocked.length} desbloqueadas
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
          Herramientas activas para tu nivel actual
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {unlocked.map((cap, i) => (
            <li key={i} style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(6,214,160,0.05)',
              border: '1px solid rgba(6,214,160,0.15)',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{cap.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                  {cap.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {cap.description}
                </p>
              </div>
              <span style={{ color: '#06d6a0', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>✓</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Locked / next ── */}
      <div className="card p-5" style={{ borderLeft: '3px solid #fbbf24' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff' }}>
            🔒 Lo que viene
          </h2>
          <span style={{
            fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 99,
            background: 'rgba(245,158,11,0.10)', color: '#fbbf24',
            border: '1px solid rgba(245,158,11,0.30)',
          }}>
            {upcoming.length + futureLocked.length} bloqueadas
          </span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 14 }}>
          Lo que vas a desbloquear conforme subas de nivel
        </p>

        {upcoming.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6 }}>
              En el próximo nivel ({lockedNextLevel})
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.map((cap, i) => (
                <li key={i} style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(245,158,11,0.05)',
                  border: '1px dashed rgba(245,158,11,0.30)',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  opacity: 0.85,
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{cap.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 2 }}>
                      {cap.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 }}>
                      {cap.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {futureLocked.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6 }}>
              Más adelante
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {futureLocked.slice(0, 4).map((cap, i) => (
                <li key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, opacity: 0.5 }}>{cap.icon}</span>
                  <span>{cap.title}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--muted)' }}>Nv {cap.level}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
