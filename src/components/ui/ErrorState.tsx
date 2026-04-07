'use client'
// src/components/ui/ErrorState.tsx
// Friendly error display: never shows stack traces, always offers a path forward.
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  retry?: () => void
  goBack?: boolean
}

export default function ErrorState({
  title = 'Algo salió mal',
  description = 'Hubo un problema cargando esta sección. Esperá unos segundos y volvé a intentar.',
  retry,
  goBack = false,
}: ErrorStateProps) {
  const router = useRouter()

  return (
    <div style={{
      padding: '56px 32px',
      borderRadius: 20,
      background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.10), rgba(255,255,255,0.01) 60%)',
      border: '1px dashed rgba(239,68,68,0.25)',
      textAlign: 'center',
      maxWidth: 560,
      margin: '40px auto',
    }}>
      <div style={{
        width: 72, height: 72, margin: '0 auto 18px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.15), rgba(239,68,68,0.02))',
        border: '1.5px solid rgba(239,68,68,0.45)',
        boxShadow: '0 0 32px rgba(239,68,68,0.20)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <AlertTriangle size={32} color="#ef4444" strokeWidth={2} />
      </div>

      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 22, fontWeight: 800, color: '#fff',
        letterSpacing: '-0.01em', marginBottom: 8,
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: 13, color: 'var(--muted)',
        lineHeight: 1.55, maxWidth: 420,
        margin: '0 auto 22px',
      }}>
        {description}
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {retry && (
          <button onClick={retry} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #e91e8c, #c5006a)',
            color: '#fff', fontSize: 12, fontWeight: 800,
            padding: '10px 20px', borderRadius: 99, border: 'none',
            boxShadow: '0 8px 20px rgba(233,30,140,0.35)',
            cursor: 'pointer',
          }}>
            <RefreshCw size={13} /> Reintentar
          </button>
        )}
        {goBack && (
          <button onClick={() => router.back()} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            color: '#fff', fontSize: 12, fontWeight: 700,
            padding: '10px 20px', borderRadius: 99,
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'pointer',
          }}>
            <ArrowLeft size={13} /> Volver
          </button>
        )}
      </div>

      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 22 }}>
        Si el problema persiste,{' '}
        <a
          href="https://wa.me/5491100000000"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#62c4b0', textDecoration: 'underline' }}
        >
          contactanos por WhatsApp
        </a>
        .
      </p>
    </div>
  )
}
