import { createServerSupabaseFromRequest } from '@/lib/supabase-server'
import { generateWithAI, describeImage } from '@/lib/ai'
import { buildPrompt, buildRefImagePrompt } from '@/lib/prompt'
import { stripHtmlCodeBlock } from '@/lib/utils'
import { GenerateRequest } from '@/types'

export async function triggerGeneration(
  supabase: ReturnType<typeof createServerSupabaseFromRequest>,
  userId: string,
  report: Record<string, any>
): Promise<void> {
  // Use atomic update to get the "generating" lock — only one request does the work
  const { data: updated } = await supabase
    .from('reports')
    .update({ status: 'generating_async' })
    .eq('id', report.id)
    .eq('user_id', userId)
    .eq('status', 'generating')
    .select()
    .single()

  if (!updated) return // Another request already took the lock

  try {
    // Analyze reference image if provided
    let refImageDescription: string | undefined
    if (report.ref_image_url) {
      try {
        const imgRes = await fetch(report.ref_image_url)
        const imgBuf = await imgRes.arrayBuffer()
        const imgBase64 = Buffer.from(imgBuf).toString('base64')
        refImageDescription = await describeImage(imgBase64, buildRefImagePrompt(imgBase64))
      } catch {
        refImageDescription = undefined
      }
    }

    // Build prompt and call AI
    const prompt = buildPrompt({
      title: report.title,
      description: report.description,
      reportType: report.report_type,
      theme: report.theme,
      metrics: report.metrics,
    } as GenerateRequest, refImageDescription)

    const rawOutput = await generateWithAI(prompt)
    const htmlContent = stripHtmlCodeBlock(rawOutput)

    // Validate HTML
    const isValidHtml = htmlContent.toLowerCase().includes('<!doctype') || htmlContent.toLowerCase().includes('<html')

    if (isValidHtml) {
      await supabase
        .from('reports')
        .update({ html_content: htmlContent, prompt_used: prompt, status: 'done' })
        .eq('id', report.id)
        .eq('user_id', userId)

      await supabase
        .from('profiles')
        .update({ generations_used: (report as any).generations_used + 1 || 1 })
        .eq('id', userId)
    } else {
      await supabase
        .from('reports')
        .update({ status: 'error' })
        .eq('id', report.id)
        .eq('user_id', userId)
    }
  } catch (err: any) {
    console.error('Generation error:', err)
    await supabase
      .from('reports')
      .update({ status: 'error' })
      .eq('id', report.id)
      .eq('user_id', userId)
  }
}
