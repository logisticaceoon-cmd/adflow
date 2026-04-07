'use client'
// src/components/dashboard/MonthSummary.tsx
// Two rows of metrics: business KPIs (top) + funnel events (bottom).
// Migrated to unified design system. Uniform card base; status only on values.
import { DollarSign, TrendingUp, Target, ShoppingCart, CreditCard } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

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
  trendSpend?:      number
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
  valueStatus?: 'neutral' | 'good' | 'warning' | 'bad'
}

const STATUS_VALUE_COLOR: Record<string, string> = {
  neutral: 'var(--ds-text-primary)',
  good:    'var(--ds-color-success)',
  warning: 'var(--ds-color-warning)',
  bad:     'var(--ds-color-danger)',
}

function Kpi({ label, value, trend, Icon, valueStatus = 'neutral' }: KpiProps) {
  const trendStr = trend !== undefined && trend !== 0
    ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% vs mes anterior`
    : trend === 0 ? '— sin cambios' : 'Primer mes'
  const trendColor = trend === undefined
    ? 'var(--ds-text-muted)'
    : trend > 0
      ? 'var(--ds-color-success)'
      : trend < 0
        ? 'var(--ds-color-danger)'
        : 'var(--ds-text-muted)'

  return (
    <div style={{
      padding: 'var(--ds-space-lg)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      borderRadius: 'var(--ds-card-radius)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
      boxShadow: 'var(--ds-shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
        }}>
          {label}
        </p>
        <Icon size={16} style={{ color: 'var(--ds-text-secondary)', opacity: 0.6 }} strokeWidth={1.75} />
      </div>
      <p style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 26, fontWeight: 800,
        color: STATUS_VALUE_COLOR[valueStatus],
        letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: trendColor }}>
        {trendStr}
      </p>
    </div>
  )
}

interface FunnelStepProps {
  label: string
  value: number
  conv?: number
}

function FunnelStep({ label, value, conv }: FunnelStepProps) {
  const convStatus = conv === undefined
    ? 'var(--ds-text-muted)'
    : conv >= 30
      ? 'var(--ds-color-success)'
      : conv >= 10
        ? 'var(--ds-color-warning)'
        : 'var(--ds-color-danger)'

  return (
    <div style={{
      padding: 'var(--ds-space-md)',
      borderRadius: 'var(--ds-card-radius-sm)',
      background: 'var(--ds-card-bg)',
      border: '1px solid var(--ds-card-border)',
      backdropFilter: 'blur(var(--ds-card-blur))',
      WebkitBackdropFilter: 'blur(var(--ds-card-blur))',
    }}>
      <p style={{
        fontSize: 10, fontWeight: 700, color: 'var(--ds-text-label)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 18, fontWeight: 800,
        color: 'var(--ds-text-primary)', marginBottom: 4,
      }}>
        {value.toLocaleString()}
      </p>
      <p style={{ fontSize: 10, color: convStatus, fontWeight: 600 }}>
        {conv !== undefined ? `${conv}% del paso anterior` : 'Últimos 30 días'}
      </p>
    </div>
  )
}

function roasStatus(r: number): 'good' | 'warning' | 'bad' | 'neutral' {
  if (r >= 3)   return 'good'
  if (r >= 1.5) return 'warning'
  if (r > 0)    return 'bad'
  return 'neutral'
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

  return (
    <div className="dash-anim-4" style={{ marginBottom: 'var(--ds-space-lg)' }}>
      <SectionHeader
        title="Resumen del mes"
        subtitle="Cómo viene tu negocio en los últimos 30 días"
      />

      {/* Row 1: KPIs */}
      <div className="ds-grid-5" style={{ marginBottom: 'var(--ds-space-md)' }}>
        <Kpi label="Inversión"     value={`${cur}${p.totalSpend.toFixed(0)}`}    trend={p.trendSpend}   Icon={DollarSign} />
        <Kpi label="Ventas (rev)"  value={`${cur}${p.totalRevenue.toFixed(0)}`}  trend={p.trendRevenue} Icon={TrendingUp} valueStatus="good" />
        <Kpi label="ROAS"          value={p.avgRoas > 0 ? `${p.avgRoas.toFixed(1)}x` : '—'} trend={p.trendRoas} Icon={Target} valueStatus={roasStatus(p.avgRoas)} />
        <Kpi label="Compras"       value={String(p.totalConversions)}             trend={p.trendConv}    Icon={ShoppingCart} />
        <Kpi label="Ticket prom."  value={`${cur}${p.avgTicket.toFixed(0)}`}                              Icon={CreditCard} />
      </div>

      {/* Row 2: funnel — uniform cards, status only on conv % */}
      {fn ? (
        <div className="ds-grid-5">
          <FunnelStep label="PageView"    value={fn.pv} />
          <FunnelStep label="ViewContent" value={fn.vc}  conv={conv(fn.vc,  fn.pv)} />
          <FunnelStep label="AddToCart"   value={fn.atc} conv={conv(fn.atc, fn.vc)} />
          <FunnelStep label="Checkout"    value={fn.co}  conv={conv(fn.co,  fn.atc)} />
          <FunnelStep label="Purchase"    value={fn.pu}  conv={conv(fn.pu,  fn.co)} />
        </div>
      ) : (
        <div style={{
          padding: 'var(--ds-space-lg)',
          textAlign: 'center',
          background: 'var(--ds-card-bg)',
          border: '1px solid var(--ds-card-border)',
          borderRadius: 'var(--ds-card-radius)',
        }}>
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
            Configurá tu pixel para ver el funnel completo de tu negocio.
          </p>
        </div>
      )}
    </div>
  )
}
