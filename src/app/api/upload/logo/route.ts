// src/app/api/upload/logo/route.ts — Upload brand logo via admin client (bypasses RLS)
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no soportado. Usá PNG, SVG, JPG o WebP.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'El archivo es muy grande. Máximo 2MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'png'
  const path = `${user.id}/logo.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('brand-assets')
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    })

  if (error) {
    console.error('[upload/logo] Storage error:', error)
    return NextResponse.json({ error: `Error al subir: ${error.message}` }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('brand-assets').getPublicUrl(path)

  // Also save logo_url to business_profiles
  await admin.from('business_profiles').upsert(
    { user_id: user.id, logo_url: publicUrl, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ url: publicUrl })
}
