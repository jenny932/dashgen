import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseFromRequest } from '@/lib/supabase-server'
import { generateWithAI, describeImage } from '@/lib/ai'
import { buildPrompt, buildRefImagePrompt } from '@/lib/prompt'
import { stripHtmlCodeBlock } from '@/lib/utils'
import { GenerateRequest } from '@/types'

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
    const { reportId, refImageUrl, ...genReq } = body as GenerateRequest & { reportId: string; refImageUrl?: string }

    // If reference image provided, analyze it first
    let refImageDescription: string | undefined
    if (refImageUrl) {
      try {
        const imgRes = await fetch(refImageUrl)
        const imgBuf = await imgRes.arrayBuffer()
        const imgBase64 = Buffer.from(imgBuf).toString('base64')
        refImageDescription = await describeImage(imgBase64, buildRefImagePrompt(imgBase64))
      } catch {
        refImageDescription = undefined
      }
    }

    // Build prompt and call AI
    const prompt = buildPrompt(genReq, refImageDescription)
    const rawOutput = await generateWithAI(prompt)
    const htmlContent = stripHtmlCodeBlock(rawOutput)

    // Validate HTML
    if (!htmlContent.toLowerCase().includes('<!doctype') && !htmlContent.toLowerCase().includes('<html')) {
      await supabase.from('reports').update({ status: 'error' }).eq('id', reportId)
      return NextResponse.json({ error: 'AI returned invalid HTML. Please try again.' }, { status: 500 })
    }

    // Save generated HTML
    const { error: updateErr } = await supabase
      .from('reports')
      .update({ html_content: htmlContent, prompt_used: prompt, status: 'done' })
      .eq('id', reportId)
      .eq('user_id', user.id)

    if (updateErr) throw updateErr

    // Increment usage counter
    await supabase
      .from('profiles')
      .update({ generations_used: profile.generations_used + 1 })
      .eq('id', user.id)

    return NextResponse.json({ success: true, reportId })
  } catch (err: any) {
    console.error('Generate error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
