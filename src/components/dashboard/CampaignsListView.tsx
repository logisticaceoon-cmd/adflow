'use client'
// src/components/dashboard/CampaignsListView.tsx
// Client wrapper for the campaigns list: phase/status filters + SyncButton + inline quick actions.
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campaign } from '@/types'
import SyncButton from './SyncButton'
import EmptyState from '@/components/ui/EmptyState'
import { Play, Pause } from 'lucide-react'

interface Props {
  campaigns: Campaign[]
}

type PhaseKey  = 'all' | 'F1' | 'F2' | 'F3' | 'F4'
type StatusKey = 'all' | 'active' | 'paused' | 'draft'

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

const PHASES: Array<{ key: PhaseKey; label: string; icon: string; color: string }> = [
  { key: 'all', label: 'Todas',      icon: '🎯', color: '#8892b0' },
  { key: 'F1',  label: 'F1 Reconocim.', icon: '📢', color: '#62c4b0' },
  { key: 'F2',  label: 'F2 Ventas',     icon: '💰', color: '#e91e8c' },
  { key: 'F3',  label: 'F3 Remarketing', icon: '🎯', color: '#f59e0b' },
  { key: 'F4',  label: 'F4 WhatsApp',   icon: '💬', color: '#25D366' },
]

const STATUSES: Array<{ key: StatusKey; label: string }> = [
  { key: 'all',    label: 'Todas' },
  { key: 'active', label: 'Activa' },
  { key: 'paused', label: 'Pausada' },
  { key: 'draft',  label: 'Borrador' },
]

function classifyPhase(c: Campaign): PhaseKey {
  const name = (c.name || '').toLowerCase()
  if (/whatsapp|wa\b|mensaje/.test(name))                            return 'F4'
  if (/retargeting|remarketing|carrito|tibio|caliente/.test(name))   return 'F3'
  if (c.strategy_type === 'BOFU' || /bofu|conversion|purchase|venta/.test(name)) return 'F2'
  return 'F1'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active:    ['badge-active',  '● Activa'],
    paused:    ['badge-paused',  '● Pausada'],
    draft:     ['badge-draft',   'Borrador'],
    error:     ['badge-error',   '⚠ Error'],
    completed: ['badge-draft',   'Completada'],
  }
  const [cls, label] = map[status] || ['badge-draft', status]
  return <span className={`badge ${cls}`}>{label}</span>
}

function RoasCell({ roas }: { roas?: number }) {
  if (!roas) return <span style={{ color: 'var(--muted)' }}>—</span>
  const color = roas >= 4 ? 'var(--accent3)' : roas >= 2 ? 'var(--warn)' : 'var(--danger)'
  const glow  = roas >= 4 ? 'rgba(6,214,160,0.35)' : roas >= 2 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'
  return (
    <span style={{ color, fontWeight: 700, fontSize: 14, textShadow: `0 0 12px ${glow}` }}>
      {roas.toFixed(1)}x
    </span>
  )
}

function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace segs'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `hace ${days}d`
}

