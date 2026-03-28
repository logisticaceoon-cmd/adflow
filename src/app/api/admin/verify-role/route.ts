// src/app/api/admin/verify-role/route.ts
// Verifica el role del usuario autenticado usando service role key.
// Esto bypasea RLS por completo — nunca retorna null por políticas.
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // 1. Obtener el usuario desde la sesión actual (cookies)
    const supabase = createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ role: null, error: 'not_authenticated' }, { status: 401 })
    }

    // 2. Consultar el role con la service role key (bypass total de RLS)
    const admin = createAdminClient()
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { role: null, error: profileError?.message ?? 'profile_not_found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ role: profile.role, userId: user.id })
  } catch (err) {
    return NextResponse.json({ role: null, error: String(err) }, { status: 500 })
  }
}
