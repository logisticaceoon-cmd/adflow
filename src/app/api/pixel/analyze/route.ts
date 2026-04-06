// src/app/api/pixel/analyze/route.ts
// GET → analyzes the user's Meta pixel and returns level + capabilities.
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzePixel, savePixelAnalysis } from '@/lib/pixel-analyzer'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Pixel id from business profile
  const { data: biz } = await supabase
    .from('business_profiles')
    .select('pixel_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!biz?.pixel_id) {
    return NextResponse.json(
      { error: 'No tenés un pixel configurado. Andá a Configuración → Activos de Meta.', code: 'NO_PIXEL' },
      { status: 400 },
    )
  }

  // Token from facebook_connections
  const { data: conn } = await supabase
    .from('facebook_connections')
    .select('access_token')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!conn?.access_token) {
    return NextResponse.json(
      { error: 'Facebook no está conectado. Reconectá tu cuenta.', code: 'NO_FB_TOKEN' },
      { status: 400 },
    )
  }

  try {
    const analysis = await analyzePixel(biz.pixel_id, conn.access_token)
    await savePixelAnalysis(user.id, analysis)
    return NextResponse.json({ analysis })
  } catch (err: any) {
    console.error('[pixel/analyze] Failed:', err)
    return NextResponse.json(
      { error: err.message || 'No pudimos analizar el pixel' },
      { status: 500 },
    )
  }
}
