'use client'
// src/app/dashboard/pixel/page.tsx — Mi Pixel: progress, gamification, growth profile
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'
import LevelBadge from '@/components/dashboard/LevelBadge'
import LevelMap from '@/components/dashboard/LevelMap'
import ScoreCard from '@/components/dashboard/ScoreCard'
import FunnelExplained from '@/components/dashboard/FunnelExplained'
import CapabilitiesCard from '@/components/dashboard/CapabilitiesCard'
import AchievementsWall from '@/components/dashboard/AchievementsWall'
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

// Hero accents per level — uniform card base with sober per-level emoji
const LEVEL_GRADIENT: Record<number, { from: string; to: string; main: string; emoji: string }> = {
  0: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-text-muted)',     emoji: '🌑' },
  1: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '🌱' },
  2: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '📚' },
  3: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '🧠' },
  4: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '🛒' },
  5: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '💼' },
  6: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '🚀' },
  7: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '👑' },
  8: { from: 'var(--ds-card-bg)', to: 'var(--ds-card-bg)', main: 'var(--ds-color-primary)',  emoji: '🏰' },
}

function nextLevelMetric(level: number, events: PixelEvents | undefined) {
  const map: Record<number, { current: number; required: number; label: string }> = {
    0: { current: events?.PageView.count_30d    ?? 0, required: 100,  label: 'PageView (30d)' },
    1: { current: events?.PageView.count_30d    ?? 0, required: 500,  label: 'PageView (30d)' },
    2: { current: events?.ViewContent.count_30d ?? 0, required: 1000, label: 'ViewContent (30d)' },
    3: { current: events?.AddToCart.count_30d   ?? 0, required: 100,  label: 'AddToCart (30d)' },
    4: { current: events?.Purchase.count_30d    ?? 0, required: 50,   label: 'Purchase (30d)' },
    5: { current: events?.Purchase.count_30d    ?? 0, required: 100,  label: 'Purchase (30d)' },
    6: { current: events?.Purchase.count_180d   ?? 0, required: 500,  label: 'Purchase (180d)' },
    7: { current: events?.Purchase.count_180d   ?? 0, required: 1000, label: 'Purchase (180d)' },
  }
  return map[level] || { current: 0, required: 0, label: '' }
}

const LEVEL_NAMES = ['Sin Data', 'Explorador', 'Aprendiz', 'Estratega', 'Vendedor', 'Profesional', 'Escalador', 'Maestro', 'Imperio']

