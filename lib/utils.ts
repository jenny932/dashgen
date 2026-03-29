import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function stripHtmlCodeBlock(text: string): string {
  // Remove markdown code fences if AI wraps output
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
}

export const REPORT_TYPES = [
  { id: 'supply_chain', label: 'Supply Chain',   icon: '🔗', color: 'teal'   },
  { id: 'sales',        label: 'Sales',           icon: '📈', color: 'blue'   },
  { id: 'finance',      label: 'Finance',         icon: '💰', color: 'green'  },
  { id: 'hr',           label: 'Human Resources', icon: '👥', color: 'purple' },
  { id: 'operations',   label: 'Operations',      icon: '⚙️', color: 'amber'  },
  { id: 'custom',       label: 'Custom',          icon: '✨', color: 'slate'  },
] as const

export const METRIC_SUGGESTIONS: Record<string, string[]> = {
  supply_chain: [
    'Inventory Turnover Rate', 'On-Time Delivery Rate', 'Order Fill Rate',
    'Lead Time', 'Supplier Quality Rate', 'Production Cycle Time',
    'Defect Rate', 'Cost per Unit', 'Warehouse Utilization',
  ],
  sales: [
    'Monthly Revenue', 'Sales Growth Rate', 'Customer Acquisition Cost',
    'Conversion Rate', 'Average Order Value', 'Churn Rate',
    'Net Promoter Score', 'Pipeline Value', 'Win Rate',
  ],
  finance: [
    'Gross Margin', 'Operating Expense Ratio', 'Revenue Growth',
    'Cash Flow', 'Accounts Receivable Days', 'Budget Variance',
    'ROI', 'EBITDA', 'Burn Rate',
  ],
  hr: [
    'Headcount', 'Attrition Rate', 'Time to Hire',
    'Employee Satisfaction Score', 'Training Completion Rate',
    'Absenteeism Rate', 'Offer Acceptance Rate', 'Cost per Hire',
  ],
  operations: [
    'System Uptime', 'Incident Response Time', 'SLA Compliance',
    'Throughput', 'Capacity Utilization', 'Error Rate',
    'Mean Time to Resolve', 'Cost Efficiency', 'Customer Satisfaction',
  ],
  custom: [],
}
