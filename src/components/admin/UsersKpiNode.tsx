'use client'
// src/components/admin/UsersKpiNode.tsx
import { useEffect, useState } from 'react'

function useCountUp(target: number, duration = 2000) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const startTime = Date.now()
    const animate = () => {
      const elapsed  = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration])
  return value
}

export default function UsersKpiNode({ count }: { count: number }) {
  const displayCount = useCountUp(count)
  const [hovered, setHovered] = useState(false)

  const SIZE = 264

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48 }}>

      <div
        style={{ position: 'relative', width: SIZE, height: SIZE, cursor: 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Outermost ambient atmosphere */}
        <div style={{
          position: 'absolute',
          inset: -70,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,30,140,0.18) 0%, rgba(233,30,140,0.06) 50%, transparent 72%)',
          animation: 'kpiGlowPulse 3.5s ease-in-out infinite',
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0.7,
          transition: 'opacity 0.4s ease',
        }} />

        {/* Mid glow ring */}
        <div style={{
          position: 'absolute',
          inset: -20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(233,30,140,0.22) 0%, transparent 60%)',
          filter: 'blur(12px)',
          animation: 'kpiGlowPulse 2.6s ease-in-out infinite 0.8s',
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0.65,
          transition: 'opacity 0.4s ease',
        }} />

        {/* Main circle — border + inner glow */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid #2dd4a8',
          boxShadow: hovered
            ? 'inset 0 0 40px rgba(233,30,140,0.40), 0 0 50px rgba(233,30,140,0.55), 0 0 100px rgba(233,30,140,0.30), 0 0 160px rgba(233,30,140,0.12)'
            : 'inset 0 0 30px rgba(233,30,140,0.20), 0 0 40px rgba(233,30,140,0.40), 0 0 80px rgba(233,30,140,0.20), 0 0 120px rgba(233,30,140,0.10)',
          transition: 'box-shadow 0.5s ease',
        }}>
          {/* Inner fill — semi-transparent so background bleeds through */}
          <div style={{
            position: 'absolute',
            inset: 3,
            borderRadius: '50%',
            background: 'rgba(10,10,15,0.55)',
            backdropFilter: 'blur(4px)',
          }} />
        </div>

        {/* Rotating electric arc 1 */}
        <div style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, transparent 72%, rgba(233,30,140,0.9) 82%, #f472b6 89%, transparent 95%, transparent 100%)',
          animation: 'kpiRingSpin 3.5s linear infinite',
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0.8,
          transition: 'opacity 0.4s ease',
        }} />

        {/* Rotating electric arc 2 — counter, offset */}
        <div style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, transparent 75%, rgba(244,114,182,0.7) 84%, transparent 92%, transparent 100%)',
          animation: 'kpiRingSpin 5.5s linear infinite reverse',
          pointerEvents: 'none',
          opacity: hovered ? 0.9 : 0.6,
          transition: 'opacity 0.4s ease',
        }} />

        {/* Inner accent ring */}
        <div style={{
          position: 'absolute',
          inset: 14,
          borderRadius: '50%',
          border: `1px solid rgba(233,30,140,${hovered ? 0.35 : 0.15})`,
          transition: 'border-color 0.4s ease',
          pointerEvents: 'none',
        }} />

        {/* Inner dashed ring — slow reverse */}
        <div style={{
          position: 'absolute',
          inset: 24,
          borderRadius: '50%',
          border: `1px dashed rgba(233,30,140,${hovered ? 0.25 : 0.10})`,
          transition: 'border-color 0.4s ease',
          animation: 'kpiRingSpin 20s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        {/* Content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'kpiFadeUp 0.9s ease-out both',
          zIndex: 2,
          gap: 4,
        }}>
          {/* Number */}
          <div style={{
            fontSize: 70,
            fontWeight: 900,
            lineHeight: 1,
            color: '#ffffff',
            letterSpacing: '-3px',
            fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
            textShadow: hovered
              ? '0 0 24px rgba(233,30,140,0.6)'
              : '0 0 16px rgba(233,30,140,0.35)',
            transition: 'text-shadow 0.4s ease',
          }}>
            {displayCount.toLocaleString()}
          </div>

          {/* Label */}
          <div style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#2dd4a8',
          }}>
            Usuarios totales
          </div>
        </div>
      </div>

      {/* Sub caption */}
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 10, letterSpacing: '0.04em' }}>
        Cuentas registradas en la plataforma
      </p>

      <style>{`
        @keyframes kpiRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes kpiGlowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes kpiFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
