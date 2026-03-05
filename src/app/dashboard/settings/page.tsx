// src/app/dashboard/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'
import FacebookConnectButton from '@/components/dashboard/FacebookConnectButton'
import SettingsProfileForm from '@/components/dashboard/SettingsProfileForm'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single() as { data: Profile | null }

  const { data: fbConnection } = await supabase
    .from('facebook_connections')
    .select('ad_account_id, ad_account_name')
    .eq('user_id', user!.id)
    .maybeSingle()

  console.log('[settings] user_id:', user!.id, '| fbConnection:', fbConnection)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title mb-1">Configuración ⚙️</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Gestioná tu cuenta y las integraciones</p>
      </div>

      {/* Facebook connection */}
      <div className="card p-6 mb-5">
        <h2 className="section-title mb-4">📘 Cuenta de Facebook Ads</h2>
        <FacebookConnectButton
          initialConnected={!!fbConnection}
          accountName={fbConnection?.ad_account_name ?? fbConnection?.ad_account_id ?? null}
        />
      </div>

      {/* Profile form + reports config (client component) */}
      <SettingsProfileForm
        profile={profile}
        userEmail={user!.email ?? ''}
      />
    </div>
  )
}
