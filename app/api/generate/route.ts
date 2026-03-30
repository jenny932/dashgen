import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseFromRequest } from '@/lib/supabase-server'

// Declare Edge Runtime for Cloudflare Pages compatibility
export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseFromRequest(req)

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Quota check
    const { data: profile } = await supabase
      .from('profiles')
      .select('generations_used, generations_limit, plan')
      .eq('id', user.id)
      .single()

    if (!profile || profile.generations_used >= profile.generations_limit) {
      return NextResponse.json({ error: 'Generation quota exceeded. Please upgrade your plan.' }, { status: 429 })
    }

    const body = await req.json()
    const { reportId } = body as { reportId: string }

    // Mark report as generating
    await supabase
      .from('reports')
      .update({ status: 'generating' })
      .eq('id', reportId)
      .eq('user_id', user.id)

    // Return immediately — frontend will poll /api/reports/[id] for result
    return NextResponse.json({ reportId, status: 'generating' })
  } catch (err: any) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
