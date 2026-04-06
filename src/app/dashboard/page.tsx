// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign, BusinessProfile, PlanType } from '@/types'
import SpendChart from '@/components/dashboard/SpendChart'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import { TrendingUp, DollarSign, Target, Megaphone, ArrowRight, Sparkles, Settings, Images, Zap, CreditCard } from 'lucide-react'
import RecommendationsList from '@/components/dashboard/RecommendationsList'
import { PLAN_CREDITS } from '@/lib/plans'
import { ADS_PER_CAMPAIGN_MIN, ADS_PER_CAMPAIGN_MAX } from '@/lib/credit-costs'

const AI_TIPS = [
  'Los anuncios con video generan 3x más engagement que las imágenes estáticas en Instagram.',
  'El mejor horario para publicar en Argentina es entre 7-9 AM y 8-10 PM.',
  'Usar emojis en el texto puede aumentar el CTR hasta un 25% en ciertos rubros.',
  'Las audiencias de retargeting tienen 70% mayor tasa de conversión que las de prospección.',
  'Un ROAS de 3x o más indica una campaña rentable para la mayoría de los negocios.',
  'Los anuncios con precio explícito tienen mayor CTR y menor coste por lead calificado.',
  'El Pixel tarda 7 días en optimizarse. No hagas cambios bruscos antes de ese período.',
]

