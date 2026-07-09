// src/lib/supabase/client.ts
// Cliente de Supabase para usar en el NAVEGADOR (componentes de React)
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

// Default untyped client (backwards-compatible with existing codebase)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Typed client — use in new code for full row-type safety
export function createTypedClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
