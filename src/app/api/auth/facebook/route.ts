// src/app/api/auth/facebook/route.ts
// Inicia el flujo OAuth de Meta/Facebook Ads
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const appId = process.env.META_APP_ID!
  const redirectUri = process.env.META_REDIRECT_URI!

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'ads_management,ads_read,business_management,pages_read_engagement',
    response_type: 'code',
    state: 'adflow_connect',
  })

  return NextResponse.redirect(
    `https://www.facebook.com/v20.0/dialog/oauth?${params}`
  )
}
