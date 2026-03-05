// src/app/api/auth/facebook/route.ts
// Inicia el flujo OAuth de Meta/Facebook Ads
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  console.log('[/api/auth/facebook] META_APP_ID:', appId ?? 'UNDEFINED')
  console.log('[/api/auth/facebook] META_REDIRECT_URI:', redirectUri ?? 'UNDEFINED')

  if (!appId || !redirectUri) {
    console.error('[/api/auth/facebook] Faltan variables de entorno META_APP_ID o META_REDIRECT_URI')
    return NextResponse.redirect(new URL('/dashboard/settings?fb=error', req.url))
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'ads_management,ads_read,business_management,pages_read_engagement',
    response_type: 'code',
    state: 'adflow_connect',
  })

  const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?${params}`
  console.log('[/api/auth/facebook] Redirigiendo a:', oauthUrl)

  return NextResponse.redirect(oauthUrl)
}
