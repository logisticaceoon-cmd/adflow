'use client'
import { useEffect } from 'react'

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('[RootError]', error) }, [error])
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#fff', backgroundColor: '#080c14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Algo salió mal</h2>
        <p style={{ color: 'rgba(255,255,255,0.50)', marginBottom: '1.5rem' }}>Ocurrió un error inesperado. Por favor intenta de nuevo.</p>
        <button onClick={reset} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#3b82f6', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Reintentar
        </button>
      </div>
    </div>
  )
}
