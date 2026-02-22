'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import CTASection from '@/components/landing/CTASection'
import PageHero from '@/components/landing/PageHero'
import { useFadeUp, useHeroFadeUp } from '@/components/landing/FadeUp'

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent" />
const DividerDark = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/30 to-transparent" />

/* ─── Phase Accordion ─── */
function PhaseAccordion() {
  const [openPhase, setOpenPhase] = useState<string | null>('1a')

  const phases = [
    { id: '1a', tag: 'Strategy', tagClass: '', numClass: '', label: 'Strategic to Execution Blueprint — delivered', title: 'Strategic to Execution Blueprint — delivered', desc: 'We ask for limited data (CRM exports, financial summaries, process docs) and produce a Strategic Blueprint. Leadership aligned on hypotheses. Clear go/no-go for validation meeting with key stakeholders across the team.' },
    { id: '1b', tag: 'Validation', tagClass: '', numClass: '', label: 'Strategic to Execution Blueprint — validated', title: 'Strategic to Execution Blueprint — validated', desc: 'Stakeholders interviewed. Additional documentation collected. Meeting recorded. Strategic Blueprint re-run and validated with leadership for final sign-off.' },
    { id: '2a', tag: 'Execution', tagClass: 'phase-tag--sky', numClass: 'phase-num--sky', label: 'Execution to Requirements Blueprint — generated and validated', title: 'Execution to Requirements Blueprint — generated and validated', desc: 'Initiatives prioritised with clear ownership. Requirements Packs generated ready for execution.', sky: true },
    { id: '2b', tag: 'Delivery', tagClass: 'phase-tag--sky', numClass: 'phase-num--sky', label: 'Requirements Packs — generated', title: 'Requirements Packs — generated', desc: 'Reviewed with cross-stakeholder groups. Ready for execution with full alignment across teams.', sky: true },
  ]

  const togglePhase = (id: string) => {
    setOpenPhase(openPhase === id ? null : id)
  }

  return (
    <div className="phase-accordion fade-up">
      {phases.map((phase) => {
        const isOpen = openPhase === phase.id
        return (
          <div key={phase.id} className={`phase-item ${isOpen ? 'is-open' : ''} ${phase.sky ? 'phase-sky' : ''}`}>
            <button className="phase-btn" onClick={() => togglePhase(phase.id)}>
              <span className={`phase-num ${phase.numClass}`}>{phase.id}</span>
              <span className={`phase-tag ${phase.tagClass}`}>{phase.tag}</span>
              <span className="phase-btn-label">{phase.label}</span>
              <svg className="phase-chevron" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div className="phase-body" style={{ maxHeight: isOpen ? '300px' : '0' }}>
              <div className="phase-body-inner">
                <p className="phase-body-title">{phase.title}</p>
                <p className="phase-body-desc">{phase.desc}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function HowItWorksPage() {
  const fadeRef = useFadeUp()
  useHeroFadeUp()

  return (
    <div ref={fadeRef} className="bg-white text-slate-900 selection:bg-blue-500/30">
      <Navigation activePage="how-it-works" />

      <PageHero badge="How It Works">
        <div className="fade-up fade-up-d1">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-600 shimmer-text">Here&apos;s What Actually Happens.</span>
          </h1>
        </div>
        <div className="fade-up fade-up-d2">
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">It starts with a free web scan. If you like what you see, you&apos;re into a structured programme that gives your team everything they need to execute — in one month.</p>
        </div>
      </PageHero>

      {/* THE ALTERNATIVES */}
      <Divider />
      <section className="py-20 md:py-28 bg-[#f8f8fa] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-[820px] mx-auto">
            <div className="text-center mb-12 fade-up">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">The Alternatives</h2>
              <p className="text-xl text-slate-500">You have three real options. Here&apos;s what each one actually costs.</p>
            </div>
            <div className="alternatives-stack">
              <div className="alt-card alt-card--light">
                <div>
                  <div className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase mb-2 text-[#8b90a0]">Hire a Sales Ops Leader</div>
                  <div className="text-xl font-bold tracking-tight text-[#1a1d27]">Full-time senior hire</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-[0.88rem] leading-relaxed text-[#5a5f72]"><strong className="text-[#1a1d27] font-semibold">Timeline:</strong> 90+ days to find &amp; onboard</div>
                  <div className="text-[0.88rem] leading-relaxed text-[#5a5f72]"><strong className="text-[#1a1d27] font-semibold">Cost:</strong> £8–12k salary + execution budget</div>
                  <div className="text-[0.82rem] italic leading-relaxed mt-1.5 text-[#f87171] opacity-90">Wrong hire = 6 months wasted</div>
                </div>
              </div>
              <div className="alt-card alt-card--light">
                <div>
                  <div className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase mb-2 text-[#8b90a0]">Fix Things One at a Time</div>
                  <div className="text-xl font-bold tracking-tight text-[#1a1d27]">Tool-by-tool projects</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-[0.88rem] leading-relaxed text-[#5a5f72]"><strong className="text-[#1a1d27] font-semibold">Timeline:</strong> Starts fast, problems emerge later</div>
                  <div className="text-[0.88rem] leading-relaxed text-[#5a5f72]"><strong className="text-[#1a1d27] font-semibold">Cost:</strong> £20–50k per project</div>
                  <div className="text-[0.82rem] italic leading-relaxed mt-1.5 text-[#f87171] opacity-90">90% of AI projects fail this way</div>
                </div>
              </div>
              <div className="alt-card alt-card--dark">
                <div>
                  <div className="text-[0.65rem] font-semibold tracking-[0.12em] uppercase mb-2 text-[#2563eb]">Supastack</div>
                  <div className="text-xl font-bold tracking-tight text-white">AI diagnostic + expert GTM consultant</div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-[0.88rem] leading-relaxed text-[#94a3b8]"><strong className="text-white font-semibold">Timeline:</strong> 6 weeks to plan, then build with support</div>
                  <div className="text-[0.88rem] leading-relaxed text-[#94a3b8]"><strong className="text-white font-semibold">Cost:</strong> £10–12.5k/month all-in</div>
                  <div className="text-[0.82rem] italic leading-relaxed mt-1.5 text-[#93c5fd] opacity-90">Low risk — monthly, stop anytime</div>
                </div>
              </div>
            </div>
            <p className="text-center text-[0.95rem] text-[#5a5f72] leading-relaxed max-w-[640px] mx-auto fade-up">You get: the thinking of a senior operations leader, AI-powered analysis, and the flexibility to stop if it&apos;s not working.</p>
          </div>
        </div>
      </section>

      {/* WEB SCAN ENTRY POINT */}
      <Divider />
      <section className="py-24 md:py-36 bg-[#f8f8fa] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="fade-up">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Free · 48 hours · No data access required
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Start With a Free Web Scan</h2>
              <p className="text-lg text-slate-500 leading-relaxed mb-8">Our AI analyses publicly available signals about your company — website, job postings, tech stack indicators, social presence, competitor positioning, and market signals — across all dimensions of readiness.</p>
              <Link href="/signup" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold shadow-lg shadow-blue-700/25 hover:shadow-blue-700/40 transition-shadow duration-300">
                Get Your Free Web Scan →
              </Link>
            </div>
            <div className="fade-up fade-up-d1 space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-6">What you get</p>
              {[
                { title: 'Readiness score (1–100)', desc: 'With full dimension breakdown across every assessed area.' },
                { title: 'Competitive benchmarking', desc: 'Your position vs. 5 peer companies in your market.' },
                { title: 'Top 3 Initiatives', desc: 'With estimated impact — so you can prioritise before committing budget.' },
                { title: 'Red flags your team may not see', desc: 'An evidence-based outside-in view in minutes — the same starting point a £100K engagement takes 4 weeks to reach.' },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><span className="text-blue-700 text-sm font-bold">✓</span></div>
                  <div><p className="font-semibold text-slate-900 mb-1">{item.title}</p><p className="text-sm text-slate-500">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MONTH 1: 4-PHASE SYSTEM */}
      <DividerDark />
      <section className="py-24 md:py-36 bg-[#0a0a14] relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1d4ed8 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">A New 4-Stage System in<br />Month 1.</h2>
            <p className="text-xl text-slate-400">Architecting AI adoption into your GTM process. Every phase combines AI-powered analysis with a dedicated expert GTM consultant — because the best outcomes come from both.</p>
          </div>
          <PhaseAccordion />
          <div className="max-w-4xl mx-auto mt-14 fade-up">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 md:p-8">
              <p className="text-slate-300 italic text-lg text-center">Each phase has clear outputs and sign-offs. No execution begins until strategy is validated. No ambiguity about what you&apos;re paying for.</p>
            </div>
          </div>
        </div>
      </section>

      {/* MONTH 1 DELIVERABLES */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">What You&apos;ll Have at the End of Month 1</h2>
            <p className="text-xl text-slate-500">We work with leadership first. Your broader team only gets involved once you&apos;ve agreed the direction.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                title: 'Maturity Scores',
                desc: 'Quantified position across all dimensions — so you know exactly where you stand, not just what you think.',
                icon: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
              },
              {
                title: 'Strategic & Execution Roadmaps',
                desc: "Board-ready plan with priorities, sequencing, and KPIs — built for your leadership team, not for consultants.",
                icon: <><path d="M9 17H5a2 2 0 00-2 2" /><path d="M15 17h4a2 2 0 012 2" /><line x1="12" y1="17" x2="12" y2="22" /><path d="M12 17V3" /><polyline points="5 10 12 3 19 10" /></>,
              },
              {
                title: 'Detailed Requirement Packs',
                desc: 'Execution-ready specs: scope, roles, systems, success criteria, dependencies. Your team can build from here.',
                icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>,
              },
              {
                title: 'Governance',
                desc: 'Review rhythm and accountability structure — so nothing slides back into the drawer after the engagement ends.',
                icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
              },
            ].map((item, i) => (
              <div key={item.title} className={`fade-up ${i === 1 ? 'fade-up-d1' : i === 2 ? 'fade-up-d2' : i === 3 ? 'fade-up-d3' : ''}`}>
                <div className="card-hover">
                  <div className="relative rounded-3xl bg-slate-50 p-8 border border-slate-100 h-full">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center mb-6">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">{item.icon}</svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 font-medium italic fade-up">Most clients can execute from here. Some want us to stay.</p>
        </div>
      </section>

      {/* CONTINUED SUPPORT */}
      <Divider />
      <section className="py-24 md:py-36 bg-[#f8f8fa] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Need Us to Stay? The Full Programme.</h2>
            <p className="text-xl text-slate-500">Month 1 gives you everything you need to execute independently. For companies that want ongoing support, we offer continued engagement — monthly billing, stop anytime.</p>
          </div>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="fade-up">
              <div className="card-hover">
                <div className="relative bg-white rounded-3xl border border-slate-100 p-8 h-full">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">Months 2–4</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Design &amp; Build</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Identify the resources you need to execute</li>
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Execute the agreed plan</li>
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Deliver priority projects</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="fade-up fade-up-d1">
              <div className="card-hover">
                <div className="relative bg-white rounded-3xl border border-slate-100 p-8 h-full">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-wider mb-6">Months 5–6</span>
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Refine &amp; Handover</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Track what&apos;s working</li>
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Identify any issues early</li>
                    <li className="flex items-start gap-3 text-slate-500"><span className="text-emerald-500 font-bold mt-0.5 shrink-0">✓</span> Hand over to your team</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-3xl mx-auto mt-8 fade-up">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-slate-500 text-sm mb-2"><strong className="text-slate-700">Pricing:</strong> Quoted per engagement based on scope. No lock-in. Stop anytime.</p>
              <p className="text-slate-400 text-sm italic">Nothing changes about the commercial terms. Monthly. Transparent. Aligned with your outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT MAKES THIS DIFFERENT */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-20 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">What Makes This Different</h2>
            <p className="text-xl text-slate-500">Six principles baked into every phase.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Evidence Over Opinion', desc: 'We interrogate your actual data — CRM, financials, market signals — not filtered narratives from workshops.' },
              { title: 'Human-in-the-Loop', desc: 'AI finds the patterns. Your team validates what matters. We guide the process from insight to action.' },
              { title: 'Revenue Engine Focus', desc: 'We connect marketing, sales, and customer success — not just optimise one function in isolation.' },
              { title: 'Execution-Ready Outputs', desc: 'Requirements packs your team can actually implement — scope, roles, systems, success criteria, dependencies.' },
              { title: 'Readiness Assessment', desc: 'We assess whether your people, data, and processes can absorb change — not just what tools you need.' },
              { title: 'Governed Delivery', desc: 'Lock requirements. Track through clear phases. Measure ROI. No scope creep.' },
            ].map((item, i) => (
              <div key={item.title} className={`fade-up ${i % 3 === 1 ? 'fade-up-d1' : i % 3 === 2 ? 'fade-up-d2' : ''}`}>
                <div className="card-hover">
                  <div className="relative rounded-3xl bg-slate-50 p-8 border border-slate-100 h-full">
                    <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTASection
        title="Ready to See Where You Stand?"
        description="Start with a free web scan. No commitment, no data access required. Your readiness score in minutes."
        primaryLabel="Get My Free Web Scan →"
        primaryHref="/signup"
      />

      <Footer activePage="how-it-works" />
    </div>
  )
}
