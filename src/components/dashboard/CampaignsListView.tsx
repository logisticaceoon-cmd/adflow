'use client'
// src/components/dashboard/CampaignsListView.tsx
// Card-first campaigns view with optional table toggle
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Campaign } from '@/types'
import { formatRelative } from '@/lib/format'
import SyncButton from './SyncButton'
import EmptyState from '@/components/ui/EmptyState'
import { Play, Pause, LayoutGrid, List, ArrowUpRight, Pencil, TrendingUp, DollarSign, Eye, MousePointerClick } from 'lucide-react'

interface Props { campaigns: Campaign[] }

type ViewMode = 'cards' | 'table'
type StatusKey = 'all' | 'active' | 'paused' | 'draft'

const OBJ_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: 'Reconocimiento',
  OUTCOME_TRAFFIC: 'Tráfico',
  OUTCOME_ENGAGEMENT: 'Engagement',
  OUTCOME_LEADS: 'Leads',
  OUTCOME_SALES: 'Ventas',
  OUTCOME_APP_PROMOTION: 'App',
  CONVERSIONS: 'Conversiones',
  TRAFFIC: 'Tráfico',
  REACH: 'Alcance',
  LEAD_GENERATION: 'Leads',
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'var(--ds-color-success)',
    paused: 'var(--ds-color-warning)',
    draft: 'rgba(255,255,255,0.3)',
    error: 'var(--ds-color-danger)',
    completed: 'rgba(255,255,255,0.3)',
  }
  return (
    <span style={{
      width: 6, height: 6, borderRadius: '50%',
      background: colors[status] || 'rgba(255,255,255,0.3)',
      display: 'inline-block', flexShrink: 0,
      boxShadow: status === 'active' ? `0 0 8px ${colors.active}` : 'none',
    }} />
  )
}

function StatusLabel({ status }: { status: string }) {
  const labels: Record<string, string> = {
    active: 'Activa', paused: 'Pausada', draft: 'Borrador',
    error: 'Error', completed: 'Completada',
  }
  const colors: Record<string, string> = {
    active: 'var(--ds-color-success)', paused: 'var(--ds-color-warning)',
    draft: 'var(--ds-text-muted)', error: 'var(--ds-color-danger)',
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: colors[status] || 'var(--ds-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <StatusDot status={status} />
      {labels[status] || status}
    </span>
  )
}

