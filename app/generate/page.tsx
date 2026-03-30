'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, ArrowLeft, Plus, X, Upload, Sparkles,
  Loader2, ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Metric, ReportType, Theme } from '@/types'
import { REPORT_TYPES, METRIC_SUGGESTIONS } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

export const dynamic = 'force-dynamic'

export default function GeneratePage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reportType, setReportType] = useState<ReportType>('supply_chain')
  const [theme, setTheme] = useState<Theme>('light')
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [newMetric, setNewMetric] = useState('')
  const [refImage, setRefImage] = useState<File | null>(null)
  const [refPreview, setRefPreview] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [canGenerate, setCanGenerate] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      supabase.from('profiles').select('generations_used,generations_limit').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setCanGenerate(data.generations_used < data.generations_limit)
        })
    })
  }, [])

  function addMetric(name: string) {
    if (!name.trim() || metrics.find(m => m.name === name.trim())) return
    setMetrics(m => [...m, { id: uuid(), name: name.trim(), category: reportType }])
    setNewMetric('')
  }

  function removeMetric(id: string) {
    setMetrics(m => m.filter(x => x.id !== id))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setRefImage(file)
    const reader = new FileReader()
    reader.onload = ev => setRefPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    if (!title.trim()) { setError('Please enter a dashboard title.'); return }
    if (metrics.length === 0) { setError('Add at least one metric.'); return }
    if (!canGenerate) { setError('You have used all free generations. Please upgrade.'); return }
    setGenerating(true); setError('')

    // Upload reference image if provided
    let refImageUrl: string | undefined
    if (refImage && userId) {
      const path = `${userId}/${uuid()}.jpg`
      const { error: upErr } = await supabase.storage.from('ref-images').upload(path, refImage)
      if (!upErr) {
        const { data } = supabase.storage.from('ref-images').getPublicUrl(path)
        refImageUrl = data.publicUrl
      }
    }

    // Create report record
    const { data: report, error: dbErr } = await supabase.from('reports').insert({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      report_type: reportType,
      theme,
      metrics,
      ref_image_url: refImageUrl,
      status: 'generating',
    }).select().single()

    if (dbErr || !report) {
      setError('Failed to create report. Please try again.')
      setGenerating(false)
      return
    }

    // Trigger async generation — redirect immediately, preview page will poll for result
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: report.id,
        title: title.trim(),
        description: description.trim(),
        reportType,
        theme,
        metrics,
        refImageUrl,
      }),
    }).catch(() => {})

    // Redirect to preview immediately — no await
    router.push(`/preview/${report.id}`)
  }

  const suggestions = METRIC_SUGGESTIONS[reportType] || []

  return (
    <div className="mesh-bg min-h-screen">
      {/* NAV */}
      <nav className="border-b border-white/[0.06] bg-[#0F1520]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="btn-secondary py-1.5 px-3 text-sm">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <BarChart3 size={12} className="text-white" />
            </div>
            <span className="font-display font-semibold text-white">New Dashboard</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Generate a Dashboard</h1>
          <p className="text-slate-400">Fill in your requirements — AI will create a professional dashboard in ~30 seconds.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* LEFT: Form */}
          <div className="lg:col-span-3 space-y-6">

            {/* Title */}
            <div className="glass p-6 rounded-2xl space-y-4">
              <h2 className="font-display font-semibold text-white">Basic Info</h2>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Dashboard Title *</label>
                <input
                  className="input-base"
                  placeholder="e.g. Supply Chain Q2 2025 Overview"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Description <span className="text-slate-600">optional</span></label>
                <textarea
                  className="input-base resize-none"
                  rows={3}
                  placeholder="What does this dashboard show? Who is the audience?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Report Type */}
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-display font-semibold text-white mb-4">Report Type</h2>
              <div className="grid grid-cols-3 gap-3">
                {REPORT_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setReportType(t.id as ReportType); setMetrics([]) }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      reportType === t.id
                        ? 'border-blue-500/60 bg-blue-500/10 text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xl mb-1">{t.icon}</div>
                    <div className="text-xs font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-display font-semibold text-white mb-4">Color Theme</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['light', 'dark'] as Theme[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                      theme === t ? 'border-blue-500/60 bg-blue-500/10' : 'border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${t === 'dark' ? 'bg-[#070C14]' : 'bg-[#F0F3F7]'} border border-white/10`} />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white capitalize">{t}</div>
                      <div className="text-xs text-slate-500">{t === 'dark' ? 'Dark bg' : 'White bg'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-display font-semibold text-white mb-4">
                Metrics <span className="text-slate-500 text-sm font-normal">({metrics.length} added)</span>
              </h2>

              {/* Added metrics */}
              {metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {metrics.map(m => (
                    <div key={m.id} className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm px-3 py-1.5 rounded-lg">
                      <span>{m.name}</span>
                      <button onClick={() => removeMetric(m.id)} className="text-blue-400/60 hover:text-red-400 transition-colors ml-1">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add metric input */}
              <div className="flex gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="Type a metric name and press Enter"
                  value={newMetric}
                  onChange={e => setNewMetric(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMetric(newMetric) }}}
                />
                <button
                  onClick={() => addMetric(newMetric)}
                  className="btn-secondary px-3"
                  disabled={!newMetric.trim()}
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <button
                    onClick={() => setShowSuggestions(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-2"
                  >
                    <Lightbulb size={12} />
                    Suggested metrics
                    {showSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showSuggestions && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.filter(s => !metrics.find(m => m.name === s)).map(s => (
                        <button
                          key={s}
                          onClick={() => addMetric(s)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-white/[0.06] text-slate-400 hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/5 transition-all"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Options + Generate */}
          <div className="lg:col-span-2 space-y-6">

            {/* Reference image */}
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-display font-semibold text-white mb-1">Style Reference</h2>
              <p className="text-xs text-slate-500 mb-4">Upload a dashboard screenshot to copy its visual style</p>

              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

              {refPreview ? (
                <div className="relative">
                  <img src={refPreview} alt="Reference" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                  <button
                    onClick={() => { setRefImage(null); setRefPreview(''); if(fileRef.current) fileRef.current.value='' }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-36 border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-500/40 hover:text-blue-400 hover:bg-blue-500/5 transition-all"
                >
                  <Upload size={22} />
                  <span className="text-sm">Click to upload image</span>
                  <span className="text-xs">PNG, JPG up to 5MB</span>
                </button>
              )}
            </div>

            {/* Summary */}
            <div className="glass p-6 rounded-2xl">
              <h2 className="font-display font-semibold text-white mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type</span>
                  <span className="text-white capitalize">{reportType.replace('_',' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Theme</span>
                  <span className="text-white capitalize">{theme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metrics</span>
                  <span className="text-white">{metrics.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Style ref</span>
                  <span className="text-white">{refImage ? '✓ Uploaded' : 'None'}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={generating || !canGenerate || !title.trim() || metrics.length === 0}
                className="btn-primary w-full py-3 mt-5"
              >
                {generating ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating… ~30s</>
                ) : (
                  <><Sparkles size={16} /> Generate Dashboard</>
                )}
              </button>

              {!canGenerate && (
                <p className="text-xs text-amber-400 text-center mt-3">
                  Upgrade to Pro to generate more dashboards
                </p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
