export type Plan = 'free' | 'pro' | 'team'
export type ReportType = 'supply_chain' | 'sales' | 'finance' | 'hr' | 'operations' | 'custom'
export type ReportStatus = 'draft' | 'generating' | 'done' | 'error'
export type Theme = 'light' | 'dark'

export interface Metric {
  id: string
  name: string
  category: string
  description?: string
  unit?: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  generations_used: number
  generations_limit: number
  created_at: string
}

export interface Report {
  id: string
  user_id: string
  title: string
  description: string | null
  report_type: ReportType
  theme: Theme
  metrics: Metric[]
  html_content: string | null
  ref_image_url: string | null
  status: ReportStatus
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface GenerateRequest {
  title: string
  description: string
  reportType: ReportType
  theme: Theme
  metrics: Metric[]
  refImageUrl?: string
}
