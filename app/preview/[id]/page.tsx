'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Download, ExternalLink, Loader2,
  Share2, Check, BarChart3, RefreshCw, Code2
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Report } from '@/types'
import { formatDate } from '@/lib/utils'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [copying, setCopying] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('reports').select('*').eq('id', id).single()
      if (!data) { router.push('/dashboard'); return }
      setReport(data)
      setLoading(false)
    }
    load()
  }, [id])

  function downloadHTML() {
    if (!report?.html_content) return
    const blob = new Blob([report.html_content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportPDF() {
    if (!iframeRef.current?.contentWindow) return
    setExporting(true)
    try {
      iframeRef.current.contentWindow.print()
    } finally {
      setExporting(false)
    }
  }

  async function copyLink() {
    // Make public first
    await supabase.from('reports').update({ is_public: true }).eq('id', id)
    await navigator.clipboard.writeText(`${window.location.origin}/preview/${id}`)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  if (loading) return (
    <div className="mesh-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-blue-400 mx-auto mb-4" />
        <p className="text-slate-400">Loading your dashboard…</p>
      </div>
    </div>
  )

  if (!report) return null

  return (
    <div className="flex flex-col h-screen bg-[#0F1520]">
      {/* TOOLBAR */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#0F1520]/95 backdrop-blur-xl">
        <div className="px-5 h-14 flex items-center gap-3">
          {/* Left */}
          <Link href="/dashboard" className="btn-secondary py-1.5 px-3 text-sm flex-shrink-0">
            <ArrowLeft size={14} />
          </Link>
          <div className="flex items-center gap-2 mr-auto min-w-0">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-teal-400 flex-shrink-0 flex items-center justify-center">
              <BarChart3 size={11} className="text-white" />
            </div>
            <h1 className="font-display font-semibold text-white text-sm truncate">{report.title}</h1>
            <span className="text-xs text-slate-500 flex-shrink-0 hidden sm:block">
              · {formatDate(report.created_at)}
            </span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowCode(v => !v)}
              className={`btn-secondary py-1.5 px-3 text-sm ${showCode ? 'border-blue-500/50 text-blue-400' : ''}`}
              title="View HTML source"
            >
              <Code2 size={14} />
            </button>
            <button onClick={copyLink} className="btn-secondary py-1.5 px-3 text-sm" title="Share link">
              {copying ? <Check size={14} className="text-green-400" /> : <Share2 size={14} />}
            </button>
            <button onClick={exportPDF} disabled={exporting} className="btn-secondary py-1.5 px-3 text-sm" title="Export PDF (browser print)">
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={downloadHTML} className="btn-primary py-1.5 px-4 text-sm">
              <Download size={14} />
              <span className="hidden sm:inline">HTML</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN: iframe preview OR code view */}
      {showCode ? (
        <div className="flex-1 overflow-auto bg-[#0D1117]">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400 font-mono">Generated HTML source</span>
              <button onClick={downloadHTML} className="btn-secondary text-xs py-1 px-3">
                <Download size={12} /> Download
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-all bg-[#161B22] rounded-xl p-6 border border-white/[0.06] overflow-x-auto">
              {report.html_content}
            </pre>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-slate-100 relative">
          {/* Browser-like address bar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg px-4 py-1.5 text-xs text-slate-400 font-mono flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            {report.title.toLowerCase().replace(/\s+/g, '-')}.html
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={report.html_content || ''}
            className="w-full h-full border-0"
            title={report.title}
            sandbox="allow-scripts"
          />
        </div>
      )}

      {/* STATUS BAR */}
      <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0F1520]/80 px-5 py-2 flex items-center justify-between text-xs text-slate-600">
        <span>Type: {report.report_type.replace('_', ' ')} · Theme: {report.theme}</span>
        <span>{report.metrics.length} metrics · {report.html_content?.length.toLocaleString()} chars</span>
      </div>
    </div>
  )
}
