// src/app/dashboard/campaigns/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Campaign, AdSetItem, AdCopyItem } from '@/types'
import CampaignActivateButton from '@/components/dashboard/CampaignActivateButton'
import CampaignPublishFlow from '@/components/dashboard/CampaignPublishFlow'
import { ArrowLeft, Target, DollarSign, Calendar, Globe, MessageCircle, LayoutGrid, Users, Zap } from 'lucide-react'

const OBJ_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS:  '👁 Reconocimiento',
  OUTCOME_TRAFFIC:    '🖱 Tráfico',
  OUTCOME_ENGAGEMENT: '💬 Engagement',
  OUTCOME_LEADS:      '📩 Leads',
  OUTCOME_SALES:      '🛒 Ventas',
  OUTCOME_APP_PROMOTION: '📱 App',
  CONVERSIONS:        '🛒 Conversiones',
  TRAFFIC:            '🖱 Tráfico',
  REACH:              '👁 Alcance',
  LEAD_GENERATION:    '📩 Leads',
}

const STRATEGY_COLORS: Record<string, string> = {
  TOFU: '#62c4b0',
  MOFU: '#62c4b0',
  BOFU: '#f59e0b',
}

const ANGLE_ICONS: Record<string, string> = {
  emocional: '💜', informativo: '📊', urgencia: '⚡', social_proof: '⭐',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'badge-active', paused: 'badge-paused',
    draft: 'badge-draft', error: 'badge-error', completed: 'badge-draft',
  }
  const labels: Record<string, string> = {
    active: '● Activa', paused: '● Pausada',
    draft: 'Borrador', error: '⚠ Error', completed: 'Completada',
  }
  return <span className={`badge ${map[status] || 'badge-draft'}`}>{labels[status] || status}</span>
}

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single() as { data: Campaign | null }

  if (!campaign) notFound()

  const adSets: AdSetItem[] = campaign.campaign_structure?.ad_sets || (campaign.ai_copies as any)?.campaign?.ad_sets || []
  const allAds: (AdCopyItem & { adSetName: string })[] = adSets.flatMap(s =>
    (s.ads || []).map(ad => ({ ...ad, adSetName: s.name }))
  )

  const isPublished = !!campaign.meta_campaign_id
  const strategyColor = STRATEGY_COLORS[campaign.strategy_type || 'TOFU']

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/dashboard/campaigns"
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-80"
          style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={14} /> Mis campañas
        </Link>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span className="text-sm truncate max-w-xs" style={{ color: 'var(--text)' }}>{campaign.name}</span>
      </div>

      {/* ── Main header card ── */}
      <div className="card p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              {campaign.strategy_type && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${strategyColor}20`, border: `1px solid ${strategyColor}40`, color: strategyColor }}>
                  {campaign.strategy_type}
                </span>
              )}
              <h1 className="text-xl font-bold truncate">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Creada el {new Date(campaign.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            {isPublished && (
              <CampaignActivateButton
                campaignId={campaign.id}
                metaCampaignId={campaign.meta_campaign_id}
                currentStatus={campaign.status}
              />
            )}
            <CampaignPublishFlow
              campaignId={campaign.id}
              isAlreadyPublished={isPublished}
              metaCampaignId={campaign.meta_campaign_id}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            { icon: Target,     label: 'Objetivo',    value: OBJ_LABELS[campaign.objective] || campaign.objective },
            { icon: DollarSign, label: 'Presupuesto', value: `$${campaign.daily_budget}/día` },
            { icon: Globe,      label: 'País',        value: campaign.target_country || '—' },
            { icon: Calendar,   label: 'Creada',      value: new Date(campaign.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="p-3.5 rounded-xl flex items-center gap-3"
                 style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-medium mt-0.5 truncate max-w-[120px]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Destination URL / WhatsApp */}
        {(campaign.destination_url || campaign.whatsapp_number) && (
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {campaign.destination_url && (
              <a href={campaign.destination_url} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-75"
                 style={{ color: 'var(--accent)' }}>
                <Globe size={12} /> {campaign.destination_url} ↗
              </a>
            )}
            {campaign.whatsapp_number && (
              <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--accent3)' }}>
                <MessageCircle size={12} /> WhatsApp: {campaign.whatsapp_number}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Performance metrics ── */}
      {(campaign.metrics?.spend || 0) > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Gasto',        value: `$${(campaign.metrics?.spend || 0).toFixed(0)}` },
            { label: 'ROAS',         value: campaign.metrics?.roas ? `${campaign.metrics.roas.toFixed(1)}x` : '—' },
            { label: 'Conversiones', value: String(campaign.metrics?.conversions || '—') },
            { label: 'CTR',          value: campaign.metrics?.ctr ? `${campaign.metrics.ctr.toFixed(1)}%` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="metric-card text-center" style={{ borderTop: `2px solid ${strategyColor}` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>{label}</p>
              <p className="text-xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Two-column layout for ads + strategy ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

        {/* Ad copies (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          {allAds.length > 0 ? (
            <>
              <h2 className="section-title flex items-center gap-2">
                <LayoutGrid size={15} strokeWidth={2} style={{ color: strategyColor }} />
                Anuncios generados ({allAds.length})
              </h2>
              {allAds.map((ad, i) => (
                <div key={i} className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{ANGLE_ICONS[ad.copy_angle] || '📝'}</span>
                    <span className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: 'var(--muted)' }}>
                      {ad.copy_angle}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
                      {ad.adSetName}
                    </span>
                  </div>

                  <p className="text-base font-bold mb-2">{ad.headline}</p>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>{ad.primary_text}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{ad.description}</span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-lg"
                          style={{ background: `${strategyColor}15`, border: `1px solid ${strategyColor}35`, color: strategyColor }}>
                      {ad.call_to_action}
                    </span>
                  </div>

                  {(ad as any).creative_suggestion && (
                    <p className="text-xs mt-3 pt-3 leading-relaxed"
                       style={{ color: 'var(--muted)', borderTop: '1px solid var(--border)' }}>
                      💡 {(ad as any).creative_suggestion}
                    </p>
                  )}
                </div>
              ))}
            </>
          ) : (
            /* Legacy copies display */
            campaign.ai_copies && (
              <div className="card p-5">
                <h2 className="section-title mb-4">✨ Copies generados</h2>
                <div className="space-y-3">
                  {(campaign.ai_copies as any).headlines?.map((h: string, i: number) => (
                    <div key={i} className="px-4 py-3 rounded-xl text-sm"
                         style={{ background: i === 0 ? 'rgba(233,30,140,0.10)' : 'var(--surface2)', border: `1px solid ${i === 0 ? 'rgba(233,30,140,0.30)' : 'var(--border)'}` }}>
                      <span className="text-[10px] font-bold uppercase mr-2"
                            style={{ color: i === 0 ? '#f9a8d4' : 'var(--muted)' }}>
                        {i === 0 ? '★ Principal' : `Var. ${i + 1}`}
                      </span>
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {!allAds.length && !campaign.ai_copies && (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Esta campaña todavía no tiene copies generados por IA.
              </p>
              <Link href="/dashboard/create" className="btn-primary mt-4 inline-flex">
                ✨ Generar copies
              </Link>
            </div>
          )}
        </div>

        {/* Strategy sidebar (1/3 width) */}
        <div className="space-y-4">
          {/* Ad sets */}
          {adSets.length > 0 && (
            <div className="card p-4">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Users size={14} strokeWidth={2} style={{ color: strategyColor }} />
                Conjuntos ({adSets.length})
              </h3>
              <div className="space-y-3">
                {adSets.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl"
                       style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                    <p className="text-xs font-semibold mb-1">{s.name}</p>
                    <div className="space-y-0.5">
                      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        👥 {s.targeting?.age_min}–{s.targeting?.age_max} años · {s.targeting?.geo_locations?.countries?.join(', ')}
                      </p>
                      {s.targeting?.advantage_plus && (
                        <p className="text-[11px]" style={{ color: '#62c4b0' }}>⚡ Advantage+</p>
                      )}
                      {s.targeting?.interests?.length > 0 && (
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                          🎯 {s.targeting.interests.slice(0, 2).map((x: any) => x.name).join(', ')}
                          {s.targeting.interests.length > 2 ? ` +${s.targeting.interests.length - 2}` : ''}
                        </p>
                      )}
                      {(s as any).requires_pixel && (
                        <p className="text-[11px]" style={{ color: '#f59e0b' }}>⚠ Requiere Pixel</p>
                      )}
                      <p className="text-[11px] font-medium" style={{ color: 'var(--muted)' }}>
                        💰 ${(s.daily_budget / 100).toFixed(0)}/día · {s.optimization_goal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated results */}
          {campaign.estimated_results && (
            <div className="card p-4">
              <h3 className="section-title mb-3 flex items-center gap-2">
                <Zap size={14} strokeWidth={2} style={{ color: strategyColor }} />
                Resultados estimados
              </h3>
              <div className="space-y-2">
                {Object.entries(campaign.estimated_results)
                  .filter(([, v]) => v && v !== 'N/A')
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-1.5"
                         style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-semibold">{String(v)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Product description */}
          {campaign.product_description && (
            <div className="card p-4">
              <h3 className="section-title mb-2">📝 Producto</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {campaign.product_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
