import { createBrowserClient } from '@supabase/ssr'

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
    )
  }
  return _supabase
}
