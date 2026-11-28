// src/app/dashboard/campaigns/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Campaign } from '@/types'
import { Sparkles } from 'lucide-react'
import CampaignsListView from '@/components/dashboard/CampaignsListView'

export default async function CampaignsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: Campaign[] | null }

  const total  = campaigns?.length || 0
  const active = campaigns?.filter(c => c.status === 'active').length || 0
  const draft  = campaigns?.filter(c => c.status === 'draft').length || 0

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-start mb-8 module-enter module-enter-1">
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ds-text-label)', marginBottom: 8 }}>
            Mis campañas · AdFlow
          </p>
          <h1 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 28, fontWeight: 700, color: 'var(--ds-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
            Gestión de campañas 📣
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 10 }}>
            Todas tus campañas en Meta en un solo lugar — rendimiento, estado y acciones rápidas
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--ds-text-secondary)' }}>
            <span>{total} total</span>
            <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
            <span style={{ color: 'var(--ds-color-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ds-color-success)', display: 'inline-block', boxShadow: '0 0 6px transparent' }} />
              {active} activa{active !== 1 ? 's' : ''}
            </span>
            {draft > 0 && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
                <span style={{ color: 'var(--ds-text-secondary)' }}>{draft} borrador{draft !== 1 ? 'es' : ''}</span>
              </>
            )}
          </div>
        </div>
        <Link href="/dashboard/create" className="btn-primary">
          <Sparkles size={14} /> Crear con IA
        </Link>
      </div>

      {/* ── Campaigns ── */}
      {!campaigns?.length ? (
        <div className="card module-enter module-enter-3" style={{ padding: 64, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
            background: 'var(--ds-color-primary-soft)', border: '1px solid var(--ds-color-primary-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
          }}>
            📣
          </div>
          <h2 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 20, fontWeight: 800, color: '#e0e0f0', marginBottom: 10 }}>
            Sin campañas todavía
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
            Creá tu primera campaña y la IA generará todos los textos automáticamente en segundos.
          </p>
          <Link href="/dashboard/create" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Sparkles size={14} /> Crear primera campaña
          </Link>
        </div>
      ) : (
        <CampaignsListView campaigns={campaigns} />
      )}
    </div>
  )
}
