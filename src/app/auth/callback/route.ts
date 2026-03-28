// src/app/auth/callback/route.ts
// Handles Google OAuth callback: exchanges code, creates profile if new user
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      // Create profile if this is a new user (ignore conflict if trigger already created it)
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
          role: 'user',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      return NextResponse.redirect(new URL('/dashboard', origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