/* ── Active campaign card — prominent with metrics ── */
function ActiveCard({ c, onAction, busy }: { c: Campaign; onAction: (id: string, a: 'activate' | 'pause') => void; busy: boolean }) {
  const m = c.metrics || {} as any
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', borderTop: '2px solid var(--ds-color-success)' }}>
      <div style={{ padding: '14px 16px' }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div style={{ flex: 1, minWidth: 0 }}>
            <StatusLabel status={c.status} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 4, lineHeight: 1.3 }}>
              {c.name}
            </p>
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>
              {OBJ_LABELS[c.objective] || c.objective} · ${c.daily_budget}/día
            </p>
          </div>
        </div>

        {/* Mini metrics row */}
        <div className="grid grid-cols-3 gap-2" style={{ marginTop: 10 }}>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1 mb-1">
              <DollarSign size={9} style={{ color: 'var(--ds-text-muted)' }} />
              <span style={{ fontSize: 8, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gasto</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>${(m.spend || 0).toFixed(0)}</p>
          </div>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={9} style={{ color: 'var(--ds-text-muted)' }} />
              <span style={{ fontSize: 8, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ROAS</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: (m.roas ?? 0) >= 4 ? 'var(--ds-color-success)' : (m.roas ?? 0) >= 2 ? 'var(--ds-color-warning)' : '#fff' }}>
              {m.roas ? `${m.roas.toFixed(1)}x` : '—'}
            </p>
          </div>
          <div style={{ padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1 mb-1">
              <MousePointerClick size={9} style={{ color: 'var(--ds-text-muted)' }} />
              <span style={{ fontSize: 8, color: 'var(--ds-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conv.</span>
            </div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.conversions || '—'}</p>
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div style={{ padding: '8px 16px 12px', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: 'var(--ds-text-muted)' }}>
          Sync: {formatRelative((m as any).last_sync)}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {c.meta_campaign_id && (
            <button onClick={() => onAction(c.id, 'pause')} disabled={busy} title="Pausar"
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'var(--ds-color-warning-soft)', border: '1px solid var(--ds-color-warning-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.5 : 1,
              }}>
              <Pause size={12} style={{ color: 'var(--ds-color-warning)' }} />
            </button>
          )}
          <Link href={`/dashboard/campaigns/${c.id}`}
            style={{
              fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 6,
              background: 'var(--ds-color-primary)', color: '#fff',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
            Ver <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ── Draft card — CTA to continue ── */
function DraftCard({ c }: { c: Campaign }) {
  return (
    <div className="card" style={{ padding: '14px 16px', borderLeft: '3px solid rgba(255,255,255,0.15)' }}>
      <div className="flex items-center justify-between gap-3">
        <div style={{ flex: 1, minWidth: 0 }}>
          <StatusLabel status="draft" />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
            {c.name}
          </p>
          <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 2 }}>
            {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
            {c.objective ? ` · ${OBJ_LABELS[c.objective] || c.objective}` : ''}
          </p>
        </div>
        <Link href={`/dashboard/campaigns/${c.id}`}
          style={{
            fontSize: 11, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
          <Pencil size={10} /> Continuar
        </Link>
      </div>
    </div>
  )
}

/* ── Paused/Error/Completed — compact row ── */
function CompactRow({ c, onAction, busy }: { c: Campaign; onAction: (id: string, a: 'activate' | 'pause') => void; busy: boolean }) {
  return (
    <div className="flex items-center gap-3 py-3 px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <StatusDot status={c.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{c.name}</p>
        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>
          {OBJ_LABELS[c.objective] || c.objective} · ${c.daily_budget}/día
          {c.metrics?.spend ? ` · Gastó $${(c.metrics.spend as number).toFixed(0)}` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {c.meta_campaign_id && c.status === 'paused' && (
          <button onClick={() => onAction(c.id, 'activate')} disabled={busy} title="Reactivar"
            style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'var(--ds-color-success-soft)', border: '1px solid var(--ds-color-success-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.5 : 1,
            }}>
            <Play size={10} style={{ color: 'var(--ds-color-success)', fill: 'var(--ds-color-success)' }} />
          </button>
        )}
        <Link href={`/dashboard/campaigns/${c.id}`}
          style={{ fontSize: 10, color: 'var(--ds-color-primary)', fontWeight: 600 }}>
          Ver →
        </Link>
      </div>
    </div>
  )
}

export default function CampaignsListView({ campaigns }: Props) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all')
  const [quickLoading, setQuickLoading] = useState<string | null>(null)

  // Group campaigns by status
  const groups = useMemo(() => {
    const all = statusFilter === 'all' ? campaigns : campaigns.filter(c => c.status === statusFilter)
    return {
      active: all.filter(c => c.status === 'active'),
      draft: all.filter(c => c.status === 'draft'),
      paused: all.filter(c => c.status === 'paused'),
      other: all.filter(c => !['active', 'draft', 'paused'].includes(c.status)),
    }
  }, [campaigns, statusFilter])

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

  const STATUSES: Array<{ key: StatusKey; label: string; count: number }> = [
    { key: 'all', label: 'Todas', count: campaigns.length },
    { key: 'active', label: 'Activas', count: campaigns.filter(c => c.status === 'active').length },
    { key: 'paused', label: 'Pausadas', count: campaigns.filter(c => c.status === 'paused').length },
    { key: 'draft', label: 'Borradores', count: campaigns.filter(c => c.status === 'draft').length },
  ]

  if (campaigns.length === 0) {
    return (
      <EmptyState
        variant="large" icon="🚀"
        title="Tu primera campaña te espera"
        description="Creá tu primera campaña con IA y empezá a crecer."
        action={{ label: 'Crear campaña →', href: '/dashboard/create' }}
      />
    )
  }

  return (
    <>
      {/* ── Toolbar: status filter + view toggle + sync ── */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          {STATUSES.map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              style={{
                fontSize: 11, fontWeight: 600,
                padding: '5px 12px', borderRadius: 99,
                background: statusFilter === s.key ? 'var(--ds-color-primary-soft)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${statusFilter === s.key ? 'var(--ds-color-primary-border)' : 'rgba(255,255,255,0.08)'}`,
                color: statusFilter === s.key ? 'var(--ds-color-primary)' : 'var(--ds-text-secondary)',
                cursor: 'pointer',
              }}>
              {s.label} {s.count > 0 && <span style={{ opacity: 0.6, marginLeft: 2 }}>{s.count}</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div style={{
            display: 'flex', borderRadius: 6, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {([['cards', LayoutGrid], ['table', List]] as const).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode as ViewMode)}
                style={{
                  padding: '5px 10px', cursor: 'pointer', border: 'none',
                  background: viewMode === mode ? 'var(--ds-color-primary-soft)' : 'transparent',
                  color: viewMode === mode ? 'var(--ds-color-primary)' : 'var(--ds-text-muted)',
                  display: 'flex', alignItems: 'center',
                }}>
                <Icon size={14} />
              </button>
            ))}
          </div>
          <SyncButton variant="compact" />
        </div>
      </div>

      {/* ── CARD VIEW ── */}
      {viewMode === 'cards' ? (
        <div className="space-y-6">
          {/* Active campaigns — prominent grid */}
          {groups.active.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-color-success)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ds-color-success)', boxShadow: '0 0 8px var(--ds-color-success)' }} />
                Activas ({groups.active.length})
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 14,
              }}>
                {groups.active.map(c => (
                  <ActiveCard key={c.id} c={c} onAction={quickAction} busy={quickLoading === c.id} />
                ))}
              </div>
            </div>
          )}

          {/* Draft campaigns — action-oriented */}
          {groups.draft.length > 0 && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-text-muted)', marginBottom: 10 }}>
                Borradores ({groups.draft.length})
              </p>
              <div className="space-y-2">
                {groups.draft.map(c => <DraftCard key={c.id} c={c} />)}
              </div>
            </div>
          )}

          {/* Paused + other — compact list */}
          {(groups.paused.length > 0 || groups.other.length > 0) && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ds-text-muted)', marginBottom: 10 }}>
                Pausadas y finalizadas ({groups.paused.length + groups.other.length})
              </p>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {[...groups.paused, ...groups.other].map(c => (
                  <CompactRow key={c.id} c={c} onAction={quickAction} busy={quickLoading === c.id} />
                ))}
              </div>
            </div>
          )}

          {/* Nothing matches filter */}
          {groups.active.length === 0 && groups.draft.length === 0 && groups.paused.length === 0 && groups.other.length === 0 && (
            <EmptyState variant="default" icon="🔍"
              title="Sin campañas con este filtro"
              description="Probá otro filtro o creá una nueva."
              action={{ label: 'Crear campaña →', href: '/dashboard/create' }}
            />
          )}
        </div>
      ) : (
        /* ── TABLE VIEW (classic, for power users) ── */
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  {['CAMPAÑA', 'OBJETIVO', 'ESTADO', 'PRESUP./DÍA', 'GASTO', 'ROAS', 'CONV.', ''].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(statusFilter === 'all' ? campaigns : campaigns.filter(c => c.status === statusFilter)).map(c => {
                  const m = c.metrics || {} as any
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="px-4 py-3">
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{c.name}</p>
                        <p style={{ fontSize: 10, color: 'var(--ds-text-muted)', marginTop: 1 }}>
                          {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 11, color: 'var(--ds-text-secondary)' }}>
                        {OBJ_LABELS[c.objective] || c.objective}
                      </td>
                      <td className="px-4 py-3"><StatusLabel status={c.status} /></td>
                      <td className="px-4 py-3" style={{ fontSize: 12, color: 'var(--ds-text-secondary)', fontWeight: 600 }}>
                        ${c.daily_budget}/día
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                        ${(m.spend || 0).toFixed(0)}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 12, fontWeight: 700, color: (m.roas ?? 0) >= 4 ? 'var(--ds-color-success)' : (m.roas ?? 0) >= 2 ? 'var(--ds-color-warning)' : 'var(--ds-text-secondary)' }}>
                        {m.roas ? `${m.roas.toFixed(1)}x` : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: 12, color: 'var(--ds-text-secondary)' }}>
                        {m.conversions || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {c.meta_campaign_id && c.status === 'active' && (
                            <button onClick={() => quickAction(c.id, 'pause')} disabled={quickLoading === c.id} title="Pausar"
                              style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--ds-color-warning-soft)', border: '1px solid var(--ds-color-warning-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Pause size={10} style={{ color: 'var(--ds-color-warning)' }} />
                            </button>
                          )}
                          {c.meta_campaign_id && c.status === 'paused' && (
                            <button onClick={() => quickAction(c.id, 'activate')} disabled={quickLoading === c.id} title="Activar"
                              style={{ width: 24, height: 24, borderRadius: 5, background: 'var(--ds-color-success-soft)', border: '1px solid var(--ds-color-success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Play size={10} style={{ color: 'var(--ds-color-success)', fill: 'var(--ds-color-success)' }} />
                            </button>
                          )}
                          <Link href={`/dashboard/campaigns/${c.id}`} style={{ fontSize: 10, color: 'var(--ds-color-primary)', fontWeight: 600 }}>Ver →</Link>
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
