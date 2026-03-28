// src/app/api/facebook/meta-assets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function graphFetch(url: string, label: string) {
  const res  = await fetch(url)
  const data = await res.json()
  if (data.error) console.error(`[meta-assets] ${label}:`, JSON.stringify(data.error))
  return data
}

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
  const pageId      = searchParams.get('page_id')
  const businessId  = searchParams.get('business_id')

  // ── Businesses + Pages (siempre) ────────────────────────────────────────
  const [businessesData, pagesData] = await Promise.all([
    graphFetch(
      `https://graph.facebook.com/v20.0/me/businesses?fields=id,name&limit=50&access_token=${token}`,
      '/me/businesses'
    ),
    graphFetch(
      `https://graph.facebook.com/v20.0/me/accounts?fields=id,name,access_token&limit=50&access_token=${token}`,
      '/me/accounts'
    ),
  ])

  // ── Ad Accounts ──────────────────────────────────────────────────────────
  let adAccounts: { id: string; name: string }[] = []
  let adAccountsError: string | null = null

  if (businessId) {
    // Intento 1: ad accounts del business portfolio
    const bizData = await graphFetch(
      `https://graph.facebook.com/v20.0/${businessId}/adaccounts?fields=id,name,account_status&limit=50&access_token=${token}`,
      `/${businessId}/adaccounts`
    )
    if (!bizData.error && Array.isArray(bizData.data)) {
      adAccounts = bizData.data
    } else {
      adAccountsError = bizData.error ? JSON.stringify(bizData.error) : null
      // Fallback: todas las cuentas del usuario
      console.log('[meta-assets] Fallback a /me/adaccounts')
      const meData = await graphFetch(
        `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name&limit=50&access_token=${token}`,
        '/me/adaccounts (fallback)'
      )
      adAccounts = meData.data || []
      adAccountsError = meData.error ? JSON.stringify(meData.error) : adAccountsError
    }
  } else {
    // Sin business_id: cuentas personales del usuario
    const meData = await graphFetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name&limit=50&access_token=${token}`,
      '/me/adaccounts'
    )
    adAccounts = meData.data || []
    if (meData.error) adAccountsError = JSON.stringify(meData.error)
  }

  // ── Pixels ───────────────────────────────────────────────────────────────
  let pixels: { id: string; name: string }[] = []
  if (adAccountId) {
    const pixelsData = await graphFetch(
      `https://graph.facebook.com/v20.0/${adAccountId}/adspixels?fields=id,name&access_token=${token}`,
      `/${adAccountId}/adspixels`
    )
    pixels = pixelsData.data || []
  }

  // ── Instagram ────────────────────────────────────────────────────────────
  let instagramAccounts: { id: string; username: string }[] = []
  let igDebugError: string | null = null

  if (pageId) {
    // Buscamos el page access token en la lista de páginas ya obtenida
    const pageList: Array<{ id: string; name: string; access_token?: string }> = pagesData.data || []
    const pageEntry  = pageList.find((p) => p.id === pageId)
    const pageToken  = pageEntry?.access_token || token

    console.log(`[meta-assets] Instagram: page_id=${pageId} pageToken=${pageEntry?.access_token ? 'page' : 'user-fallback'}`)

    // Intento 1: connected_instagram_account (Business / Creator accounts)
    const connectedData = await graphFetch(
      `https://graph.facebook.com/v20.0/${pageId}?fields=connected_instagram_account{id,username,name}&access_token=${pageToken}`,
      `/${pageId}?fields=connected_instagram_account`
    )

    if (connectedData.connected_instagram_account) {
      const ig = connectedData.connected_instagram_account
      instagramAccounts = [{ id: ig.id, username: ig.username || ig.name || ig.id }]
    } else {
      if (connectedData.error) igDebugError = JSON.stringify(connectedData.error)

      // Intento 2: edge instagram_accounts (cuentas clásicas vinculadas)
      const igEdgeData = await graphFetch(
        `https://graph.facebook.com/v20.0/${pageId}/instagram_accounts?fields=id,username,name&access_token=${pageToken}`,
        `/${pageId}/instagram_accounts`
      )

      if (igEdgeData.error) igDebugError = JSON.stringify(igEdgeData.error)

      instagramAccounts = (igEdgeData.data || []).map(
        (a: { id: string; username?: string; name?: string }) => ({
          id: a.id,
          username: a.username || a.name || a.id,
        })
      )
    }
  }

  // Quitamos access_token de las páginas antes de retornar al cliente
  const pages = (pagesData.data || []).map(
    (p: { id: string; name: string; access_token?: string }) => ({ id: p.id, name: p.name })
  )

  return NextResponse.json({
    businesses:       businessesData.data || [],
    adAccounts,
    adAccountsError,
    pages,
    pixels,
    instagramAccounts,
    igDebugError,
  })
}
