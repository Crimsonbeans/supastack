'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import CTASection from '@/components/landing/CTASection'
import PageHero from '@/components/landing/PageHero'
import { useFadeUp, useHeroFadeUp } from '@/components/landing/FadeUp'

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent" />

function FAQItem({ question, answer, delay }: { question: string; answer: string; delay?: string }) {
  const toggleFaq = (btn: HTMLButtonElement) => {
    const answerEl = btn.nextElementSibling as HTMLElement
    const icon = btn.querySelector('.faq-icon') as HTMLElement
    const isOpen = answerEl.classList.contains('open')
    document.querySelectorAll('.faq-answer').forEach((a) => a.classList.remove('open'))
    document.querySelectorAll('.faq-icon').forEach((i) => ((i as HTMLElement).style.transform = ''))
    if (!isOpen) {
      answerEl.classList.add('open')
      icon.style.transform = 'rotate(180deg)'
    }
  }

  return (
    <div className={`fade-up ${delay || ''} border border-slate-200 rounded-2xl overflow-hidden`}>
      <button
        className="w-full text-left px-6 py-5 flex items-center justify-between font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={(e) => toggleFaq(e.currentTarget)}
      >
        {question}
        <svg className="faq-icon w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ml-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" /></svg>
      </button>
      <div className="faq-answer px-6"><p className="text-slate-500 pb-5">{answer}</p></div>
    </div>
  )
}

