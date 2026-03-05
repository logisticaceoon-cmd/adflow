// src/app/api/facebook/callback/route.ts
// Esta ruta recibe el código de autorización de Facebook y guarda el token
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }

  try {
    const appId = process.env.FB_APP_ID!
    const appSecret = process.env.FB_APP_SECRET!
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/facebook/callback`

    // 1. Intercambiar el código por un token de corta duración
    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Error FB token:', tokenData.error)
      return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
    }

    // 2. Convertir a token de LARGA duración (60 días)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&client_id=${appId}&` +
      `client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    )
    const longTokenData = await longTokenRes.json()
    const accessToken = longTokenData.access_token || tokenData.access_token

    // 3. Obtener info del usuario de Facebook
    const meRes = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${accessToken}`)
    const meData = await meRes.json()

    // 4. Obtener cuentas publicitarias del usuario
    const accountsRes = await fetch(
      `https://graph.facebook.com/v20.0/me/adaccounts?fields=id,name,currency,timezone_name&access_token=${accessToken}`
    )
    const accountsData = await accountsRes.json()
    const firstAccount = accountsData.data?.[0]

    if (!firstAccount) {
      return NextResponse.redirect(new URL('/dashboard/settings?fb=no_accounts', req.url))
    }

    // 5. Guardar en Supabase
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const expiresAt = longTokenData.expires_in
      ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
      : null

    // Upsert: actualizar si ya existe, crear si no
    await supabase.from('fb_accounts').upsert({
      user_id: user.id,
      fb_user_id: meData.id,
      fb_ad_account_id: firstAccount.id,
      account_name: firstAccount.name,
      currency: firstAccount.currency || 'USD',
      timezone: firstAccount.timezone_name || 'America/Argentina/Buenos_Aires',
      access_token: accessToken,
      token_expires_at: expiresAt,
      is_active: true,
    }, { onConflict: 'user_id,fb_user_id' })

    return NextResponse.redirect(new URL('/dashboard/settings?fb=connected', req.url))

  } catch (err) {
    console.error('Error en Facebook callback:', err)
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }
}
