import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

// Edge-compatible: pass the request object directly instead of using next/headers
export function createServerSupabaseFromRequest(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
        },
      },
    }
  )
}

// Alias for backward compat - pages that used createServerSupabase()
// should switch to createServerSupabaseFromRequest(request)
export { createServerSupabaseFromRequest as createServerSupabase }
