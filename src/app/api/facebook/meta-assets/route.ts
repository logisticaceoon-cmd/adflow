// src/app/api/facebook/meta-assets/route.ts
// Trae ad accounts, pixels, páginas e Instagram desde la Meta Graph API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: conn } = await supabase
    .from('facebook_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conn?.access_token) {
    return NextResponse.json({ error: 'No hay cuenta de Facebook conectada' }, { status: 400 })
  }

  const token = conn.access_token
  const { searchParams } = new URL(req.url)
  const adAccountId = searchParams.get('ad_account_id')
  const pageId = searchParams.get('page_id')

  // Siempre traemos ad accounts y páginas en paralelo
  const [adAccountsRes, pagesRes] = await Promise.all([
    fetch(`https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,currency&limit=50&access_token=${token}`),
    fetch(`https://graph.facebook.com/v20.0/me/accounts?fields=id,name&limit=50&access_token=${token}`),
  ])
  const [adAccountsData, pagesData] = await Promise.all([
    adAccountsRes.json(),
    pagesRes.json(),
  ])

  // Pixels — solo si se pasa ad_account_id
  let pixels: { id: string; name: string }[] = []
  if (adAccountId) {
    const pixelsRes = await fetch(
      `https://graph.facebook.com/v20.0/${adAccountId}/adspixels?fields=id,name&access_token=${token}`
    )
    const pixelsData = await pixelsRes.json()
    pixels = pixelsData.data || []
  }

  // Instagram — solo si se pasa page_id
  let instagramAccounts: { id: string; username: string }[] = []
  if (pageId) {
    const igRes = await fetch(
      `https://graph.facebook.com/v20.0/${pageId}/instagram_accounts?fields=id,username&access_token=${token}`
    )
    const igData = await igRes.json()
    instagramAccounts = igData.data || []
  }

  return NextResponse.json({
    adAccounts: adAccountsData.data || [],
    pages: pagesData.data || [],
    pixels,
    instagramAccounts,
  })
}
