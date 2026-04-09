// src/app/dashboard/campaigns/[id]/page.tsx
// Premium campaign operations center: hero, executive summary, performance,
// structure, creative previews, action history, and recommendations.
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Campaign, AdSetItem, AdCopyItem, CampaignMetrics } from '@/types'
import CampaignActions from '@/components/dashboard/CampaignActions'
import CampaignPublishFlow from '@/components/dashboard/CampaignPublishFlow'
import CampaignDailyChart from '@/components/dashboard/CampaignDailyChart'
import SyncButton from '@/components/dashboard/SyncButton'
import SectionHeader from '@/components/ui/SectionHeader'
import DiagnosticBadge from '@/components/intelligence/DiagnosticBadge'
import ScalingBlocksChecklist from '@/components/intelligence/ScalingBlocksChecklist'
import RiskIndicator from '@/components/intelligence/RiskIndicator'
import ClientInsightCard from '@/components/intelligence/ClientInsightCard'
import FunnelHealthCard from '@/components/intelligence/FunnelHealthCard'
import { analyzeCampaign } from '@/lib/campaign-intelligence'
import { DEFAULT_SETTINGS } from '@/lib/strategy-settings'
import type { CampaignMetrics as IntelMetrics } from '@/lib/diagnostic-rules'
import { ChevronRight } from 'lucide-react'

// ── Status palette ────────────────────────────────────────────────────────
const STATUS_GRADIENTS: Record<string, { from: string; to: string; main: string; label: string; emoji: string }> = {
  active:    { from: 'var(--ds-color-success-soft)',  to: 'var(--ds-color-success-soft)',  main: 'var(--ds-color-success)', label: 'Activa',    emoji: '●' },
  paused:    { from: 'var(--ds-color-warning-soft)', to: 'rgba(245,158,11,0.04)', main: 'var(--ds-color-warning)', label: 'Pausada',   emoji: '⏸' },
  draft:     { from: 'rgba(148,163,184,0.18)',to: 'rgba(148,163,184,0.04)',main: '#94a3b8', label: 'Borrador',  emoji: '📝' },
  error:     { from: 'var(--ds-color-danger-border)',  to: 'rgba(239,68,68,0.04)',  main: 'var(--ds-color-danger)', label: 'Error',     emoji: '⚠' },
  completed: { from: 'rgba(148,163,184,0.18)',to: 'rgba(148,163,184,0.04)',main: '#94a3b8', label: 'Completada',emoji: '✓' },
}

const PHASE_COLORS: Record<string, { color: string; label: string }> = {
  F1: { color: '#3b82f6', label: 'F1 · Reconocimiento' },
  F2: { color: 'var(--ds-color-success)', label: 'F2 · Conversión' },
  F3: { color: '#a855f7', label: 'F3 · Remarketing' },
  F4: { color: '#06b6d4', label: 'F4 · WhatsApp' },
}

