import { generateWithAI, describeImage } from '@/lib/ai'
import { buildPrompt, buildRefImagePrompt } from '@/lib/prompt'
import { stripHtmlCodeBlock } from '@/lib/utils'
import { GenerateRequest } from '@/types'

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SB_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function triggerGeneration(
  _supabase: unknown,
  userId: string,
  report: Record<string, any>
): Promise<void> {
  // Atomic lock: only proceed if status is still 'generating'
  const lockRes = await supabaseFetch(
    `/rest/v1/reports?id=eq.${report.id}&user_id=eq.${userId}&status=eq.generating&select=id`,
    { method: 'GET' }
  )

  if (!lockRes || lockRes.length === 0) return

  await supabaseFetch(
    `/rest/v1/reports?id=eq.${report.id}`,
    {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'generating_async' }),
    }
  )

  try {
    // Analyze reference image if provided
    let refImageDescription: string | undefined
    if (report.ref_image_url) {
      try {
        const imgRes = await fetch(report.ref_image_url)
        const imgBuf = await imgRes.arrayBuffer()
        const imgBase64 = btoa(String.fromCharCode(...new Uint8Array(imgBuf)))
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
    const isValidHtml =
      htmlContent.toLowerCase().includes('<!doctype') ||
      htmlContent.toLowerCase().includes('<html')

    const newStatus = isValidHtml ? 'done' : 'error'
    const updateBody: Record<string, unknown> = { status: newStatus }
    if (isValidHtml) {
      updateBody.html_content = htmlContent
      updateBody.prompt_used = prompt
    }

    await supabaseFetch(
      `/rest/v1/reports?id=eq.${report.id}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify(updateBody),
      }
    )

    if (isValidHtml) {
      const profileRes: any[] = await supabaseFetch(
        `/rest/v1/profiles?id=eq.${userId}&select=generations_used`,
        { method: 'GET' }
      )
      if (profileRes && profileRes.length > 0) {
        const used = profileRes[0].generations_used ?? 0
        await supabaseFetch(
          `/rest/v1/profiles?id=eq.${userId}`,
          {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ generations_used: used + 1 }),
          }
        )
      }
    }
  } catch (err: any) {
    console.error('Generation error:', err)
    await supabaseFetch(
      `/rest/v1/reports?id=eq.${report.id}&user_id=eq.${userId}`,
      {
        method: 'PATCH',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({ status: 'error' }),
      }
    )
  }
}
