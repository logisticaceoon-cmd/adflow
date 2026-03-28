import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isAdminLogin     = path === '/admin/login'
  const isAdminRoute     = path.startsWith('/admin')
  const isDashboardRoute = path.startsWith('/dashboard')
  const isUserLogin      = path === '/login' || path === '/register'

  // Inject x-pathname so Server Components (admin layout) can read the current
  // path without needing usePathname (which is client-only).
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', path)

  /**
   * Use `let` so setAll() can reassign supabaseResponse.
   * Always pass requestHeaders so x-pathname survives token refreshes.
   */
  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: object }>) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  // DO NOT add any logic between createServerClient and getUser().
  const { data: { user } } = await supabase.auth.getUser()

  // ── Service-role client: bypasses RLS for role lookups ───────────────────
  // createServerClient is Edge-compatible; using service role key skips RLS.
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  async function getRole(userId: string): Promise<string> {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    return data?.role ?? 'user'
  }

  // ── User login/register: redirect to dashboard if already authenticated ──
  if (isUserLogin) {
    if (user) {
      const role = await getRole(user.id)
      const url = request.nextUrl.clone()
      url.pathname = ['admin', 'super_admin'].includes(role) ? '/admin/dashboard' : '/dashboard'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // ── Admin login page: allow through; redirect if already admin ────────────
  if (isAdminLogin) {
    if (user) {
      const role = await getRole(user.id)
      if (['admin', 'super_admin'].includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // ── Unauthenticated → send to correct login ───────────────────────────────
  if (!user) {
    const url = request.nextUrl.clone()
    if (isAdminRoute) {
      url.pathname = '/admin/login'
    } else if (isDashboardRoute) {
      url.pathname = '/login'
    } else {
      return supabaseResponse
    }
    return NextResponse.redirect(url)
  }

  // ── Authenticated: fetch real role (service role → no RLS false negatives) ─
  if (isAdminRoute || isDashboardRoute) {
    const role    = await getRole(user.id)
    const isAdmin = ['admin', 'super_admin'].includes(role)

    // Admin going to /dashboard → redirect to admin panel
    if (isDashboardRoute && isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    // Non-admin trying to access /admin → back to dashboard
    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/register'],
}
