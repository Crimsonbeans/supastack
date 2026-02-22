'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import CTASection from '@/components/landing/CTASection'
import { useFadeUp } from '@/components/landing/FadeUp'

/* ─── Dimension Data ─── */
const gtmDimensions = [
  {
    label: 'People & Org',
    title: 'People & Org Readiness',
    desc: 'Structure, roles, incentives, leadership coverage. We assess change capacity, leadership sponsorship, and the incentives to absorb AI-driven workflows.',
    items: [
      { title: 'Organisational Structure', desc: 'Role clarity, reporting lines, and team design for AI-driven change.' },
      { title: 'Role Evolution', desc: 'Skills inventory and capability gaps for new AI-enabled workflows.' },
      { title: 'Leadership Alignment', desc: 'Executive sponsorship strength and change governance readiness.' },
    ],
  },
  {
    label: 'Data & Intelligence',
    title: 'Data & Revenue Intelligence',
    desc: 'Metrics completeness, attribution, forecasting. Integrity of pipeline, customer, and financial signals — and how they inform prioritisation.',
    items: [
      { title: 'Data Quality', desc: 'CRM hygiene, data governance standards, and completeness across key objects.' },
      { title: 'Revenue Signals', desc: 'Pipeline visibility, attribution models, and forecasting accuracy.' },
      { title: 'Intelligence Cadence', desc: 'Reporting rhythms, review cadences, and decision-making quality.' },
    ],
  },
  {
    label: 'Technology & Stack',
    title: 'Technology & Stack',
    desc: 'CRM, RevOps tooling, automation, AI adoption. Systems architecture, interoperability, and technical debt tolerance for new AI services.',
    items: [
      { title: 'Stack Architecture', desc: 'Tech stack coherence, integration maturity, and vendor coverage assessment.' },
      { title: 'AI Enablement', desc: 'Current AI tool adoption, use case readiness, and adoption barriers.' },
      { title: 'Automation Framework', desc: 'Workflow automation coverage and process automation opportunity mapping.' },
    ],
  },
  {
    label: 'Commercial Strategy',
    title: 'Commercial Strategy & GTM',
    desc: 'ICP, pricing, routes to market, positioning. Product-market motion, route-to-market coverage, and AI leverage in customer experience.',
    items: [
      { title: 'ICP Definition', desc: 'Ideal customer profile clarity, segmentation quality, and market focus.' },
      { title: 'Pricing & Packaging', desc: 'Monetisation model coherence and value-based pricing maturity.' },
      { title: 'Go-to-Market Motion', desc: 'Channel coverage, motion alignment, and sales play documentation.' },
    ],
  },
  {
    label: 'Operations & Process',
    title: 'Operations & Process',
    desc: 'Lead management, sales process, customer lifecycle. Workflow maturity, automation coverage, and the rituals that keep teams aligned.',
    items: [
      { title: 'Process Documentation', desc: 'Documented workflows, SOPs, and playbook completeness across functions.' },
      { title: 'RevOps Command Centre', desc: 'Cross-functional alignment, operating rhythm, and RevOps maturity level.' },
      { title: 'Continuous Improvement', desc: 'Retrospective culture, iteration speed, and metric-driven optimisation.' },
    ],
  },
  {
    label: 'Financial & Economics',
    title: 'Financial & Unit Economics',
    desc: 'CAC/LTV, margin structure, scalability. Margin sensitivity, capital allocation, and the ROI guardrails that shape every pilot.',
    items: [
      { title: 'Unit Economics', desc: 'CAC, LTV, payback period, and gross margin visibility and accuracy.' },
      { title: 'Capital Allocation', desc: 'Investment prioritisation framework and ROI tracking infrastructure.' },
      { title: 'Board Visibility', desc: 'Executive reporting quality and board-level financial narrative coherence.' },
    ],
  },
]

