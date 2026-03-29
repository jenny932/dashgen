import { GenerateRequest } from '@/types'

export function buildPrompt(req: GenerateRequest, refImageDescription?: string): string {
  const typeLabels: Record<string, string> = {
    supply_chain: 'Supply Chain Management',
    sales: 'Sales & Revenue',
    finance: 'Financial Performance',
    hr: 'Human Resources',
    operations: 'Operations',
    custom: 'Business Intelligence',
  }

  const metricsText = req.metrics.map(m =>
    `- ${m.name}${m.description ? `: ${m.description}` : ''}${m.unit ? ` (unit: ${m.unit})` : ''}`
  ).join('\n')

  const themeInstructions = req.theme === 'dark'
    ? `Dark theme: background #070C14, surface rgba(255,255,255,0.04), text white, accent #00E5CC`
    : `Light theme: background #F0F3F7, surface white, text #1E293B, accent #2563EB`

  const refStyle = refImageDescription
    ? `\n\nSTYLE REFERENCE: The user uploaded a reference dashboard image. Apply these visual characteristics: ${refImageDescription}\n`
    : ''

  return `You are an expert data visualization engineer. Generate a complete, self-contained HTML dashboard file.

DASHBOARD REQUIREMENTS:
- Title: "${req.title}"
- Type: ${typeLabels[req.reportType]} Dashboard
- Description: ${req.description || 'A professional BI dashboard'}
- Theme: ${themeInstructions}
${refStyle}
METRICS TO VISUALIZE:
${metricsText}

TECHNICAL REQUIREMENTS:
1. Single HTML file, completely self-contained (no external dependencies except CDN)
2. Use Chart.js from cdnjs: https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js
3. Use Google Fonts: https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap
4. Responsive layout, looks great at 1280px+ width
5. Include realistic sample/mock data for all metrics
6. Interactive: hover effects, tooltips on charts
7. Professional, production-quality visual design

DESIGN REQUIREMENTS:
- Top header with dashboard title, live clock, and "LIVE" indicator
- KPI cards row showing key numbers with trend arrows (↑↓) and color coding (green=good, amber=warning, red=alert)
- At least 3 different chart types: bar, line, doughnut/pie
- Data tables where appropriate
- Color-coded status badges
- Smooth CSS animations on load
- NO placeholder text like "Lorem ipsum" - use realistic business data

OUTPUT: Return ONLY the complete HTML code, starting with <!DOCTYPE html>. No explanation, no markdown, no code blocks.`
}

export function buildRefImagePrompt(imageBase64: string): string {
  return `Analyze this dashboard/report image and describe its visual style in detail. Focus on:
1. Color palette (background, surface, accent colors with hex values if possible)
2. Layout structure (grid, columns, card arrangement)
3. Typography style (font weight, sizes, hierarchy)
4. Chart types used
5. Overall aesthetic mood (dark/light, minimal/dense, corporate/modern)
Keep your response under 150 words, be specific and actionable.`
}