export default function PixelDashboardPage() {
  const [pa, setPa] = useState<PixelAnalysisRow | null>(null)
  const [campaignsCount, setCampaignsCount] = useState(0)
  const [hasAnyProfitable, setHasAnyProfitable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hasPixel, setHasPixel] = useState(true)

  async function loadAll() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [{ data: biz }, { data: row }, { data: camps }] = await Promise.all([
      supabase.from('business_profiles').select('pixel_id').eq('user_id', user.id).maybeSingle(),
      supabase.from('pixel_analysis').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('campaigns').select('metrics').eq('user_id', user.id),
    ])
    if (!biz?.pixel_id) setHasPixel(false)
    if (row) setPa(row as PixelAnalysisRow)
    if (camps) {
      setCampaignsCount(camps.length)
      setHasAnyProfitable(camps.some((c: any) => (c.metrics?.roas ?? 0) >= 2))
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="card p-10 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
            No tenés pixel configurado
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Sin pixel no podemos medir conversiones, crear audiencias inteligentes ni recomendarte estrategias.
          </p>
          <Link href="/dashboard/settings" className="btn-primary">Configurar pixel →</Link>
        </div>
      </div>
    )
  }

  const events = pa?.events_data
  const level = pa?.level ?? 0
  const grad = LEVEL_GRADIENT[level]
  const nextLevel = Math.min(level + 1, 8)
  const nextMetric = nextLevelMetric(level, events)
  const progressPct = nextMetric.required > 0
    ? Math.min(100, Math.round((nextMetric.current / nextMetric.required) * 100))
    : 100

  // Motivational message
  let motivation = ''
  if (level >= 8) motivation = '👑 Alcanzaste el nivel máximo. Tu negocio es un imperio.'
  else if (progressPct < 25) motivation = 'Acabás de empezar este nivel. ¡Seguí invirtiendo para crecer!'
  else if (progressPct < 50) motivation = 'Vas por buen camino. Cada campaña te acerca más.'
  else if (progressPct < 75) motivation = '¡Más de la mitad! El siguiente nivel está cerca.'
  else                       motivation = `🔥 ¡Casi! Falta muy poco para desbloquear ${LEVEL_NAMES[nextLevel]}!`

  // Growth Score breakdown
  const scoreLevel    = level * 100
  const scoreTraffic  = Math.min(200, (events?.PageView.count_30d  ?? 0) / 5)
  const scoreSales    = Math.min(150, (events?.Purchase.count_180d ?? 0) * 2)
  const scoreCamps    = campaignsCount * 10
  const totalScore    = Math.round(scoreLevel + scoreTraffic + scoreSales + scoreCamps)

  // Monthly stars
  const monthStars = [
    { label: 'Crear una campaña este mes',          earned: campaignsCount > 0 },
    { label: 'ROAS positivo en alguna campaña',     earned: hasAnyProfitable },
    { label: 'Subir de nivel del pixel',            earned: false /* would need monthly delta */ },
    { label: '100+ visitantes web',                 earned: (events?.PageView.count_30d ?? 0) >= 100 },
    { label: 'Tener al menos una compra registrada', earned: (events?.Purchase.count_30d ?? 0) >= 1 },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* ── SECTION A: HERO ───────────────────────────────────────────── */}
      <div className="dash-anim-1 mb-6" style={{
        position: 'relative',
        borderRadius: 24, padding: '36px 32px',
        background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)`,
        border: `1px solid ${grad.main}30`,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 20px 80px rgba(0,0,0,0.55), 0 0 80px ${grad.main}15`,
        overflow: 'hidden',
      }}>
        {/* Top edge accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${grad.main}80, transparent)`,
        }} />
        {/* Imperio: extra glow particles */}
        {level === 8 && (
          <>
            <div style={{ position: 'absolute', top: '15%', right: '10%', width: 4, height: 4, borderRadius: '50%', background: 'var(--ds-color-warning)', boxShadow: '0 0 20px var(--ds-color-warning)' }} />
            <div style={{ position: 'absolute', top: '60%', right: '25%', width: 3, height: 3, borderRadius: '50%', background: 'var(--ds-color-warning)', boxShadow: '0 0 16px var(--ds-color-warning)' }} />
            <div style={{ position: 'absolute', top: '30%', left: '15%', width: 5, height: 5, borderRadius: '50%', background: '#c4b5fd', boxShadow: '0 0 22px #c4b5fd' }} />
          </>
        )}

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            position: 'absolute', top: 20, right: 20,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 10,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: refreshing ? 'wait' : 'pointer',
          }}>
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualizando...' : 'Actualizar análisis'}
        </button>

        {/* Centered hero content */}
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
          {/* Big level badge */}
          <div style={{ display: 'inline-block', marginBottom: 18 }}>
            <LevelBadge level={level} levelName="" size="lg" showName={false} />
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 6 }}>
            Nivel {level} de 8
          </p>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 900,
            color: grad.main, letterSpacing: '-0.03em', marginBottom: 14,
            textShadow: `0 0 32px ${grad.main}50`,
          }}>
            {pa?.level_name}
          </h1>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 18px', borderRadius: 99, marginBottom: 24,
            background: 'var(--ds-color-warning-soft)',
            border: '1px solid var(--ds-color-warning-border)',
          }}>
            <span style={{ fontSize: 16 }}>⭐</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 800, color: 'var(--ds-color-warning)' }}>
              {totalScore.toLocaleString()} puntos de crecimiento
            </span>
          </div>

          {level < 8 && nextMetric.required > 0 && (
            <>
              <div style={{
                height: 16, borderRadius: 99,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden', marginBottom: 12,
              }}>
                <div style={{
                  height: '100%', width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${grad.main}, ${LEVEL_GRADIENT[nextLevel].main})`,
                  boxShadow: `0 0 24px ${LEVEL_GRADIENT[nextLevel].main}90`,
                  borderRadius: 99,
                  transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--ds-text-primary)', marginBottom: 8 }}>
                <b style={{ color: '#fff' }}>{nextMetric.current.toLocaleString()}</b> de{' '}
                <b style={{ color: '#fff' }}>{nextMetric.required.toLocaleString()}</b> {nextMetric.label} para nivel{' '}
                <b style={{ color: LEVEL_GRADIENT[nextLevel].main }}>{nextLevel}: {LEVEL_NAMES[nextLevel]}</b>
              </p>
            </>
          )}

          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', fontStyle: 'italic', marginTop: 6 }}>
            {motivation}
          </p>

          <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginTop: 22 }}>
            Pixel ID: <code style={{ color: '#a0a8c0' }}>{pa?.pixel_id}</code>
            {' · '}
            Última actualización: {pa?.analyzed_at ? new Date(pa.analyzed_at).toLocaleString('es') : 'nunca'}
          </p>
        </div>
      </div>

      {/* ── SECTION B: LEVEL MAP ──────────────────────────────────────── */}
      <LevelMap currentLevel={level} />

      {/* ── SECTION C: SCORE CARD ─────────────────────────────────────── */}
      <ScoreCard
        totalScore={totalScore}
        breakdown={[
          { label: `Nivel ${level}`,    points: scoreLevel,   color: grad.main },
          { label: 'Tráfico web',       points: scoreTraffic, color: 'var(--ds-color-primary)' },
          { label: 'Compras (180d)',    points: scoreSales,   color: 'var(--ds-color-success)' },
          { label: `Campañas (${campaignsCount})`, points: scoreCamps, color: 'var(--ds-color-primary)' },
        ]}
        monthStars={monthStars}
      />

      {/* ── SECTION D: FUNNEL EXPLAINED ───────────────────────────────── */}
      <FunnelExplained events={events ?? null} />

      {/* ── SECTION E: CAPABILITIES ───────────────────────────────────── */}
      <CapabilitiesCard level={level} />

      {/* ── SECTION F: ACHIEVEMENTS WALL ──────────────────────────────── */}
      <AchievementsWall />

      {/* ── SECTION G: GROWTH TIMELINE ────────────────────────────────── */}
      <div className="card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Tu viaje de crecimiento
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 18 }}>
          Cada vez que subiste de nivel queda registrado acá
        </p>
        <GrowthTimeline />
      </div>
    </div>
  )
}