const partnershipDimensions = [
  {
    label: 'Strategy & Planning',
    title: 'Partnership Strategy & Planning',
    desc: 'How partnerships connect to your GTM plan, revenue targets, and market expansion. Ideal Partner Profiles, partner motions, TAM coverage, and competitive intelligence.',
    items: [
      { title: 'Strategic Alignment & Vision', desc: 'Partnership strategy documented, aligned to GTM and product roadmap, with clear revenue contribution targets and executive sponsorship.' },
      { title: 'IPP & TAM Coverage', desc: 'Ideal Partner Profiles scored against all partner types, with TAM mapping and partner coverage overlay driving recruitment priorities.' },
      { title: 'Market Intelligence', desc: 'Competitive ecosystem monitoring, portfolio risk modelling, and strategy refresh cadence informed by market signals.' },
    ],
  },
  {
    label: 'Program Design',
    title: 'Program Design & Operating Model',
    desc: 'The architecture of your partner programme. Bow Tie Funnel lifecycle, org design, RACI, Partner Ops capacity, and the infrastructure that makes partnerships repeatable and scalable.',
    items: [
      { title: 'Bow Tie Lifecycle', desc: 'Full partner lifecycle mapped from Identify through Expand using the Bow Tie Funnel model with KPIs and owners at each stage.' },
      { title: 'Org Design & RACI', desc: 'Documented roles across all lifecycle stages with cross-functional RACI — every handoff explicitly accountable.' },
      { title: 'Partner Ops & Governance', desc: 'Dedicated Partner Ops function with attribution logic, program health reviews, and governance forums.' },
    ],
  },
  {
    label: 'Sourcing & Onboarding',
    title: 'Sourcing, Recruitment & Onboarding',
    desc: 'How you find, qualify, and activate new partners. Outbound and inbound sourcing funnels, IPP-based qualification, contracting speed, and time-to-first-value activation.',
    items: [
      { title: 'Partner Sourcing', desc: 'Structured outbound and inbound sourcing strategies using IPP targeting, market signals, and AI-assisted prospect identification.' },
      { title: 'Discovery & Qualification', desc: 'Evidence-based qualification scoring predicting partner success — IPP fit and conversion tracking across the full funnel.' },
      { title: 'Onboarding & Activation', desc: 'Motion-specific onboarding playbooks with SLA-tracked completion and first-90-day activation benchmarks.' },
    ],
  },
  {
    label: 'Enablement & Lifecycle',
    title: 'Enablement & Lifecycle Support',
    desc: 'How you equip partners to sell, deliver, and succeed — and how you manage the full lifecycle from activation through expansion to sunset.',
    items: [
      { title: 'Activation Efficiency', desc: 'Onboarding completion rates, Time-to-First-Lead, and first-90-day activation tracked against SLAs with AI-driven performance alerts.' },
      { title: 'Enablement Toolkit', desc: 'Partner Welcome Guides, ICP slides, campaign templates, and deal registration processes — segmented by tier and motion, usage-tracked.' },
      { title: 'Lifecycle Management', desc: 'Expand, Nurture, and Sunset pathways governed by data: QBR cadence, engagement scoring, tiering reviews, and measured exit criteria.' },
    ],
  },
  {
    label: 'Technology',
    title: 'Technology & Infrastructure',
    desc: 'The systems powering partner operations. CRM integration, PRM portals, deal registration, analytics, workflow automation, and the data layer that removes friction.',
    items: [
      { title: 'CRM & Data Management', desc: 'Partner data tracked in CRM with lifecycle stage visibility, attribution fields, and data quality standards enforced across all partner types.' },
      { title: 'PRM & Partner Portal', desc: 'Dedicated partner portal with tier-specific access, enablement assets, deal registration, and AI-personalised content delivery.' },
      { title: 'Analytics & Automation', desc: 'Live dashboards, automated deal routing, workflow triggers across lifecycle stages, and reporting infrastructure connecting activity to revenue.' },
    ],
  },
  {
    label: 'Measurement & Growth',
    title: 'Measurement, Growth & Optimisation',
    desc: "How you track what's working, scale what converts, and exit what doesn't. KPI frameworks, attribution, tiering, and benchmarking that drive continuous improvement.",
    items: [
      { title: 'KPI Framework & Attribution', desc: 'Partner-sourced, partner-influenced, and partner-touched attribution enforced consistently with full revenue tracking.' },
      { title: 'Performance & Tiering', desc: 'Scorecard-driven reviews with tiering criteria, leading indicators, and clear consequence models for underperformance.' },
      { title: 'Benchmarking & Growth', desc: 'Industry benchmarking and growth planning for top partners — new geographies, new products, new segments.' },
    ],
  },
  {
    label: 'Leadership & Org',
    title: 'Leadership & Organisational Readiness',
    desc: 'Executive sponsorship, organisational structure, cross-functional alignment, incentive design, and the leadership maturity required to make partnerships a strategic function.',
    items: [
      { title: 'Executive Sponsorship', desc: 'Board-level accountability for partnership revenue with named C-suite sponsors, allocated budget, and quarterly business reviews.' },
      { title: 'Cross-Functional Alignment', desc: 'Defined RACI across sales, marketing, product, and CS for partner-related activities — eliminating internal friction.' },
      { title: 'Incentive & Culture', desc: 'Compensation structures, incentive alignment, and organisational culture assessed for partnership readiness.' },
    ],
  },
]

