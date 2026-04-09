'use client'
// src/components/labs/NotifyMeButton.tsx
// Client button that saves user's interest in a future feature to localStorage
// and shows a short confirmation toast.
import { useState } from 'react'

interface Props {
  featureId: string
  featureName: string
}

export default function NotifyMeButton({ featureId, featureName }: Props) {
  const [registered, setRegistered] = useState(false)

  const handleClick = () => {
    try {
      const key = 'adflow:labs:notify'
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      const current: string[] = raw ? JSON.parse(raw) : []
      if (!current.includes(featureId)) {
        current.push(featureId)
        window.localStorage.setItem(key, JSON.stringify(current))
      }
    } catch { /* ignore */ }
    setRegistered(true)
  }

  if (registered) {
    return (
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px', borderRadius: 99,
          background: 'var(--ds-color-success-soft)',
          color: 'var(--ds-color-success)',
          border: '1px solid var(--ds-color-success-border)',
          fontSize: 12, fontWeight: 700,
        }}
        aria-live="polite"
      >
        ✓ Te avisamos cuando {featureName} esté listo
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="btn-primary"
      style={{ fontSize: 12, padding: '10px 20px' }}
    >
      Notificarme cuando esté disponible →
    </button>
  )
}
