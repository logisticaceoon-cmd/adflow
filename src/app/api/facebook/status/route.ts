// src/app/api/facebook/status/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  console.log('[/api/facebook/status] user_id:', user?.id ?? 'no autenticado')

  if (!user) {
    return NextResponse.json({ connected: false, account_name: null })
  }

  const { data, error } = await supabase
    .from('facebook_connections')
    .select('ad_account_id, ad_account_name')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[/api/facebook/status] query result:', { data, error })

  return NextResponse.json({
    connected: !!data,
    account_name: data?.ad_account_name ?? data?.ad_account_id ?? null,
  })
}
