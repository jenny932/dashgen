'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Upload, Download, History, Sparkles, BarChart3, PieChart, TrendingUp } from 'lucide-react'

const FEATURES = [
  { icon: Zap,       title: 'Generate in 30s',   desc: 'Input your metrics and get a production-ready dashboard instantly.' },
  { icon: Upload,    title: 'Style Reference',    desc: 'Upload a screenshot of a dashboard you like — AI replicates the look.' },
  { icon: BarChart3, title: '6 Report Types',     desc: 'Supply chain, sales, finance, HR, operations, or fully custom.' },
  { icon: Download,  title: 'Export Anywhere',   desc: 'Download as HTML or PDF. Embed directly in your presentations.' },
  { icon: History,   title: 'History & Edit',    desc: 'All your reports saved. Revisit and regenerate anytime.' },
  { icon: Sparkles,  title: 'AI-Powered Style',  desc: 'Every dashboard is unique — professionally designed, never generic.' },
]

const REPORT_TYPES = [
  { label: 'Supply Chain', color: 'teal',   icon: '🔗' },
  { label: 'Sales',        color: 'blue',   icon: '📈' },
  { label: 'Finance',      color: 'green',  icon: '💰' },
  { label: 'HR',           color: 'purple', icon: '👥' },
  { label: 'Operations',   color: 'amber',  icon: '⚙️' },
  { label: 'Custom',       color: 'slate',  icon: '✨' },
]

export default function HomePage() {
  return (
    <div className="mesh-bg min-h-screen">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#0F1520]/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <BarChart3 size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">DashGen</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary text-sm py-2 px-4">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge badge-blue mb-6 py-1.5 px-4">
            <Sparkles size={12} />
            <span>AI-Powered Dashboard Generator</span>
          </div>

          <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight mb-6 text-white">
            Describe your data.<br />
            <span className="gradient-text">Get a beautiful dashboard.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Input your metrics and report type. DashGen uses AI to generate a
            professional, interactive BI dashboard — ready to export in 30 seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-primary text-base py-3 px-8 glow-blue">
              Start for free <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-secondary text-base py-3 px-8">
              Sign in
            </Link>
          </div>

          <p className="text-sm text-slate-500 mt-4">3 free generations · No credit card required</p>
        </div>

        {/* MOCK PREVIEW */}
        <div className="max-w-5xl mx-auto mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0F1520] z-10 pointer-events-none" style={{top:'60%'}} />
          <div className="glass p-1 rounded-2xl border border-white/10 shadow-2xl">
            <div className="rounded-xl overflow-hidden bg-[#161D2E] p-6">
              {/* Fake dashboard preview */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-5 w-48 rounded shimmer mb-2" />
                  <div className="h-3 w-32 rounded shimmer" />
                </div>
                <div className="flex gap-2">
                  {['Supply Chain','Sales','Finance'].map(t => (
                    <div key={t} className="badge badge-blue text-xs px-3 py-1">{t}</div>
                  ))}
                </div>
              </div>
              {/* KPI row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Inventory Turnover', val: '4.6x',   delta: '+12%', color: '#22C55E' },
                  { label: 'On-Time Delivery',   val: '91.4%',  delta: '-2%',  color: '#F59E0B' },
                  { label: 'Defect Rate',        val: '1.8%',   delta: '-0.3%',color: '#22C55E' },
                  { label: 'Supplier Score',     val: '87.5',   delta: '+4',   color: '#22C55E' },
                ].map(k => (
                  <div key={k.label} className="glass-2 p-4 rounded-xl">
                    <div className="text-xs text-slate-500 mb-1">{k.label}</div>
                    <div className="text-2xl font-bold font-display text-white">{k.val}</div>
                    <div className="text-xs mt-1" style={{ color: k.color }}>{k.delta}</div>
                  </div>
                ))}
              </div>
              {/* Chart bars */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 glass-2 p-4 rounded-xl h-36 flex items-end gap-2">
                  {[60,80,45,90,70,85,55,95,75,88,65,92].map((h,i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i%3===0?'#3B82F6':i%3===1?'rgba(59,130,246,0.3)':'rgba(59,130,246,0.15)' }} />
                  ))}
                </div>
                <div className="glass-2 p-4 rounded-xl h-36 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-8 border-[#3B82F6] border-t-[#14B8A6] border-r-[#22C55E]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REPORT TYPES */}
      <section className="py-16 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-white mb-3">6 Report Categories</h2>
          <p className="text-slate-400">Built-in metric suggestions for every department</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-3 md:grid-cols-6 gap-4">
          {REPORT_TYPES.map(t => (
            <div key={t.label} className="glass p-4 rounded-xl text-center hover:border-white/20 transition-colors cursor-default">
              <div className="text-2xl mb-2">{t.icon}</div>
              <div className="text-xs text-slate-400 font-medium">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Everything you need</h2>
            <p className="text-slate-400">From idea to shareable dashboard in under a minute</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="glass p-6 rounded-xl hover:border-white/20 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <f.icon size={20} className="text-blue-400" />
                </div>
                <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="font-display text-3xl font-bold text-white mb-3">Simple pricing</h2>
          <p className="text-slate-400">Start free, upgrade when you need more</p>
        </div>
        <div className="max-w-3xl mx-auto grid md:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '$0', period: 'forever', gens: '3 generations', features: ['Basic templates','HTML export','Community support'], cta: 'Get started', primary: false },
            { name: 'Pro',  price: '$19', period: '/month', gens: '50 generations', features: ['All report types','Reference image upload','History & re-edit','PDF export','Priority support'], cta: 'Start Pro', primary: true },
            { name: 'Team', price: '$49', period: '/month', gens: '200 generations', features: ['Everything in Pro','Team workspace','Custom branding','API access'], cta: 'Start Team', primary: false },
          ].map(plan => (
            <div key={plan.name} className={`glass p-6 rounded-xl ${plan.primary ? 'border-blue-500/50 glow-blue' : ''}`}>
              {plan.primary && <div className="badge badge-blue text-xs mb-3">Most popular</div>}
              <div className="font-display text-xl font-bold text-white mb-1">{plan.name}</div>
              <div className="mb-4">
                <span className="text-3xl font-bold font-display text-white">{plan.price}</span>
                <span className="text-slate-400 text-sm">{plan.period}</span>
              </div>
              <div className="text-sm text-blue-400 font-medium mb-4">{plan.gens}</div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="text-sm text-slate-400 flex items-center gap-2">
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={plan.primary ? 'btn-primary w-full' : 'btn-secondary w-full'}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            Ready to generate your first dashboard?
          </h2>
          <p className="text-slate-400 mb-8">No credit card needed. 3 free generations to start.</p>
          <Link href="/signup" className="btn-primary text-base py-3 px-10 glow-blue">
            Get started free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-8 px-6 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
            <BarChart3 size={10} className="text-white" />
          </div>
          <span className="text-white font-display font-semibold">DashGen</span>
        </div>
        <p>© 2025 DashGen. AI-powered BI dashboard generation.</p>
      </footer>
    </div>
  )
}
