'use client'
// src/app/dashboard/pixel/page.tsx — Mi Pixel: estado del pixel + embudo
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
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
          <AlertCircle size={40} style={{ color: 'var(--ds-color-warning)', margin: '0 auto 16px', display: 'block' }} />
          <h1 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            Tu pixel no está configurado
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            El pixel de Meta es el código que mide las acciones en tu web: visitas, carritos y compras.
            Sin él no podemos trackear resultados ni optimizar tus campañas.
          </p>
          <Link href="/dashboard/settings" className="btn-primary">Configurar pixel →</Link>
        </div>
      </div>
    )
  }

  const events = pa?.events_data
  const hasData = events && (events.PageView.count_30d > 0 || events.Purchase.count_30d > 0)
  const lastUpdate = pa?.analyzed_at ? new Date(pa.analyzed_at) : null

  return (
    <div>
      {/* ── PIXEL STATUS CARD ── */}
      <div className="card module-enter module-enter-1" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: hasData ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${hasData ? 'rgba(34, 197, 94, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {hasData
                ? <CheckCircle size={18} style={{ color: 'var(--ds-color-success)' }} />
                : <AlertCircle size={18} style={{ color: 'var(--ds-color-warning)' }} />
              }
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display), Space Grotesk, sans-serif',
                fontSize: 18, fontWeight: 700, color: 'var(--ds-text-primary)',
                letterSpacing: '-0.01em', marginBottom: 2,
              }}>
                {hasData ? 'Pixel activo y recibiendo datos' : 'Pixel conectado — esperando datos'}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                ID: <code style={{ fontSize: 11, color: 'var(--ds-text-muted)' }}>{pa?.pixel_id}</code>
                {lastUpdate && (
                  <span style={{ marginLeft: 12, color: 'var(--ds-text-muted)' }}>
                    Última actualización: {lastUpdate.toLocaleDateString('es', { day: '2-digit', month: 'short' })} {lastUpdate.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-ghost"
            style={{ padding: '8px 14px', fontSize: 12, minHeight: 34, gap: 6 }}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} style={{ color: 'var(--ds-color-primary)' }} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* ── FUNNEL ── */}
      <div className="module-enter module-enter-2">
        <FunnelExplained events={events ?? null} />
      </div>
    </div>
  )
}
