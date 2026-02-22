'use client'

import Link from 'next/link'
import Navigation from '@/components/landing/Navigation'
import Footer from '@/components/landing/Footer'
import CTASection from '@/components/landing/CTASection'
import PageHero from '@/components/landing/PageHero'
import { useFadeUp, useHeroFadeUp } from '@/components/landing/FadeUp'

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-blue-700/20 to-transparent" />

export default function AboutPage() {
  const fadeRef = useFadeUp()
  useHeroFadeUp()

  return (
    <div ref={fadeRef} className="bg-white text-slate-900 selection:bg-blue-500/30">
      <Navigation activePage="about" />

      {/* PAGE HERO */}
      <PageHero badge="About SupaStack">
        <div className="fade-up fade-up-d1">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            We Started This Because<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-blue-600 shimmer-text">Mid-Market Companies Deserve Better.</span>
          </h1>
        </div>
        <div className="fade-up fade-up-d2">
          <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">Better than 8-week discovery cycles. Better than £100K consulting bills. Better than PowerPoints that never become products.</p>
        </div>
      </PageHero>

      {/* THE STORY */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 fade-up">
              <div className="w-20 h-1 bg-gradient-to-r from-blue-700 to-blue-600 mb-8 rounded-full" />
              <h2 className="text-3xl font-bold text-slate-900 leading-snug">The story behind the operating system.</h2>
            </div>
            <div className="lg:col-span-8 space-y-8 fade-up fade-up-d1">
              <div className="pb-8 border-b border-slate-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4">The problem we lived</p>
                <p className="text-lg text-slate-600 leading-relaxed">We spent years inside mid-market companies that poured time and money into transformation projects that never landed. The pattern was always the same: painful, drawn-out planning; expensive consultants running interview-led discovery; endless decks full of ideas; and either no implementation or poor execution. The AI wave made it worse — every vendor promised transformation, but MIT research shows 95% of GenAI pilots fail before they even reach production. Not because the technology doesn&apos;t work, but because of organisational friction.</p>
              </div>
              <div className="pb-8 border-b border-slate-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4">What we realised</p>
                <p className="text-lg text-slate-600 leading-relaxed">The problem was never the AI. It was the gap between knowing you need to transform and knowing whether your organisation is actually ready to absorb change. Nobody was diagnosing that gap with evidence. Nobody was connecting readiness to the right resources. And nobody was staying around to make sure it actually worked.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-4">What we built</p>
                <p className="text-lg text-slate-600 leading-relaxed">SupaStack is the operating system for that entire journey — Strategy, Validation, Execution, Delivery. We diagnose readiness with data, not opinion. We provide a Strategic Blueprint built from real operational evidence, validate it with leadership, translate it into execution-ready requirements, and match companies to the right AI vendors and resources based on what the evidence says, not who has the best pitch. Then we coordinate execution through to measurable ROI. One platform. Multiple playbooks. Outcomes that stick.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERSHIP */}
      <Divider />
      <section className="py-24 md:py-36 bg-[#f8f8fa] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Leadership</h2>
            <p className="text-xl text-slate-500">Real people, real experience, real constraints on who we serve.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="fade-up">
              <div className="card-hover">
                <div className="relative bg-white rounded-3xl border border-slate-100 p-8 md:p-10 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center mb-6">
                    <span className="text-2xl font-bold text-white">PD</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Pete de Souza</h3>
                  <p className="text-blue-700 font-semibold text-sm uppercase tracking-wider mb-5">Co-Founder &amp; CEO</p>
                  <p className="text-slate-500 leading-relaxed">10+ years leading commercial strategy and partnerships in SMB fintech — including strategic roles at PayPal and high-growth payments companies. Pete has onboarded thousands of small business users and built partner ecosystems across banking, e-commerce, and SaaS. He leads SupaStack&apos;s commercial strategy, investor relationships, and go-to-market execution.</p>
                </div>
              </div>
            </div>
            <div className="fade-up fade-up-d1">
              <div className="card-hover">
                <div className="relative bg-white rounded-3xl border border-slate-100 p-8 md:p-10 h-full">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-sky-600 flex items-center justify-center mb-6">
                    <span className="text-2xl font-bold text-white">LA</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Laksh Agrawal</h3>
                  <p className="text-sky-600 font-semibold text-sm uppercase tracking-wider mb-5">Co-Founder &amp; COO</p>
                  <p className="text-slate-500 leading-relaxed">Operational leader with experience scaling two-sided marketplace platforms from early traction to thousands of active users. Laksh builds the systems that make SupaStack repeatable — vendor onboarding, quality assurance, customer success, and the metrics infrastructure that keeps the platform honest. He leads operations, delivery, and platform performance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE'RE BUILT FOR */}
      <Divider />
      <section className="py-24 md:py-36 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-16 fade-up">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Who We&apos;re Built For</h2>
            <p className="text-xl text-slate-500">We&apos;re deliberate about who we serve. Here&apos;s how to know if SupaStack is right for you.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="fade-up">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><span className="text-emerald-600 font-bold">✓</span></div>
                  <h3 className="text-xl font-bold text-slate-900">Great Fit</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Mid-market companies (£5–50M revenue)',
                    'B2B services and professional services',
                    'COOs and revenue leaders driving change',
                    'Budget for tools, need implementation clarity',
                    'Ready to share data for evidence-led insight',
                    'Tired of opinion-led consulting',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-600">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="fade-up fade-up-d1">
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-10 h-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300" />
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><span className="text-red-400 font-bold">✕</span></div>
                  <h3 className="text-xl font-bold text-slate-900">Not a Fit</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Early-stage startups (pre-product-market fit)',
                    'Companies seeking tools without outcomes',
                    'Organisations unwilling to share data',
                    'Looking for a "set it and forget it" solution',
                    'Companies unwilling to tackle foundation before scale',
                    'Organisations looking for silver bullets',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-500">
                      <span className="text-red-400 font-bold shrink-0 mt-0.5">✕</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <p className="text-center text-slate-500 mt-10 text-sm max-w-2xl mx-auto fade-up">We&apos;re focused on companies where diagnosis and execution planning can create measurable commercial impact. If that&apos;s not you yet, we&apos;ll say so upfront.</p>
        </div>
      </section>

      {/* COMPANY DETAILS */}
      <Divider />
      <section className="py-16 bg-[#f8f8fa]">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="fade-up bg-white border border-slate-200 rounded-2xl p-8 md:p-10">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Company Details</h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Company</p>
                <p className="text-slate-700 font-semibold">SupaStack Ltd</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registration</p>
                <p className="text-slate-700">16869878 · England and Wales</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email</p>
                <a href="mailto:hello@supastack.ai" className="text-blue-700 hover:text-blue-800 transition-colors">hello@supastack.ai</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTASection
        title="Want to See If We're a Fit?"
        description="Start with a free web scan. You'll know in minutes."
        primaryLabel="Get My Free Web Scan →"
        primaryHref="/signup"
      />

      <Footer activePage="about" />
    </div>
  )
}
