// src/app/api/facebook/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()

  // Con @supabase/ssr el token se guarda en sb-<project-ref>-auth-token
  // Puede estar fragmentado en .0, .1, etc. — juntamos los chunks si es necesario
  const PROJECT_REF = process.env.NEXT_PUBLIC_SUPABASE_URL!
    .replace('https://', '')
    .replace('.supabase.co', '')

  const cookieName = `sb-${PROJECT_REF}-auth-token`

  // Recolectar chunks ordenados: cookie base + .0, .1, ...
  const base   = allCookies.find(c => c.name === cookieName)?.value ?? ''
  const chunks = allCookies
    .filter(c => c.name.startsWith(`${cookieName}.`))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(c => c.value)

  const raw = chunks.length > 0 ? chunks.join('') : base

  console.log('[/api/facebook/status] cookie name buscada:', cookieName)
  console.log('[/api/facebook/status] cookies presentes:', allCookies.map(c => c.name))
  console.log('[/api/facebook/status] raw token (primeros 40 chars):', raw.slice(0, 40) || 'VACÍO')

  let accessToken: string | null = null
  if (raw) {
    try {
      // El valor puede estar en base64url o como JSON directo
      let decoded = raw
      if (!raw.startsWith('{')) {
        decoded = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
      }
      const parsed = JSON.parse(decoded)
      accessToken = parsed.access_token ?? null
    } catch {
      // Intentar como JSON directo sin decode
      try {
        const parsed = JSON.parse(raw)
        accessToken = parsed.access_token ?? null
      } catch {
        console.log('[/api/facebook/status] no se pudo parsear el token')
      }
    }
  }

  console.log('[/api/facebook/status] accessToken encontrado:', !!accessToken)

  if (!accessToken) {
    return NextResponse.json({ connected: false, account_name: null })
  }

  // Crear cliente con el token del usuario via Authorization header
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('[/api/facebook/status] user_id:', user?.id ?? 'null', '| error:', userError?.message ?? 'none')

  if (!user) {
    return NextResponse.json({ connected: false, account_name: null })
  }

  const { data, error } = await supabase
    .from('facebook_connections')
    .select('ad_account_id, ad_account_name')
    .eq('user_id', user.id)
    .maybeSingle()

  console.log('[/api/facebook/status] query result:', { data, error: error?.message ?? null })

  return NextResponse.json({
    connected: !!data,
    account_name: data?.ad_account_name ?? data?.ad_account_id ?? null,
  })
}
