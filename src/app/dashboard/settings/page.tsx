// src/app/dashboard/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Profile, BusinessProfile } from '@/types'
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
        <h1 className="page-title mb-1">Configuración ⚙️</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Gestioná tu cuenta, integraciones y activos de marca</p>
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
    </div>
  )
}
