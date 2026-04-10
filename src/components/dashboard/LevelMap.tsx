'use client'
// src/components/dashboard/LevelMap.tsx — videogame-style level path
import { useState } from 'react'

interface LevelDef {
  level: number
  name: string
  emoji: string
  color: string
  requirement: string
  unlocks: string[]
}

// Hex so alpha suffixes (`${lv.color}40`) produce valid rgba strings.
const LEVELS: LevelDef[] = [
  { level: 0, name: 'Sin Data',     emoji: '🌑', color: '#8892b0', requirement: 'Instalá tu pixel',                    unlocks: ['Medición básica de visitantes'] },
  { level: 1, name: 'Explorador',   emoji: '🌱', color: '#f87171', requirement: '100+ PageView en 30 días',            unlocks: ['Audiencias por intereses'] },
  { level: 2, name: 'Aprendiz',     emoji: '📚', color: '#f87171', requirement: '500+ PageView en 30 días',            unlocks: ['Mejor optimización del pixel'] },
  { level: 3, name: 'Estratega',    emoji: '🧠', color: '#fbbf24', requirement: '1.000+ ViewContent en 30 días',       unlocks: ['Retargeting de visitantes', 'Estrategia MOFU'] },
  { level: 4, name: 'Vendedor',     emoji: '🛒', color: '#fbbf24', requirement: '100+ AddToCart en 30 días',           unlocks: ['Retargeting de carrito abandonado'] },
  { level: 5, name: 'Profesional',  emoji: '💼', color: '#34d399', requirement: '50+ Purchases en 30 días',            unlocks: ['Retargeting de compradores', 'Estrategia BOFU'] },
  { level: 6, name: 'Escalador',    emoji: '🚀', color: '#34d399', requirement: '100+ Purchases en 30 días',           unlocks: ['Lookalike Audiences'] },
  { level: 7, name: 'Maestro',      emoji: '👑', color: '#2dd4a8', requirement: '500+ Purchases en 180 días',          unlocks: ['Lookalikes ampliados', 'Audiencias premium'] },
  { level: 8, name: 'Imperio',      emoji: '🏰', color: '#a78bfa', requirement: '1.000+ Purchases en 180 días',        unlocks: ['Expansión global', 'Nivel máximo'] },
]

interface Props {
  currentLevel: number
}

export default function LevelMap({ currentLevel }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="card" style={{ padding: 24, marginBottom: 32 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 600,
          color: 'var(--ds-text-primary)', letterSpacing: '-0.01em', marginBottom: 4,
        }}>
          Tu camino de crecimiento
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
          Cada nivel desbloquea nuevas herramientas y estrategias para tu negocio
        </p>
      </div>

      <div style={{
        position: 'relative',
        overflowX: 'auto',
        padding: '20px 8px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 920, gap: 0 }}>
          {LEVELS.map((lv, i) => {
            const passed = lv.level < currentLevel
            const current = lv.level === currentLevel
            const locked = lv.level > currentLevel
            const isHovered = hovered === lv.level
            const size = current ? 64 : 52

            return (
              <div key={lv.level} style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Connector line to next */}
                {i < LEVELS.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    top: current ? 32 : 26,
                    left: '50%',
                    width: '100%',
                    height: 3,
                    background: passed || (current && lv.level < currentLevel)
                      ? 'var(--ds-color-success)'
                      : 'rgba(255,255,255,0.06)',
                    borderRadius: 2,
                    zIndex: 0,
                  }} />
                )}

                {/* Node */}
                <button
                  onClick={() => setHovered(hovered === lv.level ? null : lv.level)}
                  onMouseEnter={() => setHovered(lv.level)}
                  onMouseLeave={() => setHovered(null)}
                  className={current ? 'levelmap-pulse' : ''}
                  style={{
                    width: size, height: size, borderRadius: '50%',
                    background: locked
                      ? 'rgba(255,255,255,0.03)'
                      : `${lv.color}14`,
                    border: `${current ? '2.5px' : '2px'} solid ${locked ? 'rgba(255,255,255,0.10)' : `${lv.color}80`}`,
                    opacity: locked ? 0.35 : 1,
                    filter: locked ? 'grayscale(60%)' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: current ? 28 : 22,
                    cursor: 'pointer',
                    position: 'relative', zIndex: 1,
                    transition: 'all 0.2s',
                  }}>
                  {lv.emoji}
                  {passed && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 18, height: 18, borderRadius: '50%',
                      background: 'var(--ds-color-success)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 900,
                    }}>✓</span>
                  )}
                  {locked && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      fontSize: 10,
                    }}>🔒</span>
                  )}
                </button>

                {current && (
                  <span style={{
                    position: 'absolute', top: -18,
                    fontSize: 8, fontWeight: 800, letterSpacing: '0.10em',
                    padding: '2px 8px', borderRadius: 99,
                    background: lv.color, color: '#fff',
                    whiteSpace: 'nowrap',
                  }}>ESTÁS AQUÍ</span>
                )}

                <p style={{ fontSize: 10, fontWeight: 700, color: locked ? '#5a6478' : lv.color, marginTop: 8, textAlign: 'center', letterSpacing: '0.04em' }}>
                  {lv.level}
                </p>
                <p style={{ fontSize: 10, color: locked ? '#5a6478' : '#a0a8c0', textAlign: 'center', marginTop: 2 }}>
                  {lv.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tooltip detail */}
      {hovered !== null && (() => {
        const lv = LEVELS[hovered]
        return (
          <div className="mt-5 p-4 rounded-xl" style={{
            background: `${lv.color}08`,
            border: `1px solid ${lv.color}30`,
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${lv.color}20`, border: `1px solid ${lv.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>{lv.emoji}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: lv.color, marginBottom: 2 }}>
                Nivel {lv.level}: {lv.name}
              </p>
              <p style={{ fontSize: 12, color: 'var(--ds-text-primary)', marginBottom: 8 }}>
                Requisito: {lv.requirement}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4 }}>
                Desbloquea
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {lv.unlocks.map((u, idx) => (
                  <li key={idx} style={{ fontSize: 12, color: '#a0a8c0', display: 'flex', gap: 6, marginBottom: 2 }}>
                    <span style={{ color: lv.color }}>→</span> {u}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      })()}

      <style>{`
        @keyframes lvlmapPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
        }
        .levelmap-pulse { animation: lvlmapPulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