function MetricCard({ label, value, change, colorVar, Icon, positive = true, animClass = '' }: {
  label: string; value: string; change: string; colorVar: string
  Icon: React.ElementType; positive?: boolean; animClass?: string
}) {
  return (
    <div className={`metric-card group ${animClass}`}
      style={{
        borderTop: `2px solid ${colorVar}`,
        /* Per-color layered glow — the accent color bleeds softly through the card */
        boxShadow: `
          0 0 0 1px rgba(255,255,255,0.05) inset,
          0 10px 40px rgba(0,0,0,0.32),
          0 0 40px ${colorVar}14,
          0 0 25px rgba(98,196,176,0.06),
          0 -2px 16px ${colorVar}18
        `.replace(/\s+/g, ' '),
      }}>
      {/* Icon + label row */}
      <div className="flex items-center justify-between mb-4">
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8892b0' }}>
          {label}
        </p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
          style={{
            background: `${colorVar}22`,
            border: `1px solid ${colorVar}45`,
            boxShadow: `0 0 20px ${colorVar}45, 0 0 40px ${colorVar}16`,
          }}>
          <Icon size={16} style={{ color: colorVar, filter: `drop-shadow(0 0 6px ${colorVar})` }} strokeWidth={1.75} />
        </div>
      </div>

      {/* Big value */}
      <p className="stat-value mb-2">{value}</p>

      {/* Change indicator */}
      <div className="flex items-center gap-1.5">
        <span style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: positive ? 'var(--accent3)' : 'var(--danger)',
          boxShadow: positive ? '0 0 8px rgba(6,214,160,0.80)' : '0 0 8px rgba(239,68,68,0.80)',
        }} />
        <p style={{ fontSize: 12, color: positive ? 'var(--accent3)' : 'var(--danger)' }}>{change}</p>
      </div>

      {/* Bottom glow line */}
      <div style={{
        position: 'absolute', bottom: 0, left: '8%', right: '8%', height: 1,
        background: `linear-gradient(90deg, transparent, ${colorVar}55, transparent)`,
      }} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string>    = { active: 'badge-active', paused: 'badge-paused', draft: 'badge-draft', error: 'badge-error', completed: 'badge-draft' }
  const labels: Record<string, string> = { active: '● Activa', paused: '● Pausada', draft: 'Borrador', error: '⚠ Error', completed: 'Completada' }
  return <span className={`badge ${map[status] || 'badge-draft'}`}>{labels[status] || status}</span>
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaigns }, { data: bp }, { data: profileData }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('business_profiles').select('selected_ad_account_id,business_name').eq('user_id', user!.id).maybeSingle(),
    supabase.from('profiles').select('plan, credits_total, credits_used').eq('id', user!.id).single(),
  ])

  // Credits projection
  const plan             = (profileData?.plan as PlanType) || 'free'
  const creditsTotal     = profileData?.credits_total ?? PLAN_CREDITS[plan] ?? 10
  const creditsUsed      = profileData?.credits_used  ?? 0
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed)
  const creditsPct       = creditsTotal > 0 ? Math.round((creditsUsed / creditsTotal) * 100) : 0
  const projCampaigns    = creditsRemaining
  const projAdsMin       = creditsRemaining * ADS_PER_CAMPAIGN_MIN
  const projAdsMax       = creditsRemaining * ADS_PER_CAMPAIGN_MAX

  const typed           = (campaigns || []) as Campaign[]
  const businessProfile = bp as BusinessProfile | null

  const activeCampaigns = typed.filter(c => c.status === 'active')
  const totalSpend      = activeCampaigns.reduce((s, c) => s + (c.metrics?.spend || 0), 0)
  const totalRevenue    = activeCampaigns.reduce((s, c) => s + ((c.metrics?.roas || 0) * (c.metrics?.spend || 0)), 0)
  const avgRoas         = activeCampaigns.length > 0
    ? activeCampaigns.reduce((s, c) => s + (c.metrics?.roas || 0), 0) / activeCampaigns.length
    : 0

  const hasData        = typed.length > 0
  const showOnboarding = !hasData && !businessProfile?.selected_ad_account_id
  const todayTip       = AI_TIPS[new Date().getDay()]

  return (
    <>
      <OnboardingWizard show={showOnboarding} />

      <div>
        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-8 dash-anim-1">
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e91e8c', marginBottom: 6 }}>
              Dashboard · AdFlow
            </p>
            <h1 className="page-title mb-1.5">Resumen general</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {activeCampaigns.length > 0 ? (
                <>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent3)', display: 'inline-block', boxShadow: '0 0 6px rgba(6,214,160,0.8)' }} className="glow-dot" />
                  <span style={{ color: 'var(--accent3)' }}>{activeCampaigns.length} campaña{activeCampaigns.length !== 1 ? 's' : ''} activa{activeCampaigns.length !== 1 ? 's' : ''}</span>
                  <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span> Últimos 30 días
                </>
              ) : 'Sin campañas activas · Últimos 30 días'}
            </p>
          </div>
          <Link href="/dashboard/create" className="btn-primary">
            <Sparkles size={15} /> Nueva campaña con IA
          </Link>
        </div>

        {/* ── Metrics grid ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Gasto total"
            value={hasData ? `$${totalSpend.toFixed(0)}` : '$0'}
            change={hasData ? '↑ 12% vs mes anterior' : 'Creá tu primera campaña'}
            colorVar="#e91e8c" Icon={DollarSign} animClass="dash-anim-1"
          />
          <MetricCard
            label="Ingresos estimados"
            value={hasData ? `$${totalRevenue.toFixed(0)}` : '$0'}
            change={hasData ? '↑ 28% vs mes anterior' : 'Se calcula con ROAS'}
            colorVar="#06d6a0" Icon={TrendingUp} animClass="dash-anim-2"
          />
          <MetricCard
            label="ROAS promedio"
            value={hasData ? `${avgRoas.toFixed(1)}x` : '—'}
            change={hasData ? '↑ 0.8x vs mes anterior' : 'Return on ad spend'}
            colorVar="#f59e0b" Icon={Target} animClass="dash-anim-3" positive={hasData}
          />
          <MetricCard
            label="Campañas activas"
            value={String(activeCampaigns.length)}
            change={`${typed.length} total en la plataforma`}
            colorVar="#62c4b0" Icon={Megaphone} animClass="dash-anim-4" positive={activeCampaigns.length > 0}
          />
        </div>

        {/* ── Credits projection widget ── */}
        <div className="mb-6 dash-anim-5">
          <Link href="/dashboard/billing" style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
              borderRadius: 18, padding: '16px 22px',
              background: creditsRemaining === 0
                ? 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(220,38,38,0.05) 100%)'
                : creditsPct >= 80
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(234,27,126,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(234,27,126,0.08) 0%, rgba(98,196,176,0.06) 60%, rgba(234,27,126,0.03) 100%)',
              border: creditsRemaining === 0
                ? '1px solid rgba(239,68,68,0.30)'
                : creditsPct >= 80
                  ? '1px solid rgba(245,158,11,0.28)'
                  : '1px solid rgba(234,27,126,0.18)',
              backdropFilter: 'blur(16px)',
              display: 'flex', alignItems: 'center', gap: 20,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* top glow line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: creditsRemaining === 0
                  ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.50), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(234,27,126,0.45), rgba(98,196,176,0.30), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: creditsRemaining === 0 ? 'rgba(239,68,68,0.15)' : 'rgba(234,27,126,0.15)',
                border: creditsRemaining === 0 ? '1px solid rgba(239,68,68,0.30)' : '1px solid rgba(234,27,126,0.30)',
                boxShadow: creditsRemaining === 0 ? '0 0 14px rgba(239,68,68,0.25)' : '0 0 14px rgba(234,27,126,0.25)',
              }}>
                <CreditCard size={18} style={{
                  color: creditsRemaining === 0 ? '#f87171' : '#f9a8d4',
                  filter: `drop-shadow(0 0 4px ${creditsRemaining === 0 ? 'rgba(239,68,68,0.60)' : 'rgba(234,27,126,0.60)'})`,
                }} />
              </div>

              {/* Credit counts */}
              <div style={{ flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8892b0', marginBottom: 2 }}>
                  Créditos IA disponibles
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{
                    fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
                    color: creditsRemaining === 0 ? '#f87171' : '#ffffff',
                    textShadow: creditsRemaining === 0 ? '0 0 16px rgba(239,68,68,0.60)' : '0 0 16px rgba(255,255,255,0.20)',
                  }}>
                    {creditsRemaining}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>/ {creditsTotal}</span>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

              {/* Projection */}
              <div style={{ flex: 1 }}>
                {creditsRemaining === 0 ? (
                  <p style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>
                    ⚠ Sin créditos disponibles · Mejorá tu plan para seguir generando
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                      Con tus créditos actuales podés crear:
                    </p>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>
                      <span style={{ color: '#f9a8d4', fontWeight: 700 }}>~{projCampaigns} campaña{projCampaigns !== 1 ? 's' : ''}</span>
                      {' '}con IA · generando{' '}
                      <span style={{ color: '#62c4b0', fontWeight: 700 }}>{projAdsMin}–{projAdsMax} anuncios</span>
                      {' '}listos para publicar
                    </p>
                  </>
                )}
              </div>

              {/* Progress bar */}
              <div style={{ width: 120, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{creditsPct}% usado</span>
                  <span style={{ fontSize: 10, color: creditsRemaining === 0 ? '#fca5a5' : creditsPct >= 80 ? '#fbbf24' : 'var(--muted)' }}>
                    {creditsRemaining === 0 ? 'Agotado' : creditsPct >= 80 ? 'Bajo' : 'OK'}
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, creditsPct)}%`,
                    borderRadius: 99,
                    background: creditsRemaining === 0
                      ? '#ef4444'
                      : creditsPct >= 80
                        ? 'linear-gradient(90deg, #f59e0b, #ef8c22)'
                        : 'linear-gradient(90deg, #e91e8c, #62c4b0)',
                    boxShadow: creditsRemaining === 0
                      ? '0 0 8px rgba(239,68,68,0.70)'
                      : '0 0 8px rgba(233,30,140,0.60)',
                    transition: 'width 0.7s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                </div>
              </div>

              {/* Arrow */}
              <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>Ver plan →</span>
            </div>
          </Link>
        </div>

        {/* ── Empty state quick actions ── */}
        {!hasData && (
          <div className="card p-8 mb-6 dash-anim-5">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={15} style={{ color: '#e91e8c' }} />
              <h2 className="section-title">Acciones rápidas</h2>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>Completá tu setup en minutos</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Settings, title: 'Conectar Facebook', desc: 'Vinculá tu cuenta publicitaria', href: '/dashboard/settings', color: '#1877f2' },
                { icon: Sparkles, title: 'Crear campaña IA',  desc: 'La IA genera todos los textos',  href: '/dashboard/create',    color: '#e91e8c' },
                { icon: Images,   title: 'Subir creativos',   desc: 'Imágenes y videos para tus ads', href: '/dashboard/creatives', color: '#06d6a0' },
              ].map(({ icon: Icon, title, desc, href, color }) => (
                <Link key={href} href={href}
                  className="group p-5 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
                  style={{
                    background: `linear-gradient(145deg, rgba(28,6,14,0.90) 0%, rgba(18,4,10,0.95) 100%)`,
                    border: `1px solid rgba(98,196,176,0.22)`,
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 32px rgba(0,0,0,0.38), 0 0 30px rgba(234,27,126,0.07)',
                    transition: 'all 0.22s cubic-bezier(0.16,1,0.3,1)',
                  }}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}35`,
                      boxShadow: `0 0 18px ${color}35, 0 0 36px ${color}10`,
                    }}>
                    <Icon size={19} style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#ffffff', marginBottom: 3 }}>{title}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</p>
                  </div>
                  <ArrowRight size={14} className="ml-auto opacity-0 group-hover:opacity-70 transition-opacity"
                    style={{ color }} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Chart + AI alerts ── */}
        {hasData && (
          <div className="grid grid-cols-3 gap-6 mb-6 dash-anim-5">
            {/* Chart */}
            <div className="col-span-2 card p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="section-title">Gasto semanal</h2>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Evolución últimos 7 días</p>
                </div>
                <span style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(233,30,140,0.08)', color: '#f9a8d4',
                  border: '1px solid rgba(233,30,140,0.18)',
                }}>
                  Últimos 7 días
                </span>
              </div>
              <SpendChart totalSpend={totalSpend} />
            </div>

            {/* Recomendaciones inteligentes */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14 }}>🤖</span>
                  <h2 className="section-title">Recomendaciones IA</h2>
                </div>
              </div>
              <div className="p-4">
                <RecommendationsList limit={4} emptyMessage="Todo en orden por ahora. Volvé después de publicar nuevas campañas." />
              </div>
            </div>
          </div>
        )}

        {/* ── Recent campaigns ── */}
        {hasData && (
          <div className="card mb-6 dash-anim-6">
            <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Megaphone size={14} style={{ color: '#e91e8c' }} />
                <h2 className="section-title">Campañas recientes</h2>
              </div>
              <Link href="/dashboard/campaigns" className="btn-ghost" style={{ fontSize: 12, padding: '6px 14px' }}>
                Ver todas →
              </Link>
            </div>
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  {['Campaña', 'Estado', 'Gasto', 'ROAS', ''].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {typed.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="px-5 py-3.5">
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{c.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'capitalize', marginTop: 2 }}>
                        {c.objective.toLowerCase()}
                      </p>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5" style={{ fontSize: 13 }}>${(c.metrics?.spend || 0).toFixed(0)}</td>
                    <td className="px-5 py-3.5" style={{
                      fontSize: 13, fontWeight: 700,
                      color: (c.metrics?.roas || 0) >= 3 ? 'var(--accent3)' : (c.metrics?.roas || 0) > 0 ? 'var(--warn)' : 'var(--muted)',
                    }}>
                      {c.metrics?.roas ? `${c.metrics.roas.toFixed(1)}x` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/dashboard/campaigns/${c.id}`}
                        style={{
                          fontSize: 11, padding: '5px 10px', borderRadius: 8,
                          background: 'rgba(233,30,140,0.08)', color: '#f9a8d4',
                          border: '1px solid rgba(233,30,140,0.18)',
                          transition: 'background 0.15s',
                          display: 'inline-block',
                        }}>
                        Ver →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── AI tip del día ── */}
        <div className="p-4 rounded-2xl flex items-start gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(234,27,126,0.08) 0%, rgba(98,196,176,0.07) 50%, rgba(234,27,126,0.04) 100%)',
            border: '1px solid rgba(234,27,126,0.20)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.40), 0 0 24px rgba(234,27,126,0.06)',
          }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              background: 'rgba(234,27,126,0.15)',
              border: '1px solid rgba(234,27,126,0.30)',
              boxShadow: '0 0 12px rgba(234,27,126,0.25)',
            }}>
            <span style={{ fontSize: 14 }}>💡</span>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#f9a8d4', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Tip del día
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{todayTip}</p>
          </div>
        </div>
      </div>
    </>
  )
}
