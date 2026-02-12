'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Users, Database, Cpu, Target, Settings, DollarSign,
  Check, X, ChevronRight, Sparkles, Shield, Zap, BarChart3, Building2
} from 'lucide-react'

/* ─── Animated Counter ──────────────────────────────────── */
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (!inView) return
    const duration = 1200
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target])

  return <span ref={ref}>{count}{suffix}</span>
}

/* ─── Section Reveal Wrapper ────────────────────────────── */
function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Stagger Children ──────────────────────────────────── */
function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── Gradient Text ─────────────────────────────────────── */
function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent ${className}`}>
      {children}
    </span>
  )
}

/* ─── Grid Background ───────────────────────────────────── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-violet-600/[0.05] rounded-full blur-[100px]" />
    </div>
  )
}

/* ─── Dimension data ────────────────────────────────────── */
const dimensionData = [
  {
    id: 'people',
    label: 'People & Org',
    icon: Users,
    title: 'People & Org Readiness',
    description: 'Structure, roles, incentives, leadership coverage. We assess change capacity, leadership sponsorship, and the incentives to absorb AI-driven workflows.',
    cards: [
      { title: 'Organizational Structure', text: 'Heatmaps of enablement, capacity, and adoption velocity updated weekly with clear ownership trails.' },
      { title: 'Role Evolution', text: 'AI literacy programs, role evolution plans, and playbook certifications that build team confidence.' },
      { title: 'Leadership Alignment', text: 'Transformation councils with measurable adoption gates and clear escalation pathways.' }
    ]
  },
  {
    id: 'data',
    label: 'Data & Intelligence',
    icon: Database,
    title: 'Data & Revenue Intelligence',
    description: 'Metrics completeness, attribution, forecasting. Integrity of pipeline, customer, and financial signals\u2014and how they inform prioritisation.',
    cards: [
      { title: 'Data Quality', text: 'Identify buying triggers, product telemetry, and market intent patterns worth automating.' },
      { title: 'Revenue Signals', text: 'Curated revenue data warehouse with quality assurance layers and complete lineage tracking.' },
      { title: 'Intelligence Cadence', text: 'Weekly insight delivery aligning marketing, sales, customer success, and finance to shared truth.' }
    ]
  },
  {
    id: 'tech',
    label: 'Technology & Stack',
    icon: Cpu,
    title: 'Technology & Stack',
    description: 'CRM, RevOps tooling, automation, AI adoption. Systems architecture, interoperability, and technical debt tolerance for new AI services.',
    cards: [
      { title: 'Stack Architecture', text: 'Complete architecture mapping with retire, retain, and integrate recommendations tied to ROI.' },
      { title: 'AI Enablement', text: 'Prompt libraries, policy guardrails, and observability metrics built for operators, not engineers.' },
      { title: 'Automation Framework', text: 'Reusable orchestration patterns mapped directly to go-to-market outcomes and revenue impact.' }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial Strategy',
    icon: Target,
    title: 'Commercial Strategy & GTM',
    description: 'ICP, pricing, routes to market, positioning. Product-market motion, route-to-market coverage, and AI leverage in customer experience.',
    cards: [
      { title: 'ICP Definition', text: 'Buyer jobs, decision triggers, and proof points captured in AI-assisted playbooks with real validation.' },
      { title: 'Pricing & Packaging', text: 'Pricing and packaging models tested against actual demand signals and unit economics data.' },
      { title: 'Go-to-Market Motion', text: 'Cross-functional launches with embedded telemetry and real-time response loops built in from day one.' }
    ]
  },
  {
    id: 'ops',
    label: 'Operations & Process',
    icon: Settings,
    title: 'Operations & Process',
    description: 'Lead management, sales process, customer lifecycle. Workflow maturity, automation coverage, and the rituals that keep teams aligned.',
    cards: [
      { title: 'Process Documentation', text: 'End-to-end GTM workflows documented with automation candidates identified and prioritized by impact.' },
      { title: 'RevOps Command Center', text: 'Real-time alerts, dashboards, and anomaly detection across every critical conversion stage.' },
      { title: 'Continuous Improvement', text: 'Closed-loop sprint cycles fueled by AI signal monitoring combined with human validation and action.' }
    ]
  },
  {
    id: 'finance',
    label: 'Financial & Economics',
    icon: DollarSign,
    title: 'Financial & Unit Economics',
    description: 'CAC/LTV, margin structure, scalability. Margin sensitivity, capital allocation, and the ROI guardrails that shape every pilot.',
    cards: [
      { title: 'Unit Economics', text: 'Dynamic models connecting pricing, volume, and cost structure to every GTM decision with scenario planning.' },
      { title: 'Capital Allocation', text: 'Prioritization frameworks for investing into proven, de-risked initiatives with clear payback horizons.' },
      { title: 'Board Visibility', text: 'Live dashboards and executive briefing packs with leading indicators, risk flags, and action triggers.' }
    ]
  }
]

const readinessScores = [
  { label: 'People & Org', score: 87, color: 'from-violet-500 to-purple-600' },
  { label: 'Data & Intelligence', score: 91, color: 'from-blue-500 to-cyan-500' },
  { label: 'Technology Stack', score: 84, color: 'from-indigo-500 to-blue-600' },
  { label: 'GTM Strategy', score: 89, color: 'from-emerald-500 to-teal-500' },
  { label: 'Operations', score: 86, color: 'from-amber-500 to-orange-500' },
  { label: 'Financial Guardrails', score: 93, color: 'from-rose-500 to-pink-500' }
]

const problems = [
  { num: '01', title: 'Opinion-Led Discovery', text: 'Traditional consultants rely on interviews and workshops. You get filtered narratives, not ground truth about your revenue engine.' },
  { num: '02', title: 'Disconnected from Revenue Reality', text: 'AI and GTM initiatives live in silos, disconnected from how marketing, sales, and CS actually work together.' },
  { num: '03', title: 'Endless Planning Cycles', text: '8-12 weeks of discovery. \u00a350-150K spent. And still no execution-ready specs for your revenue operations.' },
  { num: '04', title: 'Technology-First Thinking', text: 'Vendors sell CRM add-ons and point solutions. You need an integrated revenue engine. The gap costs you \u00a325-100K/year.' },
  { num: '05', title: 'Teams Aren\u2019t Ready', text: 'You have budget for tools but lack confidence in implementation. The gap isn\u2019t technology \u2014 it\u2019s knowing whether your people, data, and processes can absorb change.' }
]

const comparisonRows = [
  { metric: 'Time', legacy: '8\u201312 weeks of interviews', supa: 'Days to first insights' },
  { metric: 'Cost', legacy: '\u00a350\u2013150K+ diagnostic fees', supa: 'From \u00a320K all-in' },
  { metric: 'Approach', legacy: 'Interview-led, subjective readouts', supa: 'Evidence-led, AI-powered signal modelling' },
  { metric: 'Validation', legacy: 'AI-only or human-only. Rarely both.', supa: 'Human-in-the-loop alignment with operating leaders' },
  { metric: 'Output', legacy: 'Long lists of ideas and shelfware decks', supa: 'Prioritised, feasible initiatives with clear ownership' },
  { metric: 'Result', legacy: 'Reports on shelves', supa: 'Execution-ready requirements, deployed squads' }
]

const steps = [
  { num: '01', title: 'Web Scan', desc: 'AI analyzes public signals about your company. See your readiness score and competitive position in minutes.', deliverable: 'Free', outcome: 'Readiness score in minutes', accent: false },
  { num: '02', title: 'Deep Diagnostic', desc: 'We analyze your internal data \u2014 CRM, financials, processes \u2014 and validate with key stakeholders.', deliverable: '\u00a320K', outcome: 'Execution-ready insights', accent: true },
  { num: '03', title: 'Requirements Packs', desc: 'Receive execution-ready specs: scope, roles, systems, success criteria, dependencies.', deliverable: 'Blueprints', outcome: 'Teams briefed & resourced', accent: false },
  { num: '04', title: 'Governed Execution', desc: 'We help you find the right resources and govern execution through to ROI achievement.', deliverable: 'Ongoing', outcome: 'Time-to-value assured', accent: false }
]

const testimonials = [
  { quote: '\u201cSupaStack is the first partner that gave us live ROI guardrails. We green-lit pilots knowing exactly where the returns would land.\u201d', author: 'COO \u00b7 Manufacturing Services \u00b7 \u00a380M revenue' },
  { quote: '\u201cThey translated our messy CRM into an actionable blueprint in three weeks. Our board signed off unanimously.\u201d', author: 'Chief Revenue Officer \u00b7 B2B SaaS \u00b7 \u00a352M revenue' },
  { quote: '\u201cWe tried consulting twice. SupaStack\u2019s governed execution finally turned our AI talk into shipped outcomes.\u201d', author: 'VP Operations \u00b7 Logistics Tech \u00b7 \u00a336M revenue' }
]

const navItems = [
  { label: 'Problem', href: '#problem' },
  { label: 'Vs Consulting', href: '#comparison' },
  { label: 'Service Model', href: '#services' },
  { label: 'Dimensions', href: '#dimensions' },
  { label: 'Results', href: '#results' },
  { label: 'Get Started', href: '#cta' }
]

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function LandingPageV2() {
  const [activeDimension, setActiveDimension] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-300 selection:bg-indigo-500/30 overflow-x-hidden">
      {/* ─── HEADER ─────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#08090d]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-2xl shadow-black/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#top" onClick={(e) => scrollToSection(e, '#top')} className="flex items-center gap-0.5 group">
            <span className="text-xl font-extrabold tracking-tight text-white">Supa</span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Stack</span>
          </a>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${item.label === 'Get Started' ? 'bg-indigo-600 hover:bg-indigo-500 text-white ml-2 shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* ─── HERO SECTION ─────────────────────────────── */}
        <section id="top" ref={heroRef} className="relative min-h-screen flex items-center pt-16">
          <GridBackground />
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

          <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="w-full">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left copy */}
              <div className="lg:col-span-7 space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20"
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold tracking-wider uppercase text-indigo-300">GTM Transformation. Evidence-Led.</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]"
                >
                  <span className="text-white">95% of AI Pilots Fail.</span>
                  <br />
                  <GradientText className="mt-2 inline-block">Yours Doesn&apos;t Have To.</GradientText>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="text-lg sm:text-xl text-slate-400 max-w-[58ch] leading-relaxed"
                >
                  SupaStack replaces slow, expensive discovery with AI-powered, evidence-led GTM transformation. Build the revenue engine that connects marketing, sales, and customer success — in weeks, not months.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  className="flex flex-wrap gap-4"
                >
                  <a href="#cta" onClick={(e) => scrollToSection(e, '#cta')} className="group inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                    Get Your Free Web Scan
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                  <a href="#services" onClick={(e) => scrollToSection(e, '#services')} className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-semibold rounded-xl transition-all duration-300">
                    See How It Works
                  </a>
                </motion.div>
              </div>

              {/* Right - Readiness Pulse Widget */}
              <motion.aside
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="lg:col-span-5"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-cyan-500/20 rounded-2xl blur-xl" />
                  <div className="relative bg-[#0f1117]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Readiness Pulse</span>
                      </div>
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <span className="text-xl font-bold text-white"><AnimatedCounter target={92} /></span>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {readinessScores.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors group">
                          <span className="text-sm text-slate-400 flex-1 group-hover:text-slate-300 transition-colors">{item.label}</span>
                          <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${item.score}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-8 text-right"><AnimatedCounter target={item.score} /></span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="w-6 h-10 rounded-full border-2 border-white/10 flex items-start justify-center p-1.5">
              <div className="w-1 h-2.5 rounded-full bg-indigo-400" />
            </motion.div>
          </motion.div>
        </section>

        {/* ─── TRUST RIBBON ─────────────────────────────── */}
        <section className="relative border-y border-white/[0.04] bg-[#0a0b10]/80">
          <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center gap-8">
            <Reveal>
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-slate-600 whitespace-nowrap">Trusted by revenue leaders at</p>
            </Reveal>
            <Reveal delay={0.1} className="flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-10 gap-y-4">
                {['Fintech Co', 'B2B Services', 'SaaS Platform', 'Professional Services', 'Tech Startup'].map((name, i) => (
                  <motion.span
                    key={name}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="text-sm font-semibold tracking-wider uppercase text-slate-600/60 hover:text-slate-400 transition-colors cursor-default"
                  >
                    {name}
                  </motion.span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── BELIEF STATEMENT ──────────────────────────── */}
        <section id="belief" className="relative py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-8">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400">We Believe Transformation Shouldn&apos;t Be This Hard</span>
              </div>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="relative">
                <div className="absolute -top-4 -left-2 text-8xl font-serif text-indigo-500/10 select-none">&ldquo;</div>
                <p className="relative text-xl sm:text-2xl lg:text-3xl font-medium leading-relaxed text-slate-200 max-w-5xl">
                  The AI revolution promised speed. Instead, most companies got: 8-week discovery cycles. £100K consulting bills. PowerPoints that never became products. We started SupaStack because mid-market companies deserve better than expensive opinion-gathering dressed up as strategy.
                </p>
                <div className="absolute -bottom-4 right-0 text-8xl font-serif text-indigo-500/10 select-none">&rdquo;</div>
              </blockquote>
            </Reveal>
          </div>
        </section>

        {/* ─── PROBLEM SECTION ──────────────────────────── */}
        <section id="problem" className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-600/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Why GTM Transformation <GradientText>Fails</GradientText>
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-5">
                <p className="text-lg text-slate-400 leading-relaxed">
                  It&apos;s not the AI. It&apos;s the readiness gap — 83% of leaders know AI will transform their business, but only 39% feel confident implementing it.
                </p>
              </Reveal>
            </div>

            {/* Problem cards */}
            <div className="grid lg:grid-cols-12 gap-8">
              <Reveal className="lg:col-span-4">
                <div className="sticky top-24">
                  <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mb-6" />
                  <p className="text-xl font-semibold text-white leading-snug">
                    The problem isn&apos;t AI. It&apos;s the guidance gap between GTM strategy and RevOps execution.
                  </p>
                </div>
              </Reveal>

              <StaggerContainer className="lg:col-span-8 space-y-4">
                {problems.map((p) => (
                  <StaggerItem key={p.num}>
                    <div className="group relative flex gap-5 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300">
                      <div className="shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-indigo-400">{p.num}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-300 transition-colors">{p.title}</h3>
                        <p className="mt-2 text-slate-400 leading-relaxed">{p.text}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </section>

        {/* ─── COMPARISON SECTION ───────────────────────── */}
        <section id="comparison" className="relative py-24 sm:py-32 border-y border-white/[0.04] bg-[#0a0b10]/60">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Evidence-Led GTM <GradientText>Transformation</GradientText>
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-5">
                <p className="text-lg text-slate-400 leading-relaxed">
                  AI finds the patterns. Humans validate the priorities. You get execution-ready plans.
                </p>
              </Reveal>
            </div>

            {/* Comparison cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Reveal>
                <div className="h-full relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="inline-flex px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs font-semibold tracking-wide uppercase text-slate-500 mb-5">
                    Traditional Consulting
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">8-12 weeks discovery</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">Interview-led, subjective. AI-only or human-only. Long lists of ideas. Reports on shelves.</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-xl font-bold text-white">8–12 weeks</p>
                      <p className="text-sm text-slate-500 mt-1">discovery</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <p className="text-xl font-bold text-white">£50–150K+</p>
                      <p className="text-sm text-slate-500 mt-1">investment</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {['Interview-led, subjective approach', 'AI-only or human-only validation', 'Long lists of ideas without prioritization'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="shrink-0 w-5 h-5 rounded-md border border-red-500/30 bg-red-500/10 flex items-center justify-center mt-0.5">
                          <X className="w-3 h-3 text-red-400" />
                        </div>
                        <span className="text-slate-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="h-full relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-500/[0.06] to-violet-500/[0.03] border border-indigo-500/20 shadow-xl shadow-indigo-500/[0.05]">
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                  <div className="inline-flex px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold tracking-wide uppercase text-indigo-400 mb-5">
                    SupaStack Approach
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Days to first insights</h3>
                  <p className="text-slate-400 leading-relaxed mb-6">Evidence-led, AI-powered. Human-in-the-Loop validation. Prioritized, feasible initiatives. Execution-ready requirements.</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-indigo-500/10">
                      <p className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Days</p>
                      <p className="text-sm text-slate-500 mt-1">to insights</p>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.04] border border-indigo-500/10">
                      <p className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">From £20K</p>
                      <p className="text-sm text-slate-500 mt-1">all-in</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {['Evidence-led, AI-powered signal extraction', 'Human-in-the-Loop validation with stakeholders', 'Prioritized, feasible initiatives with clear ROI'].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <div className="shrink-0 w-5 h-5 rounded-md border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <span className="text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>

            {/* Comparison matrix */}
            <Reveal>
              <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-white/[0.06]">
                  <h3 className="text-xl sm:text-2xl font-bold text-white">The signal is impossible to miss.</h3>
                  <p className="mt-2 text-slate-400 leading-relaxed">Every dimension that matters flips green with SupaStack. You feel the pace difference, the confidence difference, and the readiness difference.</p>
                </div>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="text-left p-4 text-xs font-semibold tracking-wider uppercase text-slate-500 w-[14%]">Metric</th>
                        <th className="text-left p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">Traditional Consulting</th>
                        <th className="text-left p-4 text-xs font-semibold tracking-wider uppercase text-slate-500">SupaStack</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.metric} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="p-4 font-semibold text-white">{row.metric}</td>
                          <td className="p-4 text-slate-500">
                            <span className="inline-flex items-center gap-2"><X className="w-3.5 h-3.5 text-red-400/60 shrink-0" />{row.legacy}</span>
                          </td>
                          <td className="p-4 text-slate-300">
                            <span className="inline-flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{row.supa}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile cards */}
                <div className="md:hidden p-4 space-y-4">
                  {comparisonRows.map((row) => (
                    <div key={row.metric} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <p className="font-semibold text-white text-sm mb-3">{row.metric}</p>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-500 flex items-start gap-2"><X className="w-3.5 h-3.5 text-red-400/60 shrink-0 mt-0.5" />{row.legacy}</p>
                        <p className="text-slate-300 flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />{row.supa}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── SERVICE MODEL ─────────────────────────────── */}
        <section id="services" className="relative py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  From Assessment <GradientText>to Action</GradientText>
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-5">
                <p className="text-lg text-slate-400 leading-relaxed">
                  AI finds the patterns. Humans validate the priorities. You get execution-ready plans — not shelf-ware.
                </p>
              </Reveal>
            </div>

            {/* Steps */}
            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step) => (
                <StaggerItem key={step.num}>
                  <div className={`group relative h-full p-6 rounded-2xl transition-all duration-300 ${step.accent ? 'bg-gradient-to-br from-indigo-500/[0.08] to-violet-500/[0.04] border border-indigo-500/20 hover:border-indigo-400/40' : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12]'} hover:bg-white/[0.04]`}>
                    <div className={`absolute top-0 left-6 right-6 h-px ${step.accent ? 'bg-gradient-to-r from-transparent via-indigo-500 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'}`} />
                    <div className={`inline-flex items-center justify-center w-9 h-7 rounded-lg text-sm font-bold mb-4 ${step.accent ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'}`}>
                      {step.num}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-slate-400 leading-relaxed mb-5">{step.desc}</p>
                    <div className="space-y-2 mt-auto">
                      <div className="inline-flex px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500">
                        Deliverable · {step.deliverable}
                      </div>
                      <div className="inline-flex px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500">
                        Outcome · {step.outcome}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ─── DIMENSIONS SECTION ───────────────────────── */}
        <section id="dimensions" className="relative py-24 sm:py-32 border-y border-white/[0.04] bg-[#0a0b10]/60">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Six Dimensions of <GradientText>Readiness</GradientText>
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-5">
                <p className="text-lg text-slate-400 leading-relaxed">
                  Every initiative scored on Impact × Feasibility
                </p>
              </Reveal>
            </div>

            {/* Tab panel */}
            <Reveal>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden shadow-2xl shadow-black/20">
                <div className="grid lg:grid-cols-[280px_1fr]">
                  {/* Tab list */}
                  <div className="lg:border-r border-b lg:border-b-0 border-white/[0.06] overflow-x-auto lg:overflow-visible">
                    <div className="flex lg:flex-col min-w-max lg:min-w-0">
                      {dimensionData.map((dim, i) => {
                        const Icon = dim.icon
                        return (
                          <button
                            key={dim.id}
                            onClick={() => setActiveDimension(i)}
                            className={`flex items-center gap-3 px-5 py-4 text-left text-sm font-semibold transition-all duration-200 whitespace-nowrap lg:whitespace-normal border-b lg:border-b border-white/[0.04] last:border-b-0 ${activeDimension === i ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-2 lg:border-l-2 border-l-indigo-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            {dim.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Panel content */}
                  <div className="p-6 sm:p-8 min-h-[400px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDimension}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-2xl font-bold text-white">{dimensionData[activeDimension].title}</h3>
                        <p className="mt-3 text-slate-400 leading-relaxed max-w-3xl">{dimensionData[activeDimension].description}</p>
                        <div className="grid sm:grid-cols-3 gap-4 mt-8">
                          {dimensionData[activeDimension].cards.map((card, ci) => (
                            <motion.div
                              key={card.title}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: ci * 0.1, duration: 0.4 }}
                              className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all duration-300 group"
                            >
                              <div className="h-px w-8 bg-gradient-to-r from-indigo-500 to-violet-500 mb-4 group-hover:w-12 transition-all duration-300" />
                              <h4 className="font-semibold text-white mb-2">{card.title}</h4>
                              <p className="text-sm text-slate-400 leading-relaxed">{card.text}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Footer */}
            <Reveal className="mt-12 text-center">
              <p className="text-xl font-semibold text-white">You get a prioritized portfolio, not a long list of ideas.</p>
              <p className="mt-3 text-xs font-semibold tracking-[0.15em] uppercase text-indigo-400">140 criteria. 6 dimensions. Built from real GTM transformations.</p>
            </Reveal>
          </div>
        </section>

        {/* ─── RESULTS SECTION ──────────────────────────── */}
        <section id="results" className="relative py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-600/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="grid lg:grid-cols-12 gap-8 mb-16">
              <Reveal className="lg:col-span-7">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                  Proven <GradientText>Results</GradientText>
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="lg:col-span-5">
                <p className="text-lg text-slate-400 leading-relaxed">
                  Mid-market operators choose SupaStack to compress the time between recognising AI potential and capturing measurable value.
                </p>
              </Reveal>
            </div>

            {/* KPIs */}
            <StaggerContainer className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { value: '£2.4M', desc: 'Pipeline identified in first 90 days for a £15M B2B services company' },
                { value: '67%', desc: 'Faster from assessment to execution-ready plan vs. traditional consulting' },
                { value: '3 of 3', desc: 'Pilots succeeded vs. industry average of 5%' }
              ].map((kpi) => (
                <StaggerItem key={kpi.value}>
                  <div className="relative p-6 sm:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 transition-all duration-300 group">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">{kpi.value}</p>
                    <p className="mt-4 text-slate-400 leading-relaxed">{kpi.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Testimonials */}
            <StaggerContainer className="grid sm:grid-cols-3 gap-4">
              {testimonials.map((t) => (
                <StaggerItem key={t.author}>
                  <div className="h-full relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300 flex flex-col">
                    <div className="text-3xl text-indigo-500/20 mb-2">&ldquo;</div>
                    <p className="text-slate-300 leading-relaxed flex-1">{t.quote}</p>
                    <p className="mt-6 text-sm font-medium text-slate-500">{t.author}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ─── CTA SECTION ──────────────────────────────── */}
        <section id="cta" className="relative py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <Reveal>
              <div className="relative max-w-3xl mx-auto text-center">
                {/* Glow */}
                <div className="absolute -inset-8 bg-gradient-to-r from-indigo-600/10 via-violet-600/10 to-cyan-600/10 rounded-3xl blur-3xl" />
                <div className="relative p-8 sm:p-12 rounded-3xl bg-[#0f1117]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                    Start With a <GradientText>Free Web Scan</GradientText>
                  </h2>
                  <p className="mt-5 text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                    See your readiness score across 6 dimensions, your competitive gaps vs. 5 peers, and your top 3 quick wins — in minutes, not months.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <a href="mailto:hello@supastack.com" className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-xl shadow-indigo-600/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:-translate-y-0.5 text-lg">
                      Get My Free Assessment
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </a>
                    <a href="#services" onClick={(e) => scrollToSection(e, '#services')} className="inline-flex items-center gap-2 px-8 py-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-white font-semibold rounded-xl transition-all duration-300">
                      Review the process
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] bg-[#0a0b10]/80">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center space-y-2">
          <p className="font-bold text-white text-lg">SupaStack Ltd</p>
          <p className="text-sm text-slate-600">Company number 16869878 · Registered in England</p>
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} SupaStack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
