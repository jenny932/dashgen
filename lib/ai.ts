// Pluggable AI provider - swap by changing AI_PROVIDER env var

export async function generateWithAI(prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'openai'

  if (provider === 'openclaw') return generateOpenClaw(prompt)
  if (provider === 'openai') return generateOpenAI(prompt)
  if (provider === 'anthropic') return generateAnthropic(prompt)
  if (provider === 'gemini') return generateGemini(prompt)
  throw new Error(`Unknown AI provider: ${provider}`)
}

export async function describeImage(imageBase64: string, prompt: string): Promise<string> {
  const provider = process.env.AI_PROVIDER || 'openai'
  if (provider === 'openai' || provider === 'openclaw') return describeImageOpenAI(imageBase64, prompt)
  if (provider === 'anthropic') return describeImageAnthropic(imageBase64, prompt)
  // Gemini vision - fallback to text only
  return 'Clean, professional dashboard style with clear data visualization.'
}

// ── OpenAI ──────────────────────────────────────────────────────────────────
async function generateOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

// ── OpenClaw ─────────────────────────────────────────────────────────────────
async function generateOpenClaw(prompt: string): Promise<string> {
  const res = await fetch(`${process.env.OPENCLAW_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'openclaw-pro',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenClaw error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

async function describeImageOpenAI(imageBase64: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: 'text', text: prompt },
        ],
      }],
      max_tokens: 300,
    }),
  })
  if (!res.ok) return 'Professional dashboard style'
  const data = await res.json()
  return data.choices[0].message.content
}

// ── Anthropic ────────────────────────────────────────────────────────────────
async function generateAnthropic(prompt: string): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'claude-opus-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`)
  const data = await res.json()
  return data.content[0].text
}

async function describeImageAnthropic(imageBase64: string, prompt: string): Promise<string> {
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  })
  if (!res.ok) return 'Professional dashboard style'
  const data = await res.json()
  return data.content[0].text
}

// ── Gemini ───────────────────────────────────────────────────────────────────
async function generateGemini(prompt: string): Promise<string> {
  const model = process.env.AI_MODEL || 'gemini-1.5-pro'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8000, temperature: 0.7 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}
