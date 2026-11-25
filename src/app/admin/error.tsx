'use client'
import { useEffect } from 'react'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[AdminError]', error) }, [error])
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', backgroundColor: '#080c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Error en el panel de administración</h2>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Algo salió mal. Por favor intenta de nuevo.</p>
        <button onClick={reset} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    </div>
  )
}
