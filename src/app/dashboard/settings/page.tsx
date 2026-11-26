// src/app/dashboard/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Profile, BusinessProfile } from '@/types'
import { PLAN_CREDITS, PLAN_PRICE, PLAN_LABEL, PLAN_COLOR } from '@/lib/plans'
import FacebookConnectButton from '@/components/dashboard/FacebookConnectButton'
import SettingsProfileForm from '@/components/dashboard/SettingsProfileForm'
import SetupChecklist, { type ChecklistItem } from '@/components/dashboard/settings/SetupChecklist'
import FacebookAssetsSection from '@/components/dashboard/settings/FacebookAssetsSection'
import BusinessProfileSection from '@/components/dashboard/settings/BusinessProfileSection'
import CreativeAssetsSection from '@/components/dashboard/settings/CreativeAssetsSection'
import CampaignDefaultsSection from '@/components/dashboard/settings/CampaignDefaultsSection'

function calcCompletion(fbConnected: boolean, bp: BusinessProfile | null): { score: number; items: ChecklistItem[] } {
  const items: ChecklistItem[] = [
    { label: 'Facebook Ads conectado',         completed: fbConnected },
    { label: 'Ad Account y Pixel',             completed: !!(bp?.selected_ad_account_id && bp?.pixel_id) },
    { label: 'Página de FB e Instagram',       completed: !!(bp?.fb_page_id && bp?.instagram_account_id) },
    { label: 'Nombre del negocio y web',       completed: !!(bp?.business_name && bp?.website_url) },
    { label: 'WhatsApp e industria',           completed: !!(bp?.whatsapp_number && bp?.industry) },
    { label: 'País y moneda',                  completed: !!(bp?.country && bp?.currency) },
    { label: 'Logo subido',                    completed: !!bp?.logo_url },
    { label: 'Colores y tono de comunicación', completed: !!(bp?.brand_color_primary && bp?.communication_tone) },
  ]
  const completed = items.filter(i => i.completed).length
  const score = Math.round((completed / items.length) * 100)
  return { score, items }
}

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [profileRes, fbRes, bpRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('facebook_connections').select('ad_account_id, ad_account_name, access_token').eq('user_id', user!.id).maybeSingle(),
    supabase.from('business_profiles').select('*').eq('user_id', user!.id).maybeSingle(),
  ])

  const profile        = profileRes.data as Profile | null
  const fbConnection   = fbRes.data
  const businessProfile = bpRes.data as BusinessProfile | null
  const hasFbToken     = !!(fbConnection?.access_token)

  const { score, items } = calcCompletion(!!fbConnection, businessProfile)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ds-color-primary)', marginBottom: 8 }}>
          Configuración · AdFlow
        </p>
        <h1 style={{ fontFamily: 'var(--font-display), Space Grotesk, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.03em' }}>
          Tu cuenta y activos ⚙️
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
          Gestioná tu cuenta, integraciones con Meta, y activos de marca para que la IA entienda tu negocio
        </p>
      </div>

      {/* Checklist de completitud */}
      <SetupChecklist score={score} items={items} />

      {/* 1. Conexión Facebook */}
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-4">🔗 Conexión con Facebook</h2>
        <FacebookConnectButton
          initialConnected={!!fbConnection}
          accountName={fbConnection?.ad_account_name ?? fbConnection?.ad_account_id ?? null}
        />
      </div>

      {/* 2. Assets de Meta */}
      <FacebookAssetsSection
        hasFbToken={hasFbToken}
        initialData={businessProfile}
      />

      {/* 3. Información del negocio */}
      <BusinessProfileSection initialData={businessProfile} />

      {/* 4. Activos creativos */}
      <CreativeAssetsSection initialData={businessProfile} />

      {/* 5. Configuración de campañas */}
      <CampaignDefaultsSection initialData={businessProfile} />

      {/* 6. Perfil y reportes */}
      <SettingsProfileForm
        profile={profile}
        userEmail={user!.email ?? ''}
      />

      {/* 7. Plan y créditos */}
      <div id="plan" className="card p-6 mb-5">
        <h2 className="section-title mb-4">💳 Tu plan y créditos</h2>

        {(() => {
          const plan = profile?.plan ?? 'free'
          const label = PLAN_LABEL[plan] || 'Free'
          const price = PLAN_PRICE[plan] || 'Gratis'
          const color = PLAN_COLOR[plan] || 'var(--ds-color-primary)'
          const totalCredits = profile?.credits_total ?? PLAN_CREDITS[plan] ?? 10
          const usedCredits = profile?.credits_used ?? 0
          const remaining = Math.max(0, totalCredits - usedCredits)
          const pct = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0

          return (
            <div>
              {/* Plan actual */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderRadius: 14, marginBottom: 16,
                background: `${color}0d`,
                border: `1px solid ${color}25`,
              }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--ds-text-muted)', marginBottom: 4 }}>
                    Plan actual
                  </p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    {label} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ds-text-secondary)' }}>· {price}</span>
                  </p>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: 99,
                  background: `${color}1a`, color, fontSize: 11, fontWeight: 700,
                  border: `1px solid ${color}40`,
                }}>
                  Plan activo ✓
                </div>
              </div>

              {/* Créditos */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, color: 'var(--ds-text-secondary)' }}>
                    Créditos IA usados
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: remaining === 0 ? 'var(--ds-color-danger)' : '#fff' }}>
                    {usedCredits} / {totalCredits}
                  </p>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: remaining === 0 ? '#ef4444' : pct >= 80 ? '#f59e0b' : 'var(--ds-color-primary)',
                    }}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--ds-text-muted)', marginTop: 6 }}>
                  {remaining > 0
                    ? `Te quedan ${remaining} créditos este período.`
                    : 'Sin créditos. Mejorá tu plan para seguir generando con IA.'}
                </p>
              </div>

              {/* CTA mejorar plan */}
              {plan !== 'agency' && (
                <a
                  href="https://wa.me/5491162311970?text=Quiero+mejorar+mi+plan+AdFlow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
                >
                  Mejorar plan →
                </a>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
