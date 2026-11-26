'use client'
// src/app/dashboard/pixel/page.tsx — Mi Pixel: funnel de conversión
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'
import FunnelExplained from '@/components/dashboard/FunnelExplained'

interface PixelEvents {
  PageView:         { count_7d: number; count_30d: number; count_180d: number }
  ViewContent:      { count_7d: number; count_30d: number; count_180d: number }
  AddToCart:        { count_7d: number; count_30d: number; count_180d: number }
  InitiateCheckout: { count_7d: number; count_30d: number; count_180d: number }
  Purchase:         { count_7d: number; count_30d: number; count_180d: number; value_30d: number }
}

interface PixelAnalysisRow {
  pixel_id: string
  events_data: PixelEvents
  analyzed_at: string
}

export default function PixelDashboardPage() {
  const [pa, setPa] = useState<PixelAnalysisRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasPixel, setHasPixel] = useState(true)

  async function loadAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: biz }, { data: row }] = await Promise.all([
      supabase.from('business_profiles').select('pixel_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('pixel_analysis').select('pixel_id, events_data, analyzed_at').eq('user_id', user.id).maybeSingle(),
    ])
    if (!biz?.pixel_id) setHasPixel(false)
    if (row) setPa(row as PixelAnalysisRow)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/pixel/analyze')
      await loadAll()
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return <div className="p-12 text-center" style={{ color: 'var(--ds-text-secondary)' }}>Cargando análisis del pixel...</div>
  }

  if (!hasPixel) {
    return (
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div className="card p-10">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <h1 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
            No tenés pixel configurado
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 24 }}>
            Sin pixel no podemos medir conversiones ni recomendarte estrategias.
          </p>
          <Link href="/dashboard/settings" className="btn-primary">Configurar pixel →</Link>
        </div>
      </div>
    )
  }

  const events = pa?.events_data

  return (
    <div>
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6 module-enter module-enter-1">
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display), Space Grotesk, sans-serif',
            fontSize: 24, fontWeight: 700, color: 'var(--ds-text-primary)',
            letterSpacing: '-0.02em', marginBottom: 4,
          }}>
            Tu embudo de conversión
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
            Así fluyen tus visitantes desde que llegan hasta que compran
            {pa?.pixel_id && (
              <span style={{ fontSize: 11, color: 'var(--ds-text-muted)', marginLeft: 12 }}>
                Pixel: {pa.pixel_id}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-ghost"
          style={{ padding: '8px 14px', fontSize: 12, minHeight: 34, gap: 6 }}
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--ds-color-primary)' }} />
          {refreshing ? 'Actualizando...' : 'Actualizar análisis'}
        </button>
      </div>

      {/* ── FUNNEL ── */}
      <div className="module-enter module-enter-2">
        <FunnelExplained events={events ?? null} />
      </div>
    </div>
  )
}
