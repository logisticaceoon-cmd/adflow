// src/app/api/auth/facebook/callback/route.ts
// Recibe el código de autorización de Meta y guarda el token
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code          = searchParams.get('code')
  const error         = searchParams.get('error')
  const returnedState = searchParams.get('state')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }

  // CSRF check
  const savedState = req.cookies.get('fb_oauth_state')?.value
  if (!savedState || savedState !== returnedState) {
    console.error('[fb-callback] CSRF state mismatch')
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error&reason=state_mismatch', req.url))
  }

  try {
    const appId       = process.env.META_APP_ID!
    const appSecret   = process.env.META_APP_SECRET!
    const redirectUri = process.env.META_REDIRECT_URI!

    // 1. Exchange code for short-lived token
    const tokenRes  = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      console.error('[fb-callback] Token exchange error:', tokenData.error)
      return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
    }

    // 2. Exchange for long-lived token (60 days)
    const longTokenRes  = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}&` +
      `client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken   = longTokenData.access_token || tokenData.access_token

    // 3. Get Facebook user info (name, not ad account)
    const meRes  = await fetch(`https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${accessToken}`)
    const meData = await meRes.json()

    // 4. Get ALL ad accounts the user has access to (for display, not auto-select)
    const accountsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,currency,timezone_name,account_status&limit=50&access_token=${accessToken}`
    )
    const accountsData = await accountsRes.json()
    const adAccounts = accountsData.data || []

    console.log(`[fb-callback] User: ${meData.name} (${meData.id}) | Ad accounts: ${adAccounts.length}`)
    adAccounts.forEach((a: any) => console.log(`[fb-callback]   - ${a.name} (${a.id}) status=${a.account_status}`))

    if (adAccounts.length === 0) {
      return NextResponse.redirect(new URL('/dashboard/settings?fb=no_accounts', req.url))
    }

    // 5. Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const expiresAt = longTokenData.expires_in
      ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
      : null

    // 6. Save token in facebook_connections
    //    Store the FB USER name (not ad account name) so the UI shows who is connected.
    //    Ad account selection happens separately in Settings → Meta Assets.
    const payload = {
      user_id:          user.id,
      access_token:     accessToken,
      token_expires_at: expiresAt,
      facebook_user_id: meData.id,
      // Show FB user name as the connection name, not an ad account
      ad_account_name:  meData.name || 'Facebook conectado',
      // Don't auto-select an ad account — user picks in Settings
      ad_account_id:    adAccounts[0]?.id || null,
    }

    const { data: existing } = await supabase
      .from('facebook_connections')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      await supabase.from('facebook_connections').update(payload).eq('user_id', user.id)
    } else {
      await supabase.from('facebook_connections').insert(payload)
    }

    console.log(`[fb-callback] Saved connection for ${meData.name}, token expires: ${expiresAt || 'unknown'}`)

    // 7. Redirect to settings — clear CSRF cookie
    const successRes = NextResponse.redirect(new URL('/dashboard/settings?fb=connected', req.url))
    successRes.cookies.set('fb_oauth_state', '', { maxAge: 0, path: '/' })
    return successRes

  } catch (err) {
    console.error('[fb-callback] Error:', err)
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }
}