export default function PricingPage() {
  const fadeRef = useFadeUp()
  useHeroFadeUp()

  return (
    <div ref={fadeRef} className="bg-white text-slate-900 selection:bg-blue-500/30">
      <Navigation activePage="pricing" />

      <PageHero badge="Pricing">
        <div className="fade-up fade-up-d1">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Transparent Pricing.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-600 shimmer-text">No Surprises.</span>
          </h1>
        </div>
        <div className="fade-up fade-up-d2">
          <p className="text-xl text-slate-500 leading-relaxed">Every engagement starts with a free web scan. Go deeper when you&apos;re ready.</p>
        </div>
      </PageHero>

      {/* PRICING TIERS */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">

            {/* Tier 1: Web Scan (Free) */}
            <div className="fade-up flex flex-col">
              <div className="card-hover h-full">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-300" />
                  <div className="mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Web Scan</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-bold text-slate-900">Free</span>
                    </div>
                    <p className="text-slate-400 text-sm">48 hours · No data access required</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {[
                      'AI-powered readiness score (1–100)',
                      'Dimension breakdown across all assessed areas',
                      'Competitive benchmarking vs. 5 peers',
                      'Top 3 quick wins with estimated impact',
                      'Executive summary PDF',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600">
                        <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-400 mb-4 italic">Best for: Leadership teams who want an evidence-based starting point before committing budget.</p>
                    <Link href="/signup" className="block text-center h-12 leading-[3rem] rounded-xl border-2 border-blue-300 text-blue-700 font-semibold hover:bg-blue-50 transition-colors duration-300">Get Your Free Scan →</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier 2: Month 1 (Featured) */}
            <div className="fade-up fade-up-d1 flex flex-col">
              <div className="bg-[#0c0c1a] border border-blue-700/20 rounded-3xl p-8 md:p-10 flex flex-col h-full relative overflow-hidden text-white" style={{ boxShadow: '0 0 60px -12px rgba(29,78,216,0.2)' }}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500" />
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-[0.15em]">Month 1: Full Diagnostic &amp; Plan</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">Most Popular</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-bold text-white">£20K</span>
                    <span className="text-slate-400 text-lg mb-2">activation</span>
                  </div>
                  <p className="text-slate-400 text-sm">~6 weeks · 4-phase system · AI + dedicated expert GTM consultant</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  <li className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Everything in Web Scan, plus:</li>
                  {[
                    'Dedicated GTM consultant alongside AI analysis',
                    'Internal data analysis (CRM, financials, process docs)',
                    'Strategic Blueprint delivered & validated with stakeholders',
                    '140-criteria assessment across chosen playbook',
                    'Prioritised initiatives with clear ownership',
                    'Detailed Requirements Packs for execution',
                    'Board-ready strategic and execution roadmaps',
                    'Governance framework (review rhythm + accountability)',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-300">
                      <span className="text-emerald-400 font-bold shrink-0 mt-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <p className="text-xs text-slate-400 mb-4 italic">Best for: Companies ready to move from &ldquo;we should do something with AI&rdquo; to &ldquo;here&apos;s exactly what to do first.&rdquo;</p>
                  <Link href="/signup" className="block text-center h-12 leading-[3rem] rounded-xl bg-gradient-to-r from-blue-800 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-700/30 transition-all duration-300">Book a Call →</Link>
                </div>
              </div>
            </div>

            {/* Tier 3: Continued Support */}
            <div className="fade-up fade-up-d2 flex flex-col">
              <div className="card-hover h-full">
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 flex flex-col h-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-600 to-sky-400" />
                  <div className="mb-8">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Months 2–6: Continued Support</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-3xl font-bold text-slate-900">Quoted</span>
                    </div>
                    <p className="text-slate-400 text-sm">Per engagement · No lock-in · Stop anytime</p>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Everything in Month 1, plus:</li>
                    {[
                      'Resource identification and matching',
                      'Execution of the agreed plan',
                      'Priority project delivery support',
                      'Progress tracking and issue resolution',
                      'Handover to your team when ready',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600">
                        <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>{item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    <p className="text-xs text-slate-400 mb-4 italic">Best for: Companies who want us to stay through execution — not just planning. Most clients decide at the end of Month 1.</p>
                    <Link href="/signup" className="block text-center h-12 leading-[3rem] rounded-xl border-2 border-sky-300 text-sky-600 font-semibold hover:bg-sky-50 transition-colors duration-300">Let&apos;s Talk Scope →</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Walk-away statement */}
          <div className="max-w-3xl mx-auto mt-12 fade-up">
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-2xl p-8 text-center">
              <p className="text-slate-700 font-medium text-lg mb-2">What you walk away with after Month 1:</p>
              <p className="text-slate-500">Maturity scores, execution roadmaps, requirement packs, and governance — everything your team needs to execute independently. Built by AI, validated by an expert who understands your business.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">FAQs</h2>
          </div>
          <div className="space-y-4">
            <FAQItem
              question="What's included in the £20K?"
              answer="The full 4-phase Month 1 programme: data analysis, strategic blueprint, stakeholder validation, prioritised initiatives, requirements packs, and governance framework. No hidden extras."
            />
            <FAQItem
              question="Can we start with just the web scan?"
              answer="Absolutely. Most clients do. It's free, takes 48 hours, and requires no access to your systems."
              delay="fade-up-d1"
            />
            <FAQItem
              question="What happens after Month 1?"
              answer="You'll have everything you need to execute independently. If you want us to stay for design, build, and handover (Months 2–6), we'll quote based on scope. No lock-in — stop anytime."
              delay="fade-up-d2"
            />
            <FAQItem
              question="Is there a minimum commitment?"
              answer="No. The £20K activation covers Month 1 as a standalone engagement. You get complete deliverables at the end of it. Continued support is entirely optional and quoted separately."
            />
            <FAQItem
              question="What if we only want the diagnostic and not execution support?"
              answer="That's the default outcome. Month 1 produces execution-ready deliverables. Most clients either run with those or decide at that point whether to continue."
              delay="fade-up-d1"
            />
          </div>
        </div>
      </section>

      <CTASection
        title="Start Free. Go Deep When You're Ready."
        primaryLabel="Get My Free Web Scan →"
        primaryHref="/signup"
        secondaryLabel="Book a Call →"
        secondaryHref="/signup"
      />

      <Footer activePage="pricing" />
    </div>
  )
}
