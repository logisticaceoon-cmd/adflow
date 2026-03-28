// src/app/api/facebook/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ connected: false, account_name: null })
  }

  const { data } = await supabase
    .from('facebook_connections')
    .select('ad_account_id, ad_account_name')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({
    connected: !!data,
    account_name: data?.ad_account_name ?? data?.ad_account_id ?? null,
  })
}
