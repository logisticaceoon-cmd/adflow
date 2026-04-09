'use client'
// src/components/dashboard/MonthSummary.tsx
// Quick-glance monthly KPIs. No funnel breakdown here — that belongs to
// /dashboard/pixel. A single optional funnel one-liner under the metrics.
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
  iconColor?: string
  iconSoftBg?: string
  iconSoftBorder?: string
  valueStatus?: 'neutral' | 'good' | 'warning' | 'bad'
}

const STATUS_VALUE_COLOR: Record<string, string> = {
  neutral: 'var(--ds-text-primary)',
  good:    'var(--ds-color-success)',
  warning: 'var(--ds-color-warning)',
  bad:     'var(--ds-color-danger)',
}

function Kpi({ label, value, trend, Icon, iconColor, iconSoftBg, iconSoftBorder, valueStatus = 'neutral' }: KpiProps) {
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
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--ds-text-label)',
        }}>
          {label}
        </p>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: iconSoftBg || 'var(--ds-color-primary-soft)',
          border: `1px solid ${iconSoftBorder || 'var(--ds-color-primary-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={13} style={{ color: iconColor || 'var(--ds-color-primary)', opacity: 0.85 }} strokeWidth={2} />
        </div>
      </div>
      <p style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 24, fontWeight: 600,
        color: STATUS_VALUE_COLOR[valueStatus],
        letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 4,
      }}>
        {value}
      </p>
      <p style={{ fontSize: 11, color: trendColor, lineHeight: 1.3 }}>
        {trendStr}
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
  const cur = p.currency || '$'
  const events = p.events
  const pv = events?.PageView.count_30d ?? 0
  const purchases = events?.Purchase.count_30d ?? p.totalConversions
  const convRate = pv > 0 ? ((purchases / pv) * 100).toFixed(2) : null

  return (
    <div className="module-enter module-enter-3" style={{ marginBottom: 40 }}>
      <SectionHeader
        title="Resumen del mes"
        subtitle="Últimos 30 días"
      />

      {/* KPI row — 5 floating glass cards, one icon color per metric */}
      <div className="ds-grid-5">
        <Kpi label="Inversión"    value={`${cur}${p.totalSpend.toFixed(0)}`}    trend={p.trendSpend}   Icon={DollarSign}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
        <Kpi label="Ventas (rev)" value={`${cur}${p.totalRevenue.toFixed(0)}`}  trend={p.trendRevenue} Icon={TrendingUp}   valueStatus="good"
             iconColor="var(--ds-color-success)" iconSoftBg="var(--ds-color-success-soft)"  iconSoftBorder="var(--ds-color-success-border)" />
        <Kpi label="ROAS"         value={p.avgRoas > 0 ? `${p.avgRoas.toFixed(1)}x` : '—'} trend={p.trendRoas} Icon={Target} valueStatus={roasStatus(p.avgRoas)}
             iconColor="var(--ds-color-warning)" iconSoftBg="var(--ds-color-warning-soft)"  iconSoftBorder="var(--ds-color-warning-border)" />
        <Kpi label="Compras"      value={String(p.totalConversions)}             trend={p.trendConv}    Icon={ShoppingCart}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
        <Kpi label="Ticket prom." value={`${cur}${p.avgTicket.toFixed(0)}`}                             Icon={CreditCard}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
      </div>

      {/* Funnel one-liner — optional summary, not a full grid */}
      {events && convRate !== null && (
        <p style={{
          marginTop: 14,
          fontSize: 12,
          color: 'var(--ds-text-muted)',
          textAlign: 'center',
          fontStyle: 'italic',
        }}>
          Funnel: {pv.toLocaleString()} visitas → {purchases.toLocaleString()} compras ({convRate}%)
        </p>
      )}
    </div>
  )
}