const STRATEGY_COLORS: Record<string, string> = {
  TOFU: '#3b82f6', MOFU: '#a855f7', BOFU: 'var(--ds-color-success)',
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatRelative(date: string | null | undefined): string {
  if (!date) return 'nunca'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace unos segundos'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} día${days !== 1 ? 's' : ''}`
}

function classifyPhase(name: string, strategyType?: string | null): keyof typeof PHASE_COLORS {
  const n = (name || '').toLowerCase()
  const s = (strategyType || '').toUpperCase()
  if (s === 'BOFU') return 'F2'
  if (s === 'MOFU') return 'F3'
  if (/remarketing|retargeting|\bf3\b/.test(n)) return 'F3'
  if (/whatsapp|mensaje|\bwa\b|\bf4\b/.test(n)) return 'F4'
  if (/reconocimiento|awareness|branding|\bf1\b/.test(n)) return 'F1'
  if (/venta|conversion|sales|\bf2\b/.test(n)) return 'F2'
  return 'F2'
}

function generateCampaignInsight(metrics: CampaignMetrics | null | undefined): { msg: string; color: string; icon: string } {
  if (!metrics || !metrics.spend) {
    return {
      msg: 'Esta campaña aún no tiene datos de rendimiento. Activala y esperá 24-48h para ver resultados.',
      color: '#94a3b8', icon: '⏳',
    }
  }
  const roas = metrics.roas || 0
  if (roas >= 3) return { msg: `Esta campaña está funcionando excelente con un ROAS de ${roas.toFixed(1)}x. Considerá escalar el presupuesto un 15-20% para maximizar resultados.`, color: 'var(--ds-color-success)', icon: '🔥' }
  if (roas >= 2) return { msg: `Buen rendimiento con ROAS de ${roas.toFixed(1)}x. Los números son saludables. Monitoreá los próximos días antes de escalar.`, color: 'var(--ds-color-success)', icon: '✅' }
  if (roas >= 1) return { msg: `La campaña está en punto de equilibrio (ROAS ${roas.toFixed(1)}x). Probá cambiar creativos o ajustar la audiencia para mejorar.`, color: 'var(--ds-color-warning)', icon: '⚠️' }
  if (roas > 0)  return { msg: `ROAS por debajo del equilibrio (${roas.toFixed(1)}x). Evaluá pausar esta campaña y redistribuir el presupuesto a las que mejor funcionan.`, color: 'var(--ds-color-danger)', icon: '🔴' }
  return { msg: 'Sin datos de ROAS todavía. Dale tiempo al algoritmo de Meta para optimizar.', color: '#94a3b8', icon: '⏳' }
}

function getCampaignRecommendations(metrics: CampaignMetrics | null | undefined): Array<{ icon: string; title: string; desc: string; color: string }> {
  const recs: Array<{ icon: string; title: string; desc: string; color: string }> = []
  if (!metrics?.spend) {
    recs.push({ icon: '▶', title: 'Activá la campaña', desc: 'Todavía no tiene datos. Activala para empezar a recopilar resultados.', color: 'var(--ds-color-success)' })
    return recs
  }
  const roas = metrics.roas || 0
  const ctr = metrics.ctr || 0
  if (roas >= 3) recs.push({ icon: '📈', title: 'Escalá el presupuesto', desc: `Con ROAS de ${roas.toFixed(1)}x, podés invertir más y obtener más ventas. Subí entre 15% y 20%.`, color: 'var(--ds-color-success)' })
  if (ctr > 0 && ctr < 1) recs.push({ icon: '🖼', title: 'Mejorá los creativos', desc: `Tu CTR es de ${ctr.toFixed(2)}%, por debajo del promedio. Probá imágenes o copies diferentes.`, color: 'var(--ds-color-warning)' })
  if (roas > 0 && roas < 1.5) recs.push({ icon: '⏸', title: 'Considerá pausar', desc: `El ROAS (${roas.toFixed(1)}x) está por debajo del equilibrio. Redistribuí el presupuesto a campañas más rentables.`, color: 'var(--ds-color-danger)' })
  if ((metrics.frequency || 0) > 3.5) recs.push({ icon: '🔄', title: 'Frecuencia alta — saturación', desc: `La frecuencia es ${(metrics.frequency || 0).toFixed(1)}. Tu audiencia está viendo mucho los mismos anuncios. Refrescá creativos.`, color: 'var(--ds-color-warning)' })
  if (recs.length === 0) recs.push({ icon: '✅', title: 'Todo en orden', desc: 'No detectamos acciones urgentes. Seguí monitoreando las métricas diariamente.', color: 'var(--ds-color-success)' })
  return recs
}

// ── Metric color rules ────────────────────────────────────────────────────
function colorForMetric(key: string, value: number): string {
  if (key === 'roas') return value >= 3 ? 'var(--ds-color-success)' : value >= 1.5 ? 'var(--ds-color-warning)' : value > 0 ? 'var(--ds-color-danger)' : '#94a3b8'
  if (key === 'ctr')  return value >= 2 ? 'var(--ds-color-success)' : value >= 1 ? 'var(--ds-color-warning)' : value > 0 ? 'var(--ds-color-danger)' : '#94a3b8'
  if (key === 'frequency') return value > 0 && value <= 3 ? 'var(--ds-color-success)' : value <= 3.5 ? 'var(--ds-color-warning)' : value > 0 ? 'var(--ds-color-danger)' : '#94a3b8'
  return '#fff'
}

// ── Action history descriptors ────────────────────────────────────────────
function describeAction(action: { action_type: string; status: string; previous_value: any; new_value: any; error_message: string | null }): { icon: string; title: string; sub: string } {
  const t = action.action_type
  const pv = action.previous_value || {}
  const nv = action.new_value || {}
  if (t === 'activate') return { icon: '▶', title: 'Campaña activada', sub: `Estado: ${pv.status || '—'} → ${nv.status || 'activa'}` }
  if (t === 'pause')    return { icon: '⏸', title: 'Campaña pausada', sub: `Estado: ${pv.status || '—'} → ${nv.status || 'pausada'}` }
  if (t === 'duplicate') return { icon: '✨', title: 'Campaña duplicada', sub: 'Se creó una copia editable en borrador' }
  if (t === 'scale_budget') {
    const prev = pv.daily_budget || 0
    const next = nv.daily_budget || 0
    const pct = prev > 0 ? Math.round(((next - prev) / prev) * 100) : 0
    const sign = pct >= 0 ? '+' : ''
    return { icon: '📈', title: 'Presupuesto escalado', sub: `De $${prev.toLocaleString('es')} a $${next.toLocaleString('es')}/día (${sign}${pct}%)` }
  }
  if (t === 'create')   return { icon: '✨', title: 'Campaña creada con IA', sub: '' }
  if (t === 'publish')  return { icon: '🚀', title: 'Publicada en Meta', sub: '' }
  return { icon: '📌', title: t, sub: '' }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [campaignRes, dailyRes, actionsRes, pixelRes, businessRes, automationRulesRes, automationExecRes] = await Promise.all([
    supabase.from('campaigns').select('*').eq('id', params.id).eq('user_id', user.id).maybeSingle(),
    supabase.from('campaign_metrics_daily').select('*').eq('campaign_id', params.id).order('date', { ascending: true }).limit(30),
    supabase.from('campaign_actions').select('*').eq('campaign_id', params.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('pixel_analysis').select('level, level_name').eq('user_id', user.id).maybeSingle(),
    supabase.from('business_profiles').select('currency').eq('user_id', user.id).maybeSingle(),
    supabase.from('automation_rules').select('id, name, description, rule_type, is_enabled, conditions, actions').eq('user_id', user.id).or(`entity_id.eq.${params.id},entity_id.is.null`),
    supabase.from('automation_executions').select('id, status, triggered_at, result_message, decision_snapshot, automation_rules(name, rule_type)').eq('user_id', user.id).eq('entity_id', params.id).order('triggered_at', { ascending: false }).limit(5),
  ])

  const campaign = campaignRes.data as Campaign | null
  if (!campaign) redirect('/dashboard/campaigns')

  const dailyMetrics = dailyRes.data || []
  const campaignActions = actionsRes.data || []
  const pixelAnalysis = pixelRes.data
  const currencySym = businessRes.data?.currency === 'USD' ? '$' : (businessRes.data?.currency || '$')
  const automationRules = (automationRulesRes.data || []) as unknown as Array<{
    id: string; name: string; description: string | null; rule_type: string; is_enabled: boolean;
    conditions: any; actions: any
  }>
  const automationExecutions = (automationExecRes.data || []) as unknown as Array<{
    id: string; status: string; triggered_at: string; result_message: string | null; decision_snapshot: any;
    automation_rules: { name: string; rule_type: string } | null
  }>

  const metrics = campaign.metrics || {}
  const status = campaign.status || 'draft'
  const statusMeta = STATUS_GRADIENTS[status] || STATUS_GRADIENTS.draft
  const phase = classifyPhase(campaign.name, campaign.strategy_type)
  const phaseMeta = PHASE_COLORS[phase]
  const strategyColor = STRATEGY_COLORS[campaign.strategy_type || 'TOFU']

  const adSets: AdSetItem[] = campaign.campaign_structure?.ad_sets || (campaign.ai_copies as any)?.campaign?.ad_sets || []
  const allAds: Array<AdCopyItem & { adSetName: string }> = adSets.flatMap(s =>
    (s.ads || []).map(ad => ({ ...ad, adSetName: s.name }))
  )

  const isPublished = !!campaign.meta_campaign_id
  const recommendations = getCampaignRecommendations(metrics)
  const createdAt = new Date(campaign.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  const lastSync = (metrics as any)?.last_sync || metrics.updated_at || null

  // Aggregated daily totals (use richer per-day data when available, fall back to metrics summary)
  const totalsFromDaily = dailyMetrics.reduce((acc: any, d: any) => {
    acc.spend          += Number(d.spend || 0)
    acc.impressions    += Number(d.impressions || 0)
    acc.reach          += Number(d.reach || 0)
    acc.clicks         += Number(d.clicks || 0)
    acc.view_content   += Number(d.view_content || 0)
    acc.add_to_cart    += Number(d.add_to_cart || 0)
    acc.initiate_checkout += Number(d.initiate_checkout || 0)
    acc.purchases      += Number(d.purchases || 0)
    acc.purchase_value += Number(d.purchase_value || 0)
    acc.frequencySum   += Number(d.frequency || 0)
    acc.daysWithFreq   += d.frequency ? 1 : 0
    return acc
  }, { spend: 0, impressions: 0, reach: 0, clicks: 0, view_content: 0, add_to_cart: 0, initiate_checkout: 0, purchases: 0, purchase_value: 0, frequencySum: 0, daysWithFreq: 0 })

  const hasDaily = dailyMetrics.length > 0
  const spend       = hasDaily ? totalsFromDaily.spend       : (metrics.spend || 0)
  const impressions = hasDaily ? totalsFromDaily.impressions : (metrics.impressions || 0)
  const reach       = hasDaily ? totalsFromDaily.reach       : (metrics.reach || 0)
  const frequency   = hasDaily && totalsFromDaily.daysWithFreq > 0 ? totalsFromDaily.frequencySum / totalsFromDaily.daysWithFreq : (metrics.frequency || 0)
  const clicks      = hasDaily ? totalsFromDaily.clicks      : (metrics.clicks || 0)
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : (metrics.ctr || 0)
  const cpc = clicks > 0 ? spend / clicks : (metrics.cpc || 0)
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : (metrics.cpm || 0)
  const purchases     = hasDaily ? totalsFromDaily.purchases      : (metrics.conversions || 0)
  const purchaseValue = hasDaily ? totalsFromDaily.purchase_value : 0
  const roas = spend > 0 ? (purchaseValue || (metrics.roas || 0) * spend) / spend : (metrics.roas || 0)
  const cpa = purchases > 0 ? spend / purchases : (metrics.cpa || 0)
  const convRate = clicks > 0 ? (purchases / clicks) * 100 : 0

  const metricsRow1: Array<{ label: string; value: string; tooltip: string; key?: string; raw?: number }> = [
    { label: 'Inversión',   value: `${currencySym}${spend.toLocaleString('es', { maximumFractionDigits: 0 })}`,        tooltip: 'Total gastado en esta campaña' },
    { label: 'Impresiones', value: impressions.toLocaleString('es'),                                                    tooltip: 'Veces que se mostraron tus anuncios' },
    { label: 'Alcance',     value: reach.toLocaleString('es'),                                                          tooltip: 'Personas únicas que vieron los anuncios' },
    { label: 'Frecuencia',  value: `${frequency.toFixed(1)}x`, tooltip: 'Promedio de veces que cada persona vio un anuncio. >3.5 = saturación', key: 'frequency', raw: frequency },
  ]
  const metricsRow2: Array<{ label: string; value: string; tooltip: string; key?: string; raw?: number }> = [
    { label: 'Clicks', value: clicks.toLocaleString('es'),                              tooltip: 'Total de clicks en los anuncios' },
    { label: 'CTR',    value: `${ctr.toFixed(2)}%`,                                     tooltip: 'Click-through rate. Bueno: ≥2%', key: 'ctr', raw: ctr },
    { label: 'CPC',    value: `${currencySym}${cpc.toFixed(2)}`,                        tooltip: 'Costo por click' },
    { label: 'CPM',    value: `${currencySym}${cpm.toFixed(2)}`,                        tooltip: 'Costo por mil impresiones' },
  ]
  const metricsRow3: Array<{ label: string; value: string; tooltip: string; key?: string; raw?: number }> = [
    { label: 'ViewContent', value: totalsFromDaily.view_content.toLocaleString('es'),       tooltip: 'Personas que vieron el contenido del producto' },
    { label: 'AddToCart',   value: totalsFromDaily.add_to_cart.toLocaleString('es'),        tooltip: 'Personas que agregaron al carrito' },
    { label: 'Checkout',    value: totalsFromDaily.initiate_checkout.toLocaleString('es'),  tooltip: 'Personas que iniciaron el checkout' },
    { label: 'Compras',     value: purchases.toLocaleString('es'),                          tooltip: 'Compras completadas' },
  ]
  const metricsRow4: Array<{ label: string; value: string; tooltip: string; key?: string; raw?: number }> = [
    { label: 'Valor compras', value: `${currencySym}${purchaseValue.toLocaleString('es', { maximumFractionDigits: 0 })}`, tooltip: 'Ingresos totales atribuidos' },
    { label: 'ROAS',          value: `${roas.toFixed(2)}x`, tooltip: 'Retorno por cada peso invertido. Excelente: ≥3x', key: 'roas', raw: roas },
    { label: 'CPA',           value: `${currencySym}${cpa.toFixed(2)}`, tooltip: 'Costo por adquisición (compra)' },
    { label: 'Conv. Rate',    value: `${convRate.toFixed(2)}%`, tooltip: 'Compras / clicks' },
  ]

  const kpiPills: Array<{ label: string; value: string }> = [
    { label: 'Presupuesto', value: `${currencySym}${Number(campaign.daily_budget || 0).toLocaleString('es')}/día` },
    { label: 'ROAS',        value: roas > 0 ? `${roas.toFixed(1)}x` : '—' },
    { label: 'Spend',       value: spend > 0 ? `${currencySym}${spend.toLocaleString('es', { maximumFractionDigits: 0 })}` : '—' },
    { label: 'Ventas',      value: purchases > 0 ? String(purchases) : '—' },
  ]

  const audienceLog = (metrics as any)?.audience_log as Array<string> | undefined

  // ── STRATEGIC INTELLIGENCE — feed the expert engine with real metrics ──
  const intelligenceMetrics: IntelMetrics = {
    spend,
    purchases,
    revenue: purchaseValue,
    roas,
    cpa,
    addToCart: totalsFromDaily.add_to_cart,
    initiateCheckout: totalsFromDaily.initiate_checkout,
    ctr,
    frequency,
    cpm,
    viewContent: totalsFromDaily.view_content,
    impressions,
    clicks,
    reach,
  }
  const intelligence = analyzeCampaign(intelligenceMetrics, DEFAULT_SETTINGS)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div className="module-enter module-enter-1 flex items-center gap-2 mb-5">
        <Link href="/dashboard/campaigns"
          className="text-sm transition-opacity hover:opacity-80"
          style={{ color: 'var(--ds-text-secondary)' }}>
          Campañas
        </Link>
        <ChevronRight size={14} style={{ color: 'var(--ds-card-border)' }} />
        <span className="text-sm truncate max-w-md" style={{ color: 'var(--ds-text-primary)' }}>{campaign.name}</span>
      </div>

      {/* ─── SECCIÓN A: HERO ─────────────────────────────────────────── */}
      <div className="module-enter module-enter-1" style={{
        position: 'relative',
        marginBottom: 32,
        borderRadius: 24, padding: '36px 40px',
        background:
          `linear-gradient(135deg, ${statusMeta.main}10 0%, rgba(10, 12, 28, 0.50) 50%, ${statusMeta.main}05 100%)`,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(32px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.4)',
        boxShadow: `var(--ds-shadow-md), 0 0 40px ${statusMeta.main}10`,
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.12) 60%, transparent 90%)',
          pointerEvents: 'none',
        }} />

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 28, fontWeight: 700, color: 'var(--ds-text-primary)',
          letterSpacing: '-0.02em', marginBottom: 14, lineHeight: 1.15,
        }}>
          {campaign.name}
        </h1>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '5px 12px', borderRadius: 99,
            background: `${statusMeta.main}20`, color: statusMeta.main,
            border: `1px solid ${statusMeta.main}55`,
          }}>
            {statusMeta.emoji} {statusMeta.label}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '5px 12px', borderRadius: 99,
            background: `${phaseMeta.color}20`, color: phaseMeta.color,
            border: `1px solid ${phaseMeta.color}55`,
          }}>
            {phaseMeta.label}
          </span>
          {campaign.strategy_type && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '5px 12px', borderRadius: 99,
              background: `${strategyColor}20`, color: strategyColor,
              border: `1px solid ${strategyColor}55`,
            }}>
              {campaign.strategy_type}
            </span>
          )}
          {pixelAnalysis?.level != null && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '5px 12px', borderRadius: 99,
              background: 'rgba(255,255,255,0.05)', color: 'var(--ds-text-secondary)',
              border: '1px solid rgba(255,255,255,0.10)',
            }}>
              Nivel {pixelAnalysis.level} · {pixelAnalysis.level_name}
            </span>
          )}
        </div>

        {/* Inline KPIs */}
        <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 22 }}>
          {kpiPills.map(k => (
            <div key={k.label}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{k.label}</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff' }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Actions row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          <CampaignActions
            campaignId={campaign.id}
            campaignName={campaign.name}
            status={status}
            metaCampaignId={campaign.meta_campaign_id}
            dailyBudget={Number(campaign.daily_budget) || 0}
            currency={currencySym}
            lastSync={lastSync}
          />
          {!isPublished && (
            <CampaignPublishFlow
              campaignId={campaign.id}
              isAlreadyPublished={isPublished}
              metaCampaignId={campaign.meta_campaign_id}
            />
          )}
        </div>

        {/* Footer info */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 11, color: 'var(--ds-text-secondary)',
        }}>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <span>📅 Creada el {createdAt}</span>
            <span>{isPublished ? `✓ Publicada en Meta` : '○ No publicada todavía'}</span>
            <span>🔄 Última sync: {formatRelative(lastSync)}</span>
          </div>
          <SyncButton variant="compact" />
        </div>
      </div>

      {/* ─── SECCIÓN B: INTELIGENCIA ESTRATÉGICA ─────────────────────── */}
      <div className="module-enter module-enter-2" style={{ marginBottom: 'var(--ds-space-2xl)' }}>
        <SectionHeader
          title="Inteligencia estratégica"
          subtitle="Diagnóstico experto basado en la evaluación por bloques del workbook V1.0"
        />

        {/* Row 1 — diagnostic badge + risk indicator */}
        <div className="ds-grid-2" style={{ marginBottom: 'var(--ds-space-lg)' }}>
          <DiagnosticBadge
            diagnosticType={intelligence.diagnosticType}
            ruleId={intelligence.ruleId}
            ruleLabel={intelligence.ruleLabel}
            roasLevel={intelligence.roasLevel}
            frequencyLevel={intelligence.frequencyLevel}
          />
          <RiskIndicator
            riskLevel={intelligence.riskLevel}
            motivo={intelligence.motivo}
          />
        </div>

        {/* Row 2 — scaling blocks + funnel health */}
        <div className="ds-grid-2" style={{ marginBottom: 'var(--ds-space-lg)' }}>
          <ScalingBlocksChecklist
            bloqueA={intelligence.scalingEvaluation.bloqueA}
            bloqueB={intelligence.scalingEvaluation.bloqueB}
            bloqueC={intelligence.scalingEvaluation.bloqueC}
            bloqueCplus={intelligence.scalingEvaluation.bloqueCplus}
            bloqueCfinal={intelligence.scalingEvaluation.bloqueCfinal}
            canScale={intelligence.canScale}
            scalePctSuggested={intelligence.scalePctSuggested}
            riskLevel={intelligence.riskLevel}
            motivo={intelligence.motivo}
          />
          <FunnelHealthCard
            addToCart={totalsFromDaily.add_to_cart}
            initiateCheckout={totalsFromDaily.initiate_checkout}
            purchases={purchases}
            ratioPayMin={DEFAULT_SETTINGS.ratio_pago_min}
            ratioCompraMin={DEFAULT_SETTINGS.ratio_compra_min}
          />
        </div>

        {/* Client message — expert template */}
        {intelligence.clientMessage && (
          <div style={{ marginBottom: 'var(--ds-space-lg)' }}>
            <ClientInsightCard
              subject={intelligence.clientMessage.subject}
              body={intelligence.clientMessage.body}
              tone={intelligence.clientMessage.tone}
            />
          </div>
        )}

        {/* Next best action card */}
        <div style={{
          padding: 'var(--ds-space-lg)',
          borderRadius: 'var(--ds-card-radius)',
          background: 'var(--ds-card-bg)',
          border: '1px solid var(--ds-card-border)',
          borderLeft: '3px solid var(--ds-color-primary)',
          backdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
          WebkitBackdropFilter: 'blur(var(--ds-card-blur)) saturate(1.2)',
          boxShadow: 'var(--ds-shadow-sm)',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}>
          <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
            {intelligence.nextBestAction.type === 'scale'    ? '📈'
             : intelligence.nextBestAction.type === 'pause'  ? '⏸'
             : intelligence.nextBestAction.type === 'optimize' ? '🔧'
             : intelligence.nextBestAction.type === 'observe' ? '👁'
             : '📊'}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 10, fontWeight: 600, color: 'var(--ds-color-primary)',
              textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 4,
            }}>
              Acción recomendada ·{' '}
              {intelligence.nextBestAction.urgency === 'high' ? 'Urgente'
                : intelligence.nextBestAction.urgency === 'medium' ? 'Importante' : 'Baja'}
            </p>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 15, fontWeight: 600,
              color: 'var(--ds-text-primary)', marginBottom: 4, lineHeight: 1.3,
            }}>
              {intelligence.nextBestAction.label}
            </p>
            <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.5 }}>
              {intelligence.nextBestAction.description}
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN C: RENDIMIENTO DETALLADO ─────────────────────────── */}
      <div className="module-enter module-enter-3 card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Rendimiento detallado
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
          Métricas agregadas {hasDaily ? `de los últimos ${dailyMetrics.length} días` : 'de la campaña'}
        </p>

        {/* Metric grid 4x4 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[...metricsRow1, ...metricsRow2, ...metricsRow3, ...metricsRow4].map((m, idx) => {
            const valueColor = m.key && m.raw != null ? colorForMetric(m.key, m.raw) : '#fff'
            return (
              <div key={`${m.label}-${idx}`}
                title={m.tooltip}
                style={{
                  padding: '14px 12px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  cursor: 'help',
                }}>
                <p style={{
                  fontSize: 9, fontWeight: 700, color: 'var(--ds-text-secondary)',
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
                }}>
                  {m.label}
                </p>
                <p style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
                  color: valueColor, lineHeight: 1.1,
                }}>
                  {m.value}
                </p>
              </div>
            )
          })}
        </div>

        {/* Daily chart */}
        <div style={{
          padding: 18, borderRadius: 14,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{
            fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
            color: '#fff', marginBottom: 12,
          }}>
            Evolución diaria
          </p>
          <CampaignDailyChart data={dailyMetrics as any} currency={currencySym} />
        </div>
      </div>

      {/* ─── SECCIÓN D: ESTRUCTURA INTERNA ─────────────────────────────── */}
      <div className="module-enter module-enter-4 card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Estructura de la campaña
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
          Cómo está organizada tu campaña en Meta
        </p>

        {adSets.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {adSets.map((s, i) => {
              const adsetMetaId = ((campaign as unknown as { meta_adset_ids?: string[] }).meta_adset_ids || [])[i]
              return (
                <div key={i} style={{
                  padding: '18px 20px',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>🎯</span>
                    <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      Conjunto {i + 1}: {s.name}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12, fontSize: 11, color: 'var(--ds-text-secondary)' }}>
                    {adsetMetaId && <span>Meta ID: <span style={{ color: '#fff', fontFamily: 'monospace' }}>{adsetMetaId}</span></span>}
                    <span>Estado: {statusMeta.label}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 11 }}>
                      <p style={{ color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Público</p>
                      <p style={{ color: '#fff' }}>
                        {s.targeting?.advantage_plus
                          ? '⚡ Advantage+ Audience'
                          : s.targeting?.interests?.length
                            ? `Intereses (${s.targeting.interests.length})`
                            : 'Audiencia amplia'}
                      </p>
                      <p style={{ color: 'var(--ds-text-secondary)', fontSize: 10, marginTop: 2 }}>
                        {s.targeting?.age_min}–{s.targeting?.age_max} años · {s.targeting?.geo_locations?.countries?.join(', ')}
                      </p>
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <p style={{ color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Presupuesto</p>
                      <p style={{ color: '#fff' }}>{currencySym}{(s.daily_budget / 100).toLocaleString('es', { maximumFractionDigits: 0 })}/día</p>
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <p style={{ color: 'var(--ds-text-secondary)', marginBottom: 2 }}>Optimización</p>
                      <p style={{ color: '#fff' }}>{s.optimization_goal}</p>
                      <p style={{ color: 'var(--ds-text-secondary)', fontSize: 10, marginTop: 2 }}>Billing: {s.billing_event}</p>
                    </div>
                  </div>
                  {s.ads?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginBottom: 6 }}>Anuncios ({s.ads.length}):</p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {s.ads.map((ad, k) => (
                          <p key={k} style={{ fontSize: 11, color: '#fff' }}>
                            📄 Ad {k + 1}: <span style={{ color: 'var(--ds-text-secondary)' }}>{ad.headline || ad.copy_angle}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {audienceLog && audienceLog.length > 0 && (
              <div style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.20)',
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Decisiones de audiencia
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {audienceLog.map((line, i) => (
                    <p key={i} style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>• {line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>Esta campaña todavía no tiene estructura definida.</p>
        )}
      </div>

      {/* ─── SECCIÓN E: PREVIEWS DE CREATIVOS ─────────────────────────── */}
      {allAds.length > 0 && (
        <div className="module-enter module-enter-5 card p-6 mb-6">
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            Creativos de la campaña
          </h2>
          <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
            {allAds.length} anuncio{allAds.length !== 1 ? 's' : ''} generado{allAds.length !== 1 ? 's' : ''} con IA
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {allAds.slice(0, 6).map((ad, i) => {
              const img = (campaign.creative_urls || [])[i]
              return (
                <div key={i} style={{
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: 140,
                    background: img
                      ? `url(${img}) center/cover`
                      : `linear-gradient(135deg, ${strategyColor}15, ${strategyColor}05)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {!img && <span style={{ fontSize: 36, opacity: 0.5 }}>🖼</span>}
                  </div>
                  <div style={{ padding: 14 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      📝 Copy principal
                    </p>
                    <p style={{ fontSize: 12, color: '#fff', lineHeight: 1.4, marginBottom: 10 }}>
                      {ad.primary_text}
                    </p>
                    <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--ds-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      📌 Headline
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
                      {ad.headline}
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '4px 10px', borderRadius: 99,
                        background: `${strategyColor}15`, color: strategyColor,
                        border: `1px solid ${strategyColor}40`,
                      }}>
                        🔗 {ad.call_to_action}
                      </span>
                      {campaign.destination_url && (
                        <span style={{ fontSize: 10, color: 'var(--ds-text-secondary)', fontFamily: 'monospace' }}>
                          🌐 {campaign.destination_url.replace(/^https?:\/\//, '').slice(0, 22)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {allAds.length > 6 && (
            <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', textAlign: 'center', marginTop: 14 }}>
              Mostrando 6 de {allAds.length} creativos
            </p>
          )}
        </div>
      )}

      {/* ─── SECCIÓN F: HISTORIAL DE ACCIONES ─────────────────────────── */}
      <div className="module-enter module-enter-6 card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Historial de la campaña
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
          Todas las acciones realizadas
        </p>

        {campaignActions.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
            {campaignActions.map((a: any, i: number) => {
              const desc = describeAction(a)
              const date = new Date(a.created_at).toLocaleString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              const isError = a.status === 'failed'
              return (
                <div key={a.id || i} style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  paddingBottom: 14,
                  borderBottom: i < campaignActions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, flexShrink: 0,
                    borderRadius: '50%',
                    background: isError ? 'var(--ds-color-danger-soft)' : 'var(--ds-card-border)',
                    border: isError ? '1px solid var(--ds-color-danger-border)' : '1px solid var(--ds-card-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {desc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, color: 'var(--ds-text-secondary)', marginBottom: 2 }}>📅 {date}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: isError ? 'var(--ds-color-danger)' : '#fff' }}>
                      {desc.title}{isError ? ' — falló' : ''}
                    </p>
                    {desc.sub && <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', marginTop: 2 }}>{desc.sub}</p>}
                    {a.error_message && <p style={{ fontSize: 11, color: 'var(--ds-color-danger)', marginTop: 2 }}>{a.error_message}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
            El historial se irá llenando a medida que operes esta campaña.
          </p>
        )}
      </div>

      {/* ─── SECCIÓN H: AUTOMATIZACIONES ACTIVAS ─────────────────────── */}
      <div className="module-enter module-enter-7 card p-6 mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
            ⚡ Automatizaciones
          </h2>
          <Link href="/dashboard/automation" style={{
            fontSize: 12, fontWeight: 600, color: 'var(--ds-color-primary)',
            textDecoration: 'none',
          }}>
            Gestionar →
          </Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
          Reglas que aplican a esta campaña y ejecuciones recientes
        </p>

        {automationRules.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--ds-text-muted)' }}>
            No hay automatizaciones configuradas para esta campaña. Creá una desde la página de automatización.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: automationExecutions.length > 0 ? 18 : 0 }}>
            {automationRules.map(r => (
              <div key={r.id} style={{
                padding: '12px 16px',
                borderRadius: 'var(--ds-card-radius-sm)',
                background: 'var(--ds-bg-elevated)',
                border: '1px solid var(--ds-card-border)',
                display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'space-between',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ds-text-primary)' }}>{r.name}</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: r.is_enabled ? 'var(--ds-color-success-soft)' : 'rgba(255,255,255,0.04)',
                      color: r.is_enabled ? 'var(--ds-color-success)' : 'var(--ds-text-muted)',
                      border: r.is_enabled ? '1px solid var(--ds-color-success-border)' : '1px solid var(--ds-card-border)',
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                      {r.is_enabled ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {r.description && (
                    <p style={{ fontSize: 11, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>{r.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {automationExecutions.length > 0 && (
          <div>
            <p style={{
              fontSize: 10, fontWeight: 600, color: 'var(--ds-text-label)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
            }}>
              Ejecuciones recientes
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {automationExecutions.map(e => (
                <div key={e.id} style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--ds-card-radius-sm)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--ds-card-border)',
                  display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
                  fontSize: 11,
                }}>
                  <span style={{ color: 'var(--ds-text-secondary)' }}>
                    {new Date(e.triggered_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ color: 'var(--ds-text-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.automation_rules?.name || e.result_message || 'Ejecución'}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: e.status === 'executed' ? 'var(--ds-color-success-soft)'
                      : e.status === 'failed' ? 'var(--ds-color-danger-soft)'
                      : e.status === 'rejected' ? 'rgba(255,255,255,0.04)'
                      : 'var(--ds-color-primary-soft)',
                    color: e.status === 'executed' ? 'var(--ds-color-success)'
                      : e.status === 'failed' ? 'var(--ds-color-danger)'
                      : e.status === 'rejected' ? 'var(--ds-text-muted)'
                      : 'var(--ds-color-primary)',
                    border: `1px solid ${
                      e.status === 'executed' ? 'var(--ds-color-success-border)'
                      : e.status === 'failed' ? 'var(--ds-color-danger-border)'
                      : e.status === 'rejected' ? 'var(--ds-card-border)'
                      : 'var(--ds-color-primary-border)'
                    }`,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── SECCIÓN G: RECOMENDACIONES ─────────────────────────────── */}
      <div className="module-enter module-enter-7 card p-6 mb-6">
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          Recomendaciones para esta campaña
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', marginBottom: 20 }}>
          Acciones sugeridas en base al rendimiento actual
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recommendations.map((r, i) => (
            <div key={i} style={{
              padding: '16px 18px',
              borderRadius: 14,
              background: `${r.color}08`,
              border: `1px solid ${r.color}30`,
              display: 'flex', gap: 14, alignItems: 'center',
            }}>
              <div style={{
                width: 44, height: 44, flexShrink: 0,
                borderRadius: '50%',
                background: `${r.color}15`,
                border: `1px solid ${r.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>
                {r.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                  {r.title}
                </p>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.4 }}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
