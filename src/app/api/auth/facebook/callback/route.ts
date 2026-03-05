// src/app/api/auth/facebook/callback/route.ts
// Recibe el código de autorización de Meta y guarda el token
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }

  try {
    const appId = process.env.META_APP_ID!
    const appSecret = process.env.META_APP_SECRET!
    const redirectUri = process.env.META_REDIRECT_URI!

    // 1. Intercambiar el código por un token de corta duración
    const tokenRes = await fetch(
      `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Error META token:', tokenData.error)
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

    // 5. Cliente Supabase con cookies del request para leer la sesión activa
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.redirect(new URL('/login', req.url))

    const expiresAt = longTokenData.expires_in
      ? new Date(Date.now() + longTokenData.expires_in * 1000).toISOString()
      : null

    // 6. Guardar en facebook_connections (upsert por user_id)
    const { data: existing } = await supabase
      .from('facebook_connections')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const payload = {
      user_id: user.id,
      access_token: accessToken,
      token_expires_at: expiresAt,
      ad_account_id: firstAccount.id,
      ad_account_name: firstAccount.name,
      facebook_user_id: meData.id,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      await supabase.from('facebook_connections').update(payload).eq('user_id', user.id)
    } else {
      await supabase.from('facebook_connections').insert(payload)
    }

    return NextResponse.redirect(new URL('/dashboard/settings?fb=connected', req.url))

  } catch (err) {
    console.error('Error en Facebook callback:', err)
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }
}