export default function CampaignsListView({ campaigns }: Props) {
  const router = useRouter()
  const [phaseFilter,  setPhaseFilter]  = useState<PhaseKey>('all')
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all')
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      if (phaseFilter !== 'all' && classifyPhase(c) !== phaseFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      return true
    })
  }, [campaigns, phaseFilter, statusFilter])

  async function quickAction(campaignId: string, action: 'activate' | 'pause') {
    setQuickLoading(campaignId)
    try {
      const res = await fetch('/api/facebook/activate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id: campaignId, action }),
      })
      if (res.ok) router.refresh()
    } finally {
      setQuickLoading(null)
    }
  }

  return (
    <>
      {/* ── Filter bar + SyncButton ── */}
      <div className="card p-4 mb-4 dash-anim-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginRight: 2 }}>
              Fase:
            </span>
            {PHASES.map(p => {
              const active = phaseFilter === p.key
              return (
                <button key={p.key} onClick={() => setPhaseFilter(p.key)}
                  style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '5px 11px', borderRadius: 99,
                    background: active ? `${p.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? p.color + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? p.color : 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>
                  {p.icon} {p.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.10em', marginRight: 2 }}>
              Estado:
            </span>
            {STATUSES.map(s => {
              const active = statusFilter === s.key
              return (
                <button key={s.key} onClick={() => setStatusFilter(s.key)}
                  style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '5px 11px', borderRadius: 99,
                    background: active ? 'rgba(234,27,126,0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(234,27,126,0.40)' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#f9a8d4' : 'var(--muted)',
                    cursor: 'pointer',
                  }}>
                  {s.label}
                </button>
              )
            })}
            <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', marginLeft: 8, marginRight: 4 }} />
            <SyncButton variant="compact" />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        campaigns.length === 0 ? (
          <EmptyState
            variant="large"
            icon="🚀"
            title="Tu primera campaña te espera"
            description="Creá tu primera campaña con IA y empezá a crecer. Te lleva menos de 2 minutos: describí tu producto y AdFlow arma todo."
            action={{ label: 'Crear campaña →', href: '/dashboard/create' }}
          />
        ) : (
          <EmptyState
            variant="default"
            icon="🔍"
            title="Sin campañas con estos filtros"
            description="Probá con otros filtros o creá una nueva campaña."
            action={{ label: 'Crear campaña →', href: '/dashboard/create' }}
          />
        )
      ) : (
        <div className="card dash-anim-3">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  {['CAMPAÑA', 'FASE', 'OBJETIVO', 'ESTADO', 'PRESUP./DÍA', 'GASTO', 'ROAS', 'CONV.', 'SYNC', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const phase = classifyPhase(c)
                  const phaseInfo = PHASES.find(p => p.key === phase)!
                  const lastSync = (c.metrics as any)?.last_sync as string | undefined
                  const quickBusy = quickLoading === c.id
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="px-5 py-4">
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{c.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                          {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 800,
                          padding: '4px 10px', borderRadius: 99,
                          background: `${phaseInfo.color}15`,
                          color: phaseInfo.color,
                          border: `1px solid ${phaseInfo.color}40`,
                        }}>
                          {phaseInfo.icon} {phase}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {OBJ_LABELS[c.objective] || c.objective}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: 600 }}>
                        ${c.daily_budget}<span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>/día</span>
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                        ${(c.metrics?.spend || 0).toFixed(0)}
                      </td>
                      <td className="px-5 py-4"><RoasCell roas={c.metrics?.roas} /></td>
                      <td className="px-5 py-4" style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                        {c.metrics?.conversions || <span style={{ color: 'rgba(255,255,255,0.28)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4" style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {formatRelative(lastSync)}
                      </td>
                      <td className="px-5 py-4">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {/* Quick actions */}
                          {c.meta_campaign_id && c.status === 'active' && (
                            <button
                              onClick={() => quickAction(c.id, 'pause')}
                              disabled={quickBusy}
                              title="Pausar"
                              style={{
                                width: 26, height: 26, borderRadius: 7,
                                background: 'rgba(245,158,11,0.10)',
                                border: '1px solid rgba(245,158,11,0.30)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: quickBusy ? 'wait' : 'pointer',
                                opacity: quickBusy ? 0.5 : 1,
                              }}>
                              <Pause size={11} style={{ color: '#fbbf24' }} />
                            </button>
                          )}
                          {c.meta_campaign_id && (c.status === 'paused' || c.status === 'draft') && (
                            <button
                              onClick={() => quickAction(c.id, 'activate')}
                              disabled={quickBusy}
                              title="Activar"
                              style={{
                                width: 26, height: 26, borderRadius: 7,
                                background: 'rgba(6,214,160,0.10)',
                                border: '1px solid rgba(6,214,160,0.30)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: quickBusy ? 'wait' : 'pointer',
                                opacity: quickBusy ? 0.5 : 1,
                              }}>
                              <Play size={11} style={{ color: '#06d6a0', fill: '#06d6a0' }} />
                            </button>
                          )}
                          <Link href={`/dashboard/campaigns/${c.id}`}
                            style={{
                              fontSize: 11, padding: '5px 10px', borderRadius: 8,
                              background: 'rgba(233,30,140,0.08)', color: '#f9a8d4',
                              border: '1px solid rgba(233,30,140,0.18)',
                              display: 'inline-block',
                            }}>
                            Ver →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