/* ─── ReadinessPulse Widget ─── */
function ReadinessPulse() {
  const dims = [
    { label: 'People & Org', score: 87 },
    { label: 'Data & Intelligence', score: 91 },
    { label: 'Technology Stack', score: 84 },
    { label: 'GTM Strategy', score: 89 },
    { label: 'Operations', score: 86 },
    { label: 'Financial Guardrails', score: 93 },
  ]
  return (
    <div className="relative p-[1px] rounded-3xl overflow-hidden shadow-2xl shadow-blue-700/10" style={{ background: 'conic-gradient(from 0deg,#1d4ed8,#2563eb,#0284c7,#06b6d4,#1d4ed8)' }}>
      <div className="relative bg-[#0c0c1a] rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0f0f24] to-[#12122a] px-8 py-6 flex justify-between items-center">
          <span className="font-medium text-slate-400 uppercase tracking-[0.2em] text-xs">Readiness Pulse</span>
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-400">88</span>
        </div>
        <div className="p-8 space-y-5">
          {dims.map((d) => (
            <div key={d.label} className="flex items-center justify-between group">
              <span className="text-slate-400 font-medium text-sm group-hover:text-slate-200 transition-colors">{d.label}</span>
              <div className="flex items-center gap-4 flex-1 justify-end">
                <div className="h-2 w-32 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 rounded-full" style={{ width: `${d.score}%` }} />
                </div>
                <span className="text-white font-bold tabular-nums text-sm">{d.score}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/[0.03] to-transparent pointer-events-none" />
      </div>
    </div>
  )
}

/* ─── Comparison Section ─── */
function ComparisonSection() {
  const XIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M12 4L4 12M4 4l8 8" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" /></svg>
  )
  const CheckIcon = () => (
    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M3 8.5l3.5 3.5L13 4" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
  )

  return (
    <section className="py-20 md:py-28 max-w-[1120px] mx-auto px-6">
      <div className="text-center mb-14 fade-up">
        <h2 className="text-[clamp(2rem,4vw,2.75rem)] font-bold tracking-tight leading-[1.15] text-[#1a1d27] mb-4">Evidence-Led GTM Transformation</h2>
        <p className="text-lg text-[#5a5f72] max-w-[600px] mx-auto leading-relaxed">AI finds the patterns. Humans validate the priorities. You get execution-ready plans.</p>
      </div>
      <div className="cards-grid">
        <div className="comparison-card comparison-card--light fade-up">
          <div className="text-[0.7rem] font-semibold tracking-[0.12em] uppercase mb-3 text-[#8b90a0]">Traditional Consulting</div>
          <div className="text-[1.65rem] font-bold tracking-tight mb-3 text-[#1a1d27]">8–12 weeks discovery</div>
          <div className="text-[0.95rem] leading-relaxed mb-7 text-[#5a5f72]">Interview-led, subjective. AI-only or human-only. Long lists of ideas. Reports on shelves.</div>
          <div className="flex gap-10 mb-8 pb-7 border-b border-[#e2e4e9]">
            <div><div className="text-2xl font-bold text-[#1a1d27]">8–12 weeks</div><div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase mt-0.5 text-[#8b90a0]">Discovery</div></div>
            <div><div className="text-2xl font-bold text-[#1a1d27]">£50–150K+</div><div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase mt-0.5 text-[#8b90a0]">Investment</div></div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { cat: 'Approach', text: 'Interview-led, subjective readouts' },
              { cat: 'Validation', text: 'AI-only or human-only. Rarely both.' },
              { cat: 'Output', text: 'Long lists of ideas and shelfware' },
              { cat: 'Result', text: 'Reports on shelves' },
            ].map((item) => (
              <div key={item.cat} className="flex items-start gap-3">
                <div className="shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center"><XIcon /></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase inline-block px-2 py-0.5 rounded bg-[#f0f1f4] text-[#8b90a0] w-fit">{item.cat}</span>
                  <span className="text-[0.9rem] leading-relaxed text-[#b0b3c0] line-through decoration-[1.5px]">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="comparison-card comparison-card--dark fade-up fade-up-d1">
          <div className="text-[0.7rem] font-semibold tracking-[0.12em] uppercase mb-3 text-[#7c6aff]">Supastack Approach</div>
          <div className="text-[1.65rem] font-bold tracking-tight mb-3 text-white">Days to first insights</div>
          <div className="text-[0.95rem] leading-relaxed mb-7 text-[#8b90b8]">Evidence-led, AI-powered. Human-in-the-Loop validation. Prioritised, feasible initiatives. Execution-ready requirements.</div>
          <div className="flex gap-10 mb-8 pb-7 border-b border-white/[0.08]">
            <div><div className="text-2xl font-bold text-white">Days</div><div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase mt-0.5 text-[#8b90b8]">To Insights</div></div>
            <div><div className="text-2xl font-bold text-white">From £20K</div><div className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase mt-0.5 text-[#8b90b8]">All-In</div></div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { cat: 'Approach', text: 'Evidence-led, AI-powered signal modelling' },
              { cat: 'Validation', text: 'Human-in-the-loop alignment with operating leaders' },
              { cat: 'Output', text: 'Prioritised, feasible initiatives with clear ROI' },
              { cat: 'Result', text: 'Execution-ready requirements, matched resources' },
            ].map((item) => (
              <div key={item.cat} className="flex items-start gap-3">
                <div className="shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center"><CheckIcon /></div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.65rem] font-semibold tracking-[0.1em] uppercase inline-block px-2 py-0.5 rounded bg-[#2a2d3a] text-[#a0a3c0] w-fit">{item.cat}</span>
                  <span className="text-[0.9rem] leading-relaxed text-[#e8e9f0]">{item.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Dimensions Section ─── */
function DimensionsSection() {
  const [activeTab, setActiveTab] = useState<'gtm' | 'partnerships'>('gtm')
  const [gtmIdx, setGtmIdx] = useState(0)
  const [pIdx, setPIdx] = useState(0)

  const dims = activeTab === 'gtm' ? gtmDimensions : partnershipDimensions
  const activeIdx = activeTab === 'gtm' ? gtmIdx : pIdx
  const setIdx = activeTab === 'gtm' ? setGtmIdx : setPIdx

  return (
    <section className="py-24 md:py-36 bg-[#080812] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'linear-gradient(rgba(29,78,216,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(29,78,216,.06) 1px,transparent 1px)', backgroundSize: '80px 80px' }} />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 fade-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Dimensions of Readiness</h2>
          <p className="text-xl text-slate-400">Choose your lens. Every initiative scored on Impact × Feasibility.</p>
        </div>
        <div className="flex justify-center mb-4 fade-up">
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1 gap-1">
            <button onClick={() => setActiveTab('gtm')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'gtm' ? 'tab-btn active text-white' : 'text-slate-400'}`}>GTM &amp; RevOps — 6 Dimensions</button>
            <button onClick={() => setActiveTab('partnerships')} className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'partnerships' ? 'tab-btn active text-white' : 'text-slate-400'}`}>Partnerships — 7 Dimensions</button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-500 mb-16 fade-up">Same operating system. Same diagnostic rigour. Different lens.</p>
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            {dims.map((d, i) => (
              <button key={d.label} onClick={() => setIdx(i)} className={`flex items-center text-left px-5 py-4 rounded-xl border whitespace-nowrap lg:whitespace-normal transition-all ${i === activeIdx ? 'border-blue-700/30 text-blue-300 tab-btn active' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {i === activeIdx && <span className="w-2 h-2 rounded-full bg-blue-600 mr-3 shrink-0" style={{ boxShadow: '0 0 8px rgba(29,78,216,0.6)' }} />}
                <span className="font-medium">{d.label}</span>
              </button>
            ))}
          </div>
          <div className="lg:col-span-9">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-12 backdrop-blur-sm">
              <h3 className="text-3xl font-bold text-white mb-4">{dims[activeIdx].title}</h3>
              <p className="text-lg text-slate-400 mb-12 max-w-3xl">{dims[activeIdx].desc}</p>
              <div className="grid md:grid-cols-3 gap-8">
                {dims[activeIdx].items.map((item) => (
                  <div key={item.title} className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] hover:border-blue-700/30 hover:bg-white/[0.06] transition-all duration-300">
                    <h4 className="text-blue-400 font-bold mb-3">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="text-center text-slate-500 text-sm mt-12">
          You get a prioritised portfolio, not a long list of ideas.{' '}
          <strong className="text-slate-400">{activeTab === 'gtm' ? '140 criteria. 6 dimensions.' : '164 criteria. 7 dimensions.'}</strong>{' '}
          Built from real {activeTab === 'gtm' ? 'GTM' : 'partnerships'} transformations.
        </p>
      </div>
    </section>
  )
}

/* ─── Dividers ─── */
const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent" />
const DividerDark = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent" />

/* ═══════════════ HOME PAGE ═══════════════ */
export default function HomePage() {
  const fadeRef = useFadeUp()

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelectorAll('#hero .fade-up').forEach((el) => el.classList.add('visible'))
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={fadeRef} className="bg-white text-slate-900 selection:bg-blue-500/30">
      <Navigation activePage="home" transparent />

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'strict' }}>
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[80px] opacity-30" style={{ top: '-10%', left: '5%', background: 'radial-gradient(circle,#bfdbfe,transparent 70%)', animation: 'ss-float 20s ease-in-out infinite', backfaceVisibility: 'hidden' }} />
          <div className="absolute w-[500px] h-[500px] rounded-full blur-[60px] opacity-25" style={{ top: '25%', right: '0%', background: 'radial-gradient(circle,#93c5fd,transparent 70%)', animation: 'ss-float-rev 25s ease-in-out infinite', backfaceVisibility: 'hidden' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full blur-[50px] opacity-20" style={{ bottom: '-5%', left: '35%', background: 'radial-gradient(circle,#bae6fd,transparent 70%)', animation: 'ss-float-slow 30s ease-in-out infinite', backfaceVisibility: 'hidden' }} />
        </div>
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: 'linear-gradient(rgba(29,78,216,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(29,78,216,.08) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
          <div className="space-y-8">
            <div className="fade-up">
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-widest uppercase">The Missing Operating System for AI-Driven GTM &amp; Partnerships Transformation</span>
            </div>
            <div className="fade-up fade-up-d1">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08]">95% of AI Pilots Fail.</h1>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-sky-600 shimmer-text">Not Because of the AI.</h1>
            </div>
            <div className="fade-up fade-up-d2">
              <p className="text-xl text-slate-500 leading-relaxed max-w-xl">SupaStack gives mid-market leadership teams a structured, evidence-led operating system to diagnose, prove, and operationalise AI across their go-to-market and partner ecosystems. One system. Multiple playbooks. Proven results.</p>
            </div>
            <div className="fade-up fade-up-d3 flex flex-col sm:flex-row gap-4 pt-2">
              <Link href="/signup" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold shadow-lg shadow-blue-700/25 hover:shadow-blue-700/40 transition-shadow duration-300">
                Get Your Free Web Scan
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <Link href="/how-it-works" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm">See How It Works</Link>
            </div>
          </div>
          <div className="fade-up fade-up-d2"><ReadinessPulse /></div>
        </div>
      </section>

      <Divider />

      {/* PROBLEM */}
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Why GTM Transformation Fails</h2>
            <p className="text-xl text-slate-500">It&apos;s not the AI. It&apos;s the readiness gap — 83% of leaders know AI will transform their business, but only 39% feel confident implementing it.</p>
          </div>
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit mb-12 lg:mb-0 fade-up">
              <div className="w-20 h-1 bg-gradient-to-r from-blue-700 to-blue-600 mb-8 rounded-full" />
              <h3 className="text-3xl font-bold text-slate-900 leading-snug">The problem isn&apos;t AI. It&apos;s the guidance gap between GTM strategy and RevOps execution.</h3>
            </div>
            <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
              {[
                { num: '01', title: 'Opinion-Led Discovery', desc: 'Traditional consultants rely on interviews and workshops. You get filtered narratives, not ground truth about your revenue engine.' },
                { num: '02', title: 'Disconnected from Revenue Reality', desc: 'AI and GTM initiatives live in silos, disconnected from how marketing, sales, and CS actually work together.' },
                { num: '03', title: 'Endless Planning Cycles', desc: '8–12 weeks of discovery. £50–150K spent. And still no execution-ready specs for your revenue operations.' },
                { num: '04', title: 'Technology-First Thinking', desc: 'Vendors sell point solutions. You need an integrated revenue engine. The gap costs you £25–100K/year.' },
              ].map((item, i) => (
                <div key={item.num} className={`fade-up ${i === 1 ? 'fade-up-d1' : i === 2 ? 'fade-up-d2' : i === 3 ? 'fade-up-d3' : ''}`}>
                  <div className="card-hover"><div className="relative rounded-3xl bg-slate-50 p-8 border border-slate-100">
                    <span className="text-5xl font-mono font-extralight text-slate-200 block mb-4">{item.num}</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div></div>
                </div>
              ))}
              <div className="md:col-span-2 fade-up">
                <p className="text-center text-lg font-semibold text-slate-400 italic pt-4">&ldquo;They fail because nobody diagnosed what needed to change first.&rdquo;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <DividerDark />
      <section className="py-24 md:py-36 bg-[#0a0a14] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1d4ed8 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-4 md:px-6 py-12 relative z-10 max-w-5xl text-center">
          <div className="fade-up"><p className="text-blue-400 font-medium tracking-[0.3em] uppercase text-sm mb-10">We Believe Transformation Shouldn&apos;t Be This Hard</p></div>
          <div className="fade-up fade-up-d1"><h2 className="text-3xl md:text-5xl font-light leading-tight md:leading-tight text-slate-200/90">&ldquo;The AI revolution promised speed. Instead, most companies got: 8-week discovery cycles. £100K consulting bills. PowerPoints that never became products. We started SupaStack because mid-market companies deserve better than expensive opinion-gathering dressed up as strategy.&rdquo;</h2></div>
        </div>
      </section>
      <Divider />

      {/* SERVICE MODEL */}
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">From Assessment to Action</h2>
            <p className="text-xl text-slate-500">AI finds the patterns. Humans validate the priorities. You get execution-ready plans — not shelf-ware.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 relative">
            <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-slate-100 -z-10" />
            {[
              { num: '01', title: 'Web Scan', desc: 'AI analyses public signals about your company. See your readiness score and competitive position in minutes.', deliverable: 'Readiness Report', outcome: 'Readiness score in minutes', highlight: false },
              { num: '02', title: 'Deep Diagnostic', desc: 'We analyse your data, build a strategic blueprint, and validate it with your leadership and stakeholders.', deliverable: 'Strategic Blueprint', outcome: 'Direction locked, leadership aligned', highlight: true },
              { num: '03', title: 'Execution Blueprint', desc: 'Priorities locked. Ownership assigned. Execution-ready specs for each initiative — reviewed and aligned across teams.', deliverable: 'Blueprints', outcome: 'Teams briefed & resourced', highlight: false },
              { num: '04', title: 'Governed Execution', desc: 'We help you find the right resources and govern execution through to ROI achievement. Three gates, clear success criteria.', deliverable: 'Ongoing', outcome: 'Time-to-value assured', highlight: false },
            ].map((step, i) => (
              <div key={step.num} className={`relative pt-8 ${step.highlight ? 'md:-mt-8' : ''} fade-up ${i === 1 ? 'fade-up-d1' : i === 2 ? 'fade-up-d2' : i === 3 ? 'fade-up-d3' : ''}`}>
                {step.highlight ? (
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 bg-white z-10 relative mx-auto border-blue-800 text-blue-700 shadow-lg shadow-blue-300">{step.num}</div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-700/40 mx-auto" style={{ animation: 'ss-pulse 2s ease-out infinite' }} />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 bg-white z-10 relative mx-auto border-slate-100 text-slate-300 mb-6">{step.num}</div>
                )}
                <div className={`p-6 rounded-2xl border ${step.highlight ? 'bg-gradient-to-br from-blue-800 to-blue-600 text-white border-transparent shadow-xl shadow-blue-700/20' : 'bg-slate-50 border-slate-100 hover:border-blue-200 transition-colors'}`}>
                  <h3 className={`text-xl font-bold mb-4 ${step.highlight ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                  <p className={`mb-6 text-sm leading-relaxed ${step.highlight ? 'text-blue-100' : 'text-slate-500'}`}>{step.desc}</p>
                  <div className={`pt-4 border-t text-xs space-y-2 ${step.highlight ? 'border-blue-700/50 text-blue-200' : 'border-slate-200 text-slate-400'}`}>
                    <div className="font-semibold">Deliverable · {step.deliverable}</div>
                    <div className="font-semibold">Outcome · {step.outcome}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />
      <ComparisonSection />
      <Divider />
      <DimensionsSection />

      {/* RESULTS */}
      <DividerDark />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Proven Results</h2>
            <p className="text-xl text-slate-500">Mid-market operators choose SupaStack to compress the time between recognising AI potential and capturing measurable value.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="fade-up bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-blue-100/30 hover:-translate-y-1 transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-600 mb-4">[METRIC]</div>
              <p className="text-slate-700 text-lg">Partnership programme restructured and operationalised for a leading fintech platform.</p>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 block">Teya · Fintech</span>
            </div>
            <div className="fade-up fade-up-d1 bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-blue-100/30 hover:-translate-y-1 transition-all duration-300">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-600 mb-4">[METRIC]</div>
              <p className="text-slate-700 text-lg">GTM diagnostic and execution blueprint delivered for a B2B services leader.</p>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 block">ET2C International · B2B Services</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="py-16 bg-white/50 border-y border-slate-100/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="fade-up"><p className="text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-10">Trusted by Revenue Leaders at</p></div>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
            <div className="fade-up"><span className="text-xl font-bold text-slate-300 hover:text-blue-500 transition-colors duration-300 cursor-default">Teya</span></div>
            <div className="fade-up fade-up-d1"><span className="text-xl font-bold text-slate-300 hover:text-blue-500 transition-colors duration-300 cursor-default">ET2C International</span></div>
          </div>
        </div>
      </section>

      <CTASection
        title="Start With a Free Web Scan"
        description="See your readiness score across multiple dimensions, your competitive gaps vs. 5 peers, and your top 3 initiatives — in minutes, not months."
        primaryLabel="Get My Free Assessment"
        primaryHref="/signup"
        secondaryLabel="Review the Process"
        secondaryHref="/how-it-works"
      />

      <Footer activePage="home" />
    </div>
  )
}
