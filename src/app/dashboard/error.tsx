'use client'
// src/app/dashboard/error.tsx — Next.js error boundary for the dashboard segment.
import { useEffect } from 'react'
import ErrorState from '@/components/ui/ErrorState'

export default function DashboardError({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[dashboard error]', error)
  }, [error])

  return (
    <ErrorState
      title="No pudimos cargar esta sección"
      description="Hubo un problema temporal cargando tu información. Probá reintentar en unos segundos."
      retry={reset}
      goBack
    />
  )
}
