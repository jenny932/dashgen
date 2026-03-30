import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseFromRequest } from '@/lib/supabase-server'
import { generateWithAI, describeImage } from '@/lib/ai'
import { buildPrompt, buildRefImagePrompt } from '@/lib/prompt'
import { stripHtmlCodeBlock } from '@/lib/utils'
import { GenerateRequest } from '@/types'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseFromRequest(req)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('generations_used, generations_limit')
      .eq('id', user.id)
      .single()

    if (!profile || profile.generations_used >= profile.generations_limit) {
      return NextResponse.json({ error: 'Generation quota exceeded.' }, { status: 429 })
    }

    const body = await req.json()
    const { reportId, refImageUrl, ...genReq } = body as GenerateRequest & { reportId: string; refImageUrl?: string }

    // Mark as generating
    await supabase.from('reports').update({ status: 'generating' }).eq('id', reportId).eq('user_id', user.id)

    // Analyze reference image if provided
    let refImageDescription: string | undefined
    if (refImageUrl) {
      try {
        const imgRes = await fetch(refImageUrl)
        const imgBuf = await imgRes.arrayBuffer()
        const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)))
        refImageDescription = await describeImage(imgBase64, buildRefImagePrompt(imgBase64))
      } catch {
        refImageDescription = undefined
      }
    }

    // Generate with AI
    const prompt = buildPrompt(genReq as GenerateRequest, refImageDescription)
    const rawOutput = await generateWithAI(prompt)
    const htmlContent = stripHtmlCodeBlock(rawOutput)

    const isValid = htmlContent.toLowerCase().includes('<!doctype') || htmlContent.toLowerCase().includes('<html')

    if (!isValid) {
      await supabase.from('reports').update({ status: 'error' }).eq('id', reportId).eq('user_id', user.id)
      return NextResponse.json({ error: 'AI returned invalid content. Please try again.' }, { status: 500 })
    }

    // Save result
    await supabase
      .from('reports')
      .update({ html_content: htmlContent, prompt_used: prompt, status: 'done' })
      .eq('id', reportId)
      .eq('user_id', user.id)

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
