'use client'
// src/app/dashboard/pixel/page.tsx — Pixel dashboard
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'
import LevelBadge from '@/components/dashboard/LevelBadge'
import LevelProgress from '@/components/dashboard/LevelProgress'
import GrowthTimeline from '@/components/dashboard/GrowthTimeline'

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
  level: number
  level_name: string
  can_retarget_view_content: boolean
  can_retarget_add_to_cart: boolean
  can_retarget_purchase: boolean
  can_create_lookalike: boolean
  available_strategies: string[]
  available_audience_types: string[]
  analyzed_at: string
}

const LEVEL_INFO: Record<number, { color: string; emoji: string; nextReq: string }> = {
  0: { color: '#ef4444', emoji: '🌱', nextReq: '100 PageView en 30 días' },
  1: { color: '#ef4444', emoji: '🌱', nextReq: '500 PageView en 30 días' },
  2: { color: '#f59e0b', emoji: '📊', nextReq: '1.000 ViewContent en 30 días' },
  3: { color: '#f59e0b', emoji: '📊', nextReq: '100 AddToCart en 30 días' },
  4: { color: '#f59e0b', emoji: '📊', nextReq: '50 Purchases en 30 días' },
  5: { color: '#06d6a0', emoji: '🚀', nextReq: '100 Purchases en 30 días' },
  6: { color: '#06d6a0', emoji: '🚀', nextReq: '500 Purchases en 180 días' },
  7: { color: '#06d6a0', emoji: '🚀', nextReq: '1.000 Purchases en 180 días' },
  8: { color: '#06d6a0', emoji: '👑', nextReq: 'Nivel máximo' },
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
      supabase.from('pixel_analysis').select('*').eq('user_id', user.id).maybeSingle(),
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
    return <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>Cargando análisis del pixel...</div>
  }

  if (!hasPixel) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-10 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <h1 className="page-title mb-2">No tenés pixel configurado</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Sin pixel no podemos medir conversiones, crear audiencias inteligentes ni recomendarte estrategias.
          </p>
          <Link href="/dashboard/settings" className="btn-primary">Configurar pixel →</Link>
        </div>
      </div>
    )
  }

  const events = pa?.events_data
  const level = pa?.level ?? 0
  const info = LEVEL_INFO[level]
  const nextLevel = Math.min(level + 1, 8)

  // Funnel conversion %
  const fn = events ? {
    pv: events.PageView.count_30d,
    vc: events.ViewContent.count_30d,
    atc: events.AddToCart.count_30d,
    co: events.InitiateCheckout.count_30d,
    pu: events.Purchase.count_30d,
  } : { pv: 0, vc: 0, atc: 0, co: 0, pu: 0 }
  const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
            Mi Pixel · AdFlow
          </p>
          <h1 className="page-title mb-1.5">Análisis del pixel</h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Última actualización: {pa?.analyzed_at ? new Date(pa.analyzed_at).toLocaleString() : 'nunca'}
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} className="btn-primary">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* ── Level hero ── */}
      <div className="card p-8 mb-6" style={{
        background: `linear-gradient(135deg, ${info.color}15, ${info.color}05)`,
        borderTop: `2px solid ${info.color}`,
      }}>
        <div className="flex items-center gap-8">
          <LevelBadge level={level} levelName={pa?.level_name} size="lg" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
              Nivel {level} de 8
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: info.color, marginBottom: 4 }}>
              {pa?.level_name}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              Pixel ID: <code style={{ color: '#a0a8c0' }}>{pa?.pixel_id}</code>
            </p>
            {level < 8 && events && (() => {
              // Choose the metric that gates the next level
              const map: Record<number, { current: number; required: number; label: string }> = {
                0: { current: events.PageView.count_30d,    required: 100,  label: 'PageView (30d)' },
                1: { current: events.PageView.count_30d,    required: 500,  label: 'PageView (30d)' },
                2: { current: events.ViewContent.count_30d, required: 1000, label: 'ViewContent (30d)' },
                3: { current: events.AddToCart.count_30d,   required: 100,  label: 'AddToCart (30d)' },
                4: { current: events.Purchase.count_30d,    required: 50,   label: 'Purchase (30d)' },
                5: { current: events.Purchase.count_30d,    required: 100,  label: 'Purchase (30d)' },
                6: { current: events.Purchase.count_180d,   required: 500,  label: 'Purchase (180d)' },
                7: { current: events.Purchase.count_180d,   required: 1000, label: 'Purchase (180d)' },
              }
              const m = map[level]
              if (!m) return null
              return (
                <LevelProgress
                  current={m.current}
                  required={m.required}
                  metric={m.label}
                  nextLevel={nextLevel}
                  currentColor={info.color}
                  nextColor={LEVEL_INFO[nextLevel].color}
                />
              )
            })()}
          </div>
        </div>
      </div>

      {/* ── Event metrics grid ── */}
      <div className="card p-6 mb-6">
        <h2 className="section-title mb-4">Eventos del pixel</h2>
        <div className="grid grid-cols-5 gap-3">
          {(['PageView','ViewContent','AddToCart','InitiateCheckout','Purchase'] as const).map(ev => {
            const e = events?.[ev]
            return (
              <div key={ev} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#8892b0', marginBottom: 8 }}>{ev}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                  {(e?.count_30d ?? 0).toLocaleString()}
                </p>
                <p style={{ fontSize: 10, color: 'var(--muted)' }}>30 días</p>
                <div style={{ marginTop: 6, fontSize: 10, color: 'var(--muted)' }}>
                  7d: {(e?.count_7d ?? 0).toLocaleString()} · 180d: {(e?.count_180d ?? 0).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Funnel ── */}
      <div className="card p-6 mb-6">
        <h2 className="section-title mb-4">Funnel de conversión (30 días)</h2>
        <div className="space-y-2">
          {[
            { label: 'PageView',         val: fn.pv, color: '#62c4b0', conv: 100 },
            { label: 'ViewContent',      val: fn.vc, color: '#3aa9d8', conv: pct(fn.vc, fn.pv) },
            { label: 'AddToCart',        val: fn.atc, color: '#f59e0b', conv: pct(fn.atc, fn.vc) },
            { label: 'InitiateCheckout', val: fn.co, color: '#e91e8c', conv: pct(fn.co, fn.atc) },
            { label: 'Purchase',         val: fn.pu, color: '#06d6a0', conv: pct(fn.pu, fn.co) },
          ].map((s, i) => {
            const widthPct = fn.pv > 0 ? Math.max(8, (s.val / fn.pv) * 100) : 8
            return (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 11, color: '#a0a8c0' }}>{s.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>
                    {s.val.toLocaleString()} {i > 0 && <span style={{ color: 'var(--muted)' }}>({s.conv}%)</span>}
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${widthPct}%`,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}80)`,
                    boxShadow: `0 0 10px ${s.color}50`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* ── Available now ── */}
        <div className="card p-6">
          <h2 className="section-title mb-3">¿Qué podés hacer en tu nivel?</h2>
          <ul style={{ fontSize: 12, color: '#a0a8c0', listStyle: 'none', padding: 0, lineHeight: 1.9 }}>
            <li>✅ Estrategias: <b>{(pa?.available_strategies || ['TOFU']).join(' · ')}</b></li>
            <li>✅ Audiencias: <b>{(pa?.available_audience_types || ['broad']).join(', ')}</b></li>
            {pa?.can_retarget_view_content && <li>✅ Retargeting de visitantes</li>}
            {pa?.can_retarget_add_to_cart && <li>✅ Retargeting de carrito abandonado</li>}
            {pa?.can_retarget_purchase && <li>✅ Retargeting de compradores</li>}
            {pa?.can_create_lookalike && <li>✅ Lookalike Audiences</li>}
          </ul>
        </div>

        {/* ── Next level ── */}
        <div className="card p-6">
          <h2 className="section-title mb-3">¿Qué desbloqueás en el próximo nivel?</h2>
          {level < 8 ? (
            <ul style={{ fontSize: 12, color: '#a0a8c0', listStyle: 'none', padding: 0, lineHeight: 1.9 }}>
              <li>🔓 Subir a nivel <b>{nextLevel}</b></li>
              <li>📊 {LEVEL_INFO[nextLevel].nextReq}</li>
              {nextLevel >= 3 && !pa?.can_retarget_view_content && <li>🔓 Retargeting de visitantes</li>}
              {nextLevel >= 4 && !pa?.can_retarget_add_to_cart && <li>🔓 Retargeting de carrito</li>}
              {nextLevel >= 5 && !pa?.can_retarget_purchase && <li>🔓 BOFU + retargeting de compradores</li>}
              {nextLevel >= 6 && !pa?.can_create_lookalike && <li>🔓 Lookalike Audiences</li>}
            </ul>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted)' }}>👑 Estás en el nivel máximo. Seguí escalando.</p>
          )}
        </div>
      </div>

      {/* ── Growth timeline ── */}
      <div className="card p-6">
        <h2 className="section-title mb-4">Tu viaje de crecimiento</h2>
        <GrowthTimeline />
      </div>
    </div>
  )
}
