'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3, Plus, LogOut, Loader2, FileText,
  Trash2, ExternalLink, Clock, Sparkles, ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Profile, Report } from '@/types'
import { formatRelativeTime, REPORT_TYPES } from '@/lib/utils'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: prof }, { data: reps }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])
      setProfile(prof)
      setReports(reps || [])
      setLoading(false)
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function deleteReport(id: string) {
    setDeleting(id)
    await supabase.from('reports').delete().eq('id', id)
    setReports(r => r.filter(x => x.id !== id))
    setDeleting(null)
  }

  const typeInfo = (type: string) => REPORT_TYPES.find(t => t.id === type)
  const usedPct = profile ? (profile.generations_used / profile.generations_limit) * 100 : 0
  const canGenerate = profile ? profile.generations_used < profile.generations_limit : false

  if (loading) return (
    <div className="mesh-bg min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-blue-400" />
    </div>
  )

  return (
    <div className="mesh-bg min-h-screen">
      {/* NAV */}
      <nav className="border-b border-white/[0.06] bg-[#0F1520]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white">DashGen</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{profile?.email}</span>
            <button onClick={signOut} className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* HEADER ROW */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-white mb-1">
              My Dashboards
            </h1>
            <p className="text-slate-400">
              {reports.length} report{reports.length !== 1 ? 's' : ''} generated
            </p>
          </div>
          <Link
            href="/generate"
            className={`btn-primary py-3 px-6 ${!canGenerate ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Plus size={16} /> New Dashboard
          </Link>
        </div>

        {/* USAGE CARD */}
        <div className="glass p-6 rounded-2xl mb-8 flex items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">
                Generation quota · <span className="capitalize text-white">{profile?.plan}</span> plan
              </span>
              <span className="text-sm font-mono text-white">
                {profile?.generations_used} / {profile?.generations_limit}
              </span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(usedPct, 100)}%`,
                  background: usedPct > 80 ? '#EF4444' : usedPct > 60 ? '#F59E0B' : '#3B82F6'
                }}
              />
            </div>
            {!canGenerate && (
              <p className="text-xs text-amber-400 mt-2">
                ⚠ You've used all free generations. Upgrade to continue.
              </p>
            )}
          </div>
          {profile?.plan === 'free' && (
            <div className="flex-shrink-0">
              <button className="btn-primary py-2 px-5 text-sm">
                <Sparkles size={14} /> Upgrade to Pro
              </button>
            </div>
          )}
        </div>

        {/* REPORTS GRID */}
        {reports.length === 0 ? (
          <div className="glass rounded-2xl p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <FileText size={28} className="text-blue-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-white mb-2">No dashboards yet</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Generate your first AI-powered BI dashboard in 30 seconds.
            </p>
            <Link href="/generate" className="btn-primary py-2.5 px-6">
              <Plus size={16} /> Create your first dashboard
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* NEW button card */}
            <Link href="/generate" className={`glass rounded-2xl p-6 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 min-h-[200px] hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group ${!canGenerate ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Plus size={22} className="text-blue-400" />
              </div>
              <span className="text-sm text-slate-400 group-hover:text-white transition-colors">New Dashboard</span>
            </Link>

            {reports.map((r, i) => {
              const t = typeInfo(r.report_type)
              const statusColor = r.status === 'done' ? 'badge-green' : r.status === 'error' ? 'badge-red' : 'badge-amber'
              return (
                <div key={r.id}
                  className="glass rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all group"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl">{t?.icon}</span>
                      <h3 className="font-display font-semibold text-white truncate">{r.title}</h3>
                    </div>
                    <span className={`badge ${statusColor} flex-shrink-0`}>
                      {r.status}
                    </span>
                  </div>

                  {/* Description */}
                  {r.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{r.description}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="badge badge-blue capitalize">{r.report_type.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {formatRelativeTime(r.created_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] mt-auto">
                    {r.status === 'done' && (
                      <Link
                        href={`/preview/${r.id}`}
                        className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center"
                      >
                        <ExternalLink size={12} /> View
                      </Link>
                    )}
                    {r.status !== 'done' && (
                      <Link
                        href={`/generate?edit=${r.id}`}
                        className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
                      >
                        <ChevronRight size={12} /> Edit
                      </Link>
                    )}
                    <button
                      onClick={() => deleteReport(r.id)}
                      disabled={deleting === r.id}
                      className="btn-secondary text-xs py-1.5 px-3 text-red-400 hover:text-red-300 hover:border-red-500/30"
                    >
                      {deleting === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
