'use client'
// src/components/dashboard/MonthSummary.tsx
// 7 business KPIs — no funnel events (those belong to /dashboard/pixel).
import { DollarSign, TrendingUp, Target, ShoppingCart, CreditCard, BarChart3, Users } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

interface Props {
  totalSpend:       number
  totalRevenue:     number
  totalConversions: number
  totalCarts:       number
  avgRoas:          number
  avgCpm:           number
  avgFrequency:     number
  trendSpend?:      number
  trendRevenue?:    number
  trendRoas?:       number
  trendConv?:       number
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

function freqStatus(f: number): 'good' | 'warning' | 'bad' | 'neutral' {
  if (f <= 0)   return 'neutral'
  if (f <= 3)   return 'good'
  if (f <= 3.5) return 'warning'
  return 'bad'
}

export default function MonthSummary(p: Props) {
  const cur = p.currency || '$'

  return (
    <div style={{ marginBottom: 40 }}>
      <SectionHeader
        title="Métricas del mes"
        subtitle="Últimos 30 días — solo negocio"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 'var(--ds-space-md)',
      }}>
        <Kpi label="Inversión"    value={`${cur}${p.totalSpend.toFixed(0)}`}    trend={p.trendSpend}   Icon={DollarSign}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
        <Kpi label="Facturación"  value={`${cur}${p.totalRevenue.toFixed(0)}`}  trend={p.trendRevenue} Icon={TrendingUp}   valueStatus="good"
             iconColor="var(--ds-color-success)" iconSoftBg="var(--ds-color-success-soft)"  iconSoftBorder="var(--ds-color-success-border)" />
        <Kpi label="Carritos"     value={String(p.totalCarts)}                                          Icon={ShoppingCart}
             iconColor="var(--ds-color-warning)" iconSoftBg="var(--ds-color-warning-soft)"  iconSoftBorder="var(--ds-color-warning-border)" />
        <Kpi label="Ventas"       value={String(p.totalConversions)}             trend={p.trendConv}    Icon={CreditCard}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
        <Kpi label="ROAS"         value={p.avgRoas > 0 ? `${p.avgRoas.toFixed(1)}x` : '—'} trend={p.trendRoas} Icon={Target} valueStatus={roasStatus(p.avgRoas)}
             iconColor="var(--ds-color-warning)" iconSoftBg="var(--ds-color-warning-soft)"  iconSoftBorder="var(--ds-color-warning-border)" />
        <Kpi label="CPM"          value={p.avgCpm > 0 ? `${cur}${p.avgCpm.toFixed(1)}` : '—'}          Icon={BarChart3}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
        <Kpi label="Frecuencia"   value={p.avgFrequency > 0 ? `${p.avgFrequency.toFixed(1)}x` : '—'}   Icon={Users} valueStatus={freqStatus(p.avgFrequency)}
             iconColor="var(--ds-color-primary)" iconSoftBg="var(--ds-color-primary-soft)"  iconSoftBorder="var(--ds-color-primary-border)" />
      </div>
    </div>
  )
}
