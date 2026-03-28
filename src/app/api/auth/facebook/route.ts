// src/app/api/auth/facebook/route.ts
// Inicia el flujo OAuth de Meta/Facebook Ads con protección CSRF
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic so Next.js never caches this response (each user needs a unique state)
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!appId || !redirectUri) {
    console.error('[/api/auth/facebook] Faltan variables META_APP_ID o META_REDIRECT_URI')
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }

  // Generar state CSRF único por request
  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,public_profile,read_insights',
    response_type: 'code',
    state,
  })

  const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?${params}`
  const res = NextResponse.redirect(oauthUrl)

  // Guardar state en cookie httpOnly — se envía de vuelta en el callback (sameSite lax permite redirects cross-site GET)
  res.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600, // 10 minutos
    path: '/',
  })

  return res
}
