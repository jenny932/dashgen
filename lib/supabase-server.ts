import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

// Edge-compatible: pass the request object directly instead of using next/headers
export function createServerSupabaseFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Edge: cookie setting handled by middleware or client
        },
        remove() {
          // Edge: cookie removal handled by middleware or client
        },
      },
    }
  )
}

// Alias for backward compat - pages that used createServerSupabase()
// should switch to createServerSupabaseFromRequest(request)
export { createServerSupabaseFromRequest as createServerSupabase }
