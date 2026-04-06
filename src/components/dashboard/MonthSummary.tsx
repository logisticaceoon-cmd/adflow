'use client'
// src/components/dashboard/MonthSummary.tsx
// Two rows of metrics: business KPIs (top) + funnel events (bottom)
import { DollarSign, TrendingUp, Target, ShoppingCart, CreditCard } from 'lucide-react'

interface FunnelEvents {
  PageView:         { count_30d: number }
  ViewContent:      { count_30d: number }
  AddToCart:        { count_30d: number }
  InitiateCheckout: { count_30d: number }
  Purchase:         { count_30d: number }
}

interface Props {
  totalSpend:       number
  totalRevenue:     number
  totalConversions: number
  avgRoas:          number
  avgTicket:        number
  trendSpend?:      number  // % vs prev month
  trendRevenue?:    number
  trendRoas?:       number
  trendConv?:       number
  events:           FunnelEvents | null
  currency?:        string
}

interface KpiProps {
  label: string
  value: string
  trend?: number
  Icon: React.ElementType
  color: string
  positive: boolean
}

function Kpi({ label, value, trend, Icon, color, positive }: KpiProps) {
  const trendStr = trend !== undefined && trend !== 0
    ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% vs mes anterior`
    : trend === 0 ? '— sin cambios' : 'Primer mes'
  return (
    <div className="card p-5" style={{
      borderTop: `2px solid ${color}`,
      boxShadow: `0 0 0 1px rgba(255,255,255,0.05) inset, 0 10px 40px rgba(0,0,0,0.32), 0 0 32px ${color}12`,
    }}>
      <div className="flex items-center justify-between mb-3">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8892b0' }}>
          {label}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `${color}20`,
          border: `1px solid ${color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 14px ${color}30`,
        }}>
          <Icon size={14} style={{ color, filter: `drop-shadow(0 0 4px ${color})` }} strokeWidth={1.75} />
        </div>
      </div>
      <p style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 26, fontWeight: 800, color: '#ffffff',
        letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: positive ? '#06d6a0' : trend === undefined ? 'var(--muted)' : '#fca5a5' }}>
        {trendStr}
      </p>
    </div>
  )
}

interface FunnelStepProps {
  label: string
  value: number
  conv?: number
  color: string
}

function FunnelStep({ label, value, conv, color }: FunnelStepProps) {
  return (
    <div className="p-4 rounded-xl" style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${color}25`,
      borderTop: `2px solid ${color}`,
    }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#8892b0', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
        {value.toLocaleString()}
      </p>
      <p style={{ fontSize: 10, color: 'var(--muted)' }}>
        {conv !== undefined ? `${conv}% del paso anterior` : 'Últimos 30 días'}
      </p>
    </div>
  )
}

export default function MonthSummary(p: Props) {
  const events = p.events
  const fn = events ? {
    pv:  events.PageView.count_30d,
    vc:  events.ViewContent.count_30d,
    atc: events.AddToCart.count_30d,
    co:  events.InitiateCheckout.count_30d,
    pu:  events.Purchase.count_30d,
  } : null
  const conv = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0
  const cur = p.currency || '$'

  const roasPositive = p.avgRoas >= 1.5
  const roasColor = p.avgRoas >= 3 ? '#06d6a0' : p.avgRoas >= 1.5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="dash-anim-4 mb-6">
      <div className="mb-3">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Resumen del mes
        </h2>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>
          Cómo viene tu negocio en los últimos 30 días
        </p>
      </div>

      {/* ── Row 1: business KPIs ── */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <Kpi label="Inversión"      value={`${cur}${p.totalSpend.toFixed(0)}`}    trend={p.trendSpend}   Icon={DollarSign}  color="#e91e8c" positive={false} />
        <Kpi label="Ventas (rev)"   value={`${cur}${p.totalRevenue.toFixed(0)}`}  trend={p.trendRevenue} Icon={TrendingUp}  color="#06d6a0" positive />
        <Kpi label="ROAS"           value={p.avgRoas > 0 ? `${p.avgRoas.toFixed(1)}x` : '—'}            trend={p.trendRoas}    Icon={Target}      color={roasColor} positive={roasPositive} />
        <Kpi label="Compras"        value={String(p.totalConversions)}            trend={p.trendConv}    Icon={ShoppingCart} color="#62c4b0" positive />
        <Kpi label="Ticket prom."   value={`${cur}${p.avgTicket.toFixed(0)}`}                            Icon={CreditCard}   color="#f59e0b" positive />
      </div>

      {/* ── Row 2: funnel ── */}
      {fn ? (
        <div className="grid grid-cols-5 gap-4">
          <FunnelStep label="PageView"    value={fn.pv}  color="#62c4b0" />
          <FunnelStep label="ViewContent" value={fn.vc}  conv={conv(fn.vc, fn.pv)}  color="#3aa9d8" />
          <FunnelStep label="AddToCart"   value={fn.atc} conv={conv(fn.atc, fn.vc)} color="#f59e0b" />
          <FunnelStep label="Checkout"    value={fn.co}  conv={conv(fn.co, fn.atc)} color="#e91e8c" />
          <FunnelStep label="Purchase"    value={fn.pu}  conv={conv(fn.pu, fn.co)}  color="#06d6a0" />
        </div>
      ) : (
        <div className="card p-5 text-center">
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Configurá tu pixel para ver el funnel completo de tu negocio.
          </p>
        </div>
      )}
    </div>
  )
}
