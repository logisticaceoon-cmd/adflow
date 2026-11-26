'use client'
// src/components/dashboard/HeroLevel.tsx — Welcome hero (clean, no levels)

interface Props {
  fullName: string
}

export default function HeroLevel({ fullName }: Props) {
  return (
    <div className="card module-enter module-enter-1" style={{
      position: 'relative',
      marginBottom: 12,
      padding: '24px 28px',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'var(--ds-text-label)',
        marginBottom: 8,
      }}>
        Centro de mando · AdFlow
      </p>

      <h1 style={{
        fontFamily: 'var(--font-display), Space Grotesk, sans-serif',
        fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
        color: 'var(--ds-text-primary)', lineHeight: 1.2,
      }}>
        Bienvenido, {fullName} 👋
      </h1>
    </div>
  )
}
