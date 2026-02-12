
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    CheckCircle2,
    XCircle,
    BarChart3,
    Settings2,
    Layers,
    Target,
    Zap,
    Banknote,
    Menu,
    X
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils'; // Assuming standard utils, but I'll implement inline if needed or stick to standard tailwind classes where possible.

// --- Components ---

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const Section = ({ id, className = "", children }: { id?: string, className?: string, children: React.ReactNode }) => (
    <section id={id} className={`py-20 md:py-32 relative overflow-hidden ${className}`}>
        {children}
    </section>
);

// --- Content Data (100% Text Match) ---

const NAV_LINKS = [
    { href: "#problem", label: "Problem" },
    { href: "#comparison", label: "Vs Consulting" },
    { href: "#services", label: "Service Model" },
    { href: "#dimensions", label: "Dimensions" },
    { href: "#results", label: "Results" },
    { href: "#cta", label: "Get Started" },
];

const PROBLEM_POINTS = [
    {
        number: "01",
        title: "Opinion-Led Discovery",
        desc: "Traditional consultants rely on interviews and workshops. You get filtered narratives, not ground truth about your revenue engine."
    },
    {
        number: "02",
        title: "Disconnected from Revenue Reality",
        desc: "AI and GTM initiatives live in silos, disconnected from how marketing, sales, and CS actually work together."
    },
    {
        number: "03",
        title: "Endless Planning Cycles",
        desc: "8-12 weeks of discovery. £50-150K spent. And still no execution-ready specs for your revenue operations."
    },
    {
        number: "04",
        title: "Technology-First Thinking",
        desc: "Vendors sell CRM add-ons and point solutions. You need an integrated revenue engine. The gap costs you £25-100K/year."
    },
    {
        number: "05",
        title: "Teams Aren't Ready",
        desc: "You have budget for tools but lack confidence in implementation. The gap isn't technology — it's knowing whether your people, data, and processes can absorb change."
    }
];

const COMPARISON_TABLE = [
    { metric: "Time", traditional: "✕ 8–12 weeks of interviews", supa: "✓ Days to first insights" },
    { metric: "Cost", traditional: "✕ £50–150K+ diagnostic fees", supa: "✓ From £20K all-in" },
    { metric: "Approach", traditional: "Interview-led, subjective readouts", supa: "Evidence-led, AI-powered signal modelling" },
    { metric: "Validation", traditional: "AI-only or human-only. Rarely both.", supa: "Human-in-the-loop alignment with operating leaders" },
    { metric: "Output", traditional: "Long lists of ideas and shelfware decks", supa: "Prioritised, feasible initiatives with clear ownership" },
    { metric: "Result", traditional: "Reports on shelves", supa: "Execution-ready requirements, deployed squads" },
];

const DIMENSIONS = [
    {
        id: "dim-people",
        label: "People & Org",
        title: "People & Org Readiness",
        desc: "Structure, roles, incentives, leadership coverage. We assess change capacity, leadership sponsorship, and the incentives to absorb AI-driven workflows.",
        cards: [
            { title: "Organizational Structure", text: "Heatmaps of enablement, capacity, and adoption velocity updated weekly with clear ownership trails." },
            { title: "Role Evolution", text: "AI literacy programs, role evolution plans, and playbook certifications that build team confidence." },
            { title: "Leadership Alignment", text: "Transformation councils with measurable adoption gates and clear escalation pathways." },
        ]
    },
    {
        id: "dim-data",
        label: "Data & Intelligence",
        title: "Data & Revenue Intelligence",
        desc: "Metrics completeness, attribution, forecasting. Integrity of pipeline, customer, and financial signals—and how they inform prioritisation.",
        cards: [
            { title: "Data Quality", text: "Identify buying triggers, product telemetry, and market intent patterns worth automating." },
            { title: "Revenue Signals", text: "Curated revenue data warehouse with quality assurance layers and complete lineage tracking." },
            { title: "Intelligence Cadence", text: "Weekly insight delivery aligning marketing, sales, customer success, and finance to shared truth." },
        ]
    },
    {
        id: "dim-tech",
        label: "Technology & Stack",
        title: "Technology & Stack",
        desc: "CRM, RevOps tooling, automation, AI adoption. Systems architecture, interoperability, and technical debt tolerance for new AI services.",
        cards: [
            { title: "Stack Architecture", text: "Complete architecture mapping with retire, retain, and integrate recommendations tied to ROI." },
            { title: "AI Enablement", text: "Prompt libraries, policy guardrails, and observability metrics built for operators, not engineers." },
            { title: "Automation Framework", text: "Reusable orchestration patterns mapped directly to go-to-market outcomes and revenue impact." },
        ]
    },
    {
        id: "dim-commercial",
        label: "Commercial Strategy",
        title: "Commercial Strategy & GTM",
        desc: "ICP, pricing, routes to market, positioning. Product-market motion, route-to-market coverage, and AI leverage in customer experience.",
        cards: [
            { title: "ICP Definition", text: "Buyer jobs, decision triggers, and proof points captured in AI-assisted playbooks with real validation." },
            { title: "Pricing & Packaging", text: "Pricing and packaging models tested against actual demand signals and unit economics data. " }, // Added space to match source if picky, trimmed usually fine
            { title: "Go-to-Market Motion", text: "Cross-functional launches with embedded telemetry and real-time response loops built in from day one." },
        ]
    },
    {
        id: "dim-ops",
        label: "Operations & Process",
        title: "Operations & Process",
        desc: "Lead management, sales process, customer lifecycle. Workflow maturity, automation coverage, and the rituals that keep teams aligned.",
        cards: [
            { title: "Process Documentation", text: "End-to-end GTM workflows documented with automation candidates identified and prioritized by impact." },
            { title: "RevOps Command Center", text: "Real-time alerts, dashboards, and anomaly detection across every critical conversion stage." },
            { title: "Continuous Improvement", text: "Closed-loop sprint cycles fueled by AI signal monitoring combined with human validation and action." },
        ]
    },
    {
        id: "dim-fin",
        label: "Financial & Economics",
        title: "Financial & Unit Economics",
        desc: "CAC/LTV, margin structure, scalability. Margin sensitivity, capital allocation, and the ROI guardrails that shape every pilot.",
        cards: [
            { title: "Unit Economics", text: "Dynamic models connecting pricing, volume, and cost structure to every GTM decision with scenario planning." },
            { title: "Capital Allocation", text: "Prioritization frameworks for investing into proven, de-risked initiatives with clear payback horizons." },
            { title: "Board Visibility", text: "Live dashboards and executive briefing packs with leading indicators, risk flags, and action triggers." },
        ]
    },
];

// --- Main Page Component ---

export default function LandingV4() {
    const [activeTab, setActiveTab] = useState(DIMENSIONS[0].id);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="bg-slate-50 text-slate-900 font-sans selection:bg-indigo-500/30">

            {/* Header */}
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-3" : "bg-transparent py-5"
                    }`}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <Link href="#top" className="text-2xl font-bold tracking-tighter flex items-center gap-0.5">
                        <span className="text-slate-900">Supa</span>
                        <span className="text-indigo-600">Stack</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:block">
                        <ul className="flex items-center gap-8 text-sm font-medium text-slate-600">
                            {NAV_LINKS.map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="hover:text-indigo-600 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-600"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Nav */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
                        >
                            <ul className="flex flex-col p-4 gap-4">
                                {NAV_LINKS.map(link => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="block text-lg font-medium text-slate-600"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main id="main">
                {/* Hero Section */}
                <Section id="top" className="pt-32 pb-20 md:pt-48 md:pb-32 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
                    <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center">

                        <FadeIn className="space-y-8">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold tracking-wide uppercase">
                                GTM Transformation. Evidence-Led.
                            </span>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.1]">
                                95% of AI Pilots Fail.<br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                    Yours Doesn't Have To.
                                </span>
                            </h1>
                            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
                                SupaStack replaces slow, expensive discovery with AI-powered, evidence-led GTM transformation. Build the revenue engine that connects marketing, sales, and customer success — in weeks, not months.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="#cta" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5">
                                    Get Your Free Web Scan <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                                <Link href="#services" className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all">
                                    See How It Works
                                </Link>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.2} className="relative">
                            {/* Abstract decorative elements */}
                            <div className="absolute -top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-200/20 to-purple-200/20 rounded-full blur-3xl -z-10" />

                            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative group hover:shadow-indigo-100/50 transition-shadow duration-500">
                                <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
                                    <span className="font-medium text-slate-300 uppercase tracking-widest text-sm">Readiness pulse</span>
                                    <strong className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-emerald-400">92</strong>
                                </div>
                                <div className="p-8 space-y-5">
                                    {[
                                        { label: "People & Org", score: 87 },
                                        { label: "Data & Intelligence", score: 91 },
                                        { label: "Technology Stack", score: 84 },
                                        { label: "GTM Strategy", score: 89 },
                                        { label: "Operations", score: 86 },
                                        { label: "Financial Guardrails", score: 93 },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center justify-between group/row">
                                            <span className="text-slate-600 font-medium group-hover/row:text-slate-900 transition-colors">{row.label}</span>
                                            <div className="flex items-center gap-4 flex-1 justify-end">
                                                <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${row.score}%` }}
                                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                    />
                                                </div>
                                                <span className="text-slate-900 font-bold tabular-nums">{row.score}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Scanline effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none translate-y-[-100%] animate-[scan_4s_ease-in-out_infinite]" />
                            </div>
                        </FadeIn>

                    </div>
                </Section>

                {/* Ribbon */}
                <div className="py-12 border-y border-slate-100 bg-white/50 backdrop-blur-sm">
                    <div className="container mx-auto px-4 md:px-6">
                        <p className="text-center text-slate-500 text-sm font-semibold uppercase tracking-wider mb-8">Trusted by revenue leaders at</p>
                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale hover:grayscale-0 transition-grayscale duration-500">
                            {["Fintech Co", "B2B Services", "SaaS Platform", "Professional Services", "Tech Startup"].map((logo) => (
                                <span key={logo} className="text-xl font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-default">{logo}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Statement */}
                <Section id="belief" className="bg-slate-950 text-white text-center">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>

                    <div className="container mx-auto px-4 md:px-6 py-12 relative z-10 max-w-5xl">
                        <FadeIn>
                            <p className="text-indigo-400 font-medium tracking-widest uppercase mb-8">We Believe Transformation Shouldn't Be This Hard</p>
                            <h2 className="text-3xl md:text-5xl font-medium leading-tight md:leading-tight text-slate-200">
                                "The AI revolution promised speed. Instead, most companies got: 8-week discovery cycles. £100K consulting bills. PowerPoints that never became products. We started SupaStack because mid-market companies deserve better than expensive opinion-gathering dressed up as strategy."
                            </h2>
                        </FadeIn>
                    </div>
                </Section>

                {/* Problem */}
                <Section id="problem" className="bg-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <FadeIn className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Why GTM Transformation Fails</h2>
                            <p className="text-xl text-slate-600">It's not the AI. It's the readiness gap — 83% of leaders know AI will transform their business, but only 39% feel confident implementing it.</p>
                        </FadeIn>

                        <div className="grid lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit mb-12 lg:mb-0">
                                <div className="w-16 h-1 bg-indigo-600 mb-8 ml-0"></div>
                                <h3 className="text-3xl font-bold text-slate-900 mb-6">The problem isn't AI. It's the guidance gap between GTM strategy and RevOps execution.</h3>
                            </div>

                            <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
                                {PROBLEM_POINTS.map((item, i) => (
                                    <FadeIn key={i} delay={i * 0.1} className={`bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/40 transition-all group ${i === PROBLEM_POINTS.length - 1 ? 'md:col-span-2' : ''}`}>
                                        <span className="text-4xl font-mono font-light text-slate-200 group-hover:text-indigo-200 transition-colors mb-4 block">{item.number}</span>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                        <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                    </FadeIn>
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Comparison */}
                <Section id="comparison" className="bg-slate-50">
                    <div className="container mx-auto px-4 md:px-6">
                        <FadeIn className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Evidence-Led GTM Transformation</h2>
                            <p className="text-xl text-slate-600">AI finds the patterns. Humans validate the priorities. You get execution-ready plans.</p>
                        </FadeIn>

                        <div className="grid md:grid-cols-2 gap-8 mb-20">
                            {/* Traditional */}
                            <FadeIn className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-slate-300"></div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Traditional Consulting</p>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">8-12 weeks discovery</h3>
                                <p className="text-slate-600 mb-8">Interview-led, subjective. AI-only or human-only. Long lists of ideas. Reports on shelves.</p>

                                <div className="flex gap-8 mb-8 pb-8 border-b border-slate-100">
                                    <div>
                                        <strong className="block text-2xl font-bold text-slate-900">8–12 weeks</strong>
                                        <span className="text-sm text-slate-500 uppercase font-semibold">discovery</span>
                                    </div>
                                    <div>
                                        <strong className="block text-2xl font-bold text-slate-900">£50–150K+</strong>
                                        <span className="text-sm text-slate-500 uppercase font-semibold">investment</span>
                                    </div>
                                </div>

                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <span className="text-red-500 font-bold">✕</span> Interview-led, subjective approach
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <span className="text-red-500 font-bold">✕</span> AI-only or human-only validation
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <span className="text-red-500 font-bold">✕</span> Long lists of ideas without prioritization
                                    </li>
                                </ul>
                            </FadeIn>

                            {/* SupaStack */}
                            <FadeIn delay={0.2} className="bg-slate-900 p-10 rounded-3xl border border-indigo-900/50 shadow-2xl relative overflow-hidden text-white">
                                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">SupaStack Approach</p>
                                <h3 className="text-3xl font-bold text-white mb-4">Days to first insights</h3>
                                <p className="text-slate-300 mb-8">Evidence-led, AI-powered. Human-in-the-Loop validation. Prioritized, feasible initiatives. Execution-ready requirements.</p>

                                <div className="flex gap-8 mb-8 pb-8 border-b border-slate-800">
                                    <div>
                                        <strong className="block text-2xl font-bold text-white">Days</strong>
                                        <span className="text-sm text-slate-400 uppercase font-semibold">to insights</span>
                                    </div>
                                    <div>
                                        <strong className="block text-2xl font-bold text-white">From £20K</strong>
                                        <span className="text-sm text-slate-400 uppercase font-semibold">all-in</span>
                                    </div>
                                </div>

                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <span className="text-green-400 font-bold">✓</span> Evidence-led, AI-powered signal extraction
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <span className="text-green-400 font-bold">✓</span> Human-in-the-Loop validation with stakeholders
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-300">
                                        <span className="text-green-400 font-bold">✓</span> Prioritized, feasible initiatives with clear ROI
                                    </li>
                                </ul>
                            </FadeIn>
                        </div>

                        {/* Matrix Table */}
                        <FadeIn>
                            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                                <div className="p-8 md:p-12 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">The signal is impossible to miss.</h3>
                                    <p className="text-slate-600">Every dimension that matters flips green with SupaStack. You feel the pace difference, the confidence difference, and the readiness difference.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="p-6 border-b border-r border-slate-200 w-1/4">Metric</th>
                                                <th className="p-6 border-b border-r border-slate-200 w-1/3">Traditional Consulting</th>
                                                <th className="p-6 border-b border-slate-200 w-1/3 text-indigo-700 bg-indigo-50/50">SupaStack</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {COMPARISON_TABLE.map((row, i) => (
                                                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-6 font-semibold text-slate-900 border-r border-slate-100 group-hover:border-slate-200 transition-colors">{row.metric}</td>
                                                    <td className="p-6 text-slate-600 border-r border-slate-100 group-hover:border-slate-200 transition-colors">{row.traditional.startsWith('✕') ? <span className="flex gap-2"><span className="text-red-500 font-bold">✕</span><span>{row.traditional.substring(2)}</span></span> : row.traditional}</td>
                                                    <td className="p-6 text-slate-900 font-medium bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">{row.supa.startsWith('✓') ? <span className="flex gap-2"><span className="text-green-600 font-bold">✓</span><span>{row.supa.substring(2)}</span></span> : row.supa}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </Section>

                {/* Services */}
                <Section id="services" className="bg-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <FadeIn className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">From Assessment to Action</h2>
                            <p className="text-xl text-slate-600">AI finds the patterns. Humans validate the priorities. You get execution-ready plans — not shelf-ware.</p>
                        </FadeIn>

                        <div className="grid md:grid-cols-4 gap-6 relative">
                            {/* Connecting Line (Desktop) */}
                            <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent -z-10"></div>

                            {[
                                {
                                    num: "01", title: "Web Scan",
                                    desc: "AI analyzes public signals about your company. See your readiness score and competitive position in minutes.",
                                    del: "Deliverable · Free", out: "Outcome · Readiness score in minutes",
                                    focus: false
                                },
                                {
                                    num: "02", title: "Deep Diagnostic",
                                    desc: "We analyze your internal data — CRM, financials, processes — and validate with key stakeholders.",
                                    del: "Deliverable · £20K", out: "Outcome · Execution-ready insights",
                                    focus: true
                                },
                                {
                                    num: "03", title: "Requirements Packs",
                                    desc: "Receive execution-ready specs: scope, roles, systems, success criteria, dependencies.",
                                    del: "Deliverable · Blueprints", out: "Outcome · Teams briefed & resourced",
                                    focus: false
                                },
                                {
                                    num: "04", title: "Governed Execution",
                                    desc: "We help you find the right resources and govern execution through to ROI achievement.",
                                    del: "Deliverable · Ongoing", out: "Outcome · Time-to-value assured",
                                    focus: false
                                },
                            ].map((step, i) => (
                                <FadeIn key={i} delay={i * 0.1} className={`relative pt-8 ${step.focus ? 'md:-mt-8' : ''}`}>
                                    {/* Circle */}
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mb-6 mx-auto border-4 bg-white z-10 relative ${step.focus ? 'border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-100' : 'border-slate-100 text-slate-300'}`}>
                                        {step.num}
                                    </div>

                                    <div className={`p-6 rounded-2xl border ${step.focus ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-indigo-100'}`}>
                                        <h3 className={`text-xl font-bold mb-4 ${step.focus ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                                        <p className={`mb-6 text-sm leading-relaxed ${step.focus ? 'text-indigo-100' : 'text-slate-600'}`}>{step.desc}</p>
                                        <div className={`pt-4 border-t text-xs space-y-2 ${step.focus ? 'border-indigo-500/50 text-indigo-200' : 'border-slate-200 text-slate-500'}`}>
                                            <div className="font-semibold">{step.del}</div>
                                            <div className="font-semibold">{step.out}</div>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* Dimensions */}
                <Section id="dimensions" className="bg-slate-950 text-white">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

                    <div className="container mx-auto px-4 md:px-6 relative z-10">
                        <FadeIn className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Six Dimensions of Readiness</h2>
                            <p className="text-xl text-slate-400">Every initiative scored on Impact × Feasibility</p>
                        </FadeIn>

                        <div className="grid lg:grid-cols-12 gap-8 items-start">
                            {/* Tabs */}
                            <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollo">
                                {DIMENSIONS.map((dim) => (
                                    <button
                                        key={dim.id}
                                        onClick={() => setActiveTab(dim.id)}
                                        className={`flex items-center text-left px-5 py-4 rounded-xl transition-all whitespace-nowrap lg:whitespace-normal ${activeTab === dim.id
                                                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/50"
                                                : "hover:bg-slate-900 text-slate-500 hover:text-slate-300 border border-transparent"
                                            }`}
                                    >
                                        <span className="font-medium">{dim.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Panel */}
                            <div className="lg:col-span-9">
                                <AnimatePresence mode="wait">
                                    {DIMENSIONS.map((dim) => (
                                        activeTab === dim.id ? (
                                            <motion.div
                                                key={dim.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 md:p-12"
                                            >
                                                <h3 className="text-3xl font-bold text-white mb-4">{dim.title}</h3>
                                                <p className="text-lg text-slate-400 mb-12 max-w-3xl">{dim.desc}</p>

                                                <div className="grid md:grid-cols-3 gap-8">
                                                    {dim.cards.map((card, i) => (
                                                        <div key={i} className="bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                                                            <h4 className="text-indigo-400 font-bold mb-3">{card.title}</h4>
                                                            <p className="text-slate-400 text-sm leading-relaxed">{card.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        ) : null
                                    ))}
                                </AnimatePresence>

                                <footer className="mt-8 text-center md:text-right text-slate-500 text-sm">
                                    <p className="mb-1 font-medium text-slate-400">You get a prioritized portfolio, not a long list of ideas.</p>
                                    <span>140 criteria. 6 dimensions. Built from real GTM transformations.</span>
                                </footer>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Results */}
                <Section id="results" className="bg-white">
                    <div className="container mx-auto px-4 md:px-6">
                        <FadeIn className="text-center max-w-3xl mx-auto mb-20">
                            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Proven Results</h2>
                            <p className="text-xl text-slate-600">Mid-market operators choose SupaStack to compress the time between recognising AI potential and capturing measurable value.</p>
                        </FadeIn>

                        <div className="grid md:grid-cols-3 gap-8 mb-20">
                            <FadeIn className="text-center p-8 bg-indigo-50/50 rounded-3xl border border-indigo-50">
                                <strong className="block text-5xl md:text-6xl font-bold text-indigo-600 mb-4">£2.4M</strong>
                                <p className="text-slate-700 font-medium">Pipeline identified in first 90 days for a £15M B2B services company</p>
                            </FadeIn>
                            <FadeIn delay={0.1} className="text-center p-8 bg-indigo-50/50 rounded-3xl border border-indigo-50">
                                <strong className="block text-5xl md:text-6xl font-bold text-indigo-600 mb-4">67%</strong>
                                <p className="text-slate-700 font-medium">Faster from assessment to execution-ready plan vs. traditional consulting</p>
                            </FadeIn>
                            <FadeIn delay={0.2} className="text-center p-8 bg-indigo-50/50 rounded-3xl border border-indigo-50">
                                <strong className="block text-5xl md:text-6xl font-bold text-indigo-600 mb-4">3 of 3</strong>
                                <p className="text-slate-700 font-medium">Pilots succeeded vs. industry average of 5%</p>
                            </FadeIn>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { text: "\"SupaStack is the first partner that gave us live ROI guardrails. We green-lit pilots knowing exactly where the returns would land.\"", author: "COO · Manufacturing Services · £80M revenue" },
                                { text: "\"They translated our messy CRM into an actionable blueprint in three weeks. Our board signed off unanimously.\"", author: "Chief Revenue Officer · B2B SaaS · £52M revenue" },
                                { text: "\"We tried consulting twice. SupaStack's governed execution finally turned our AI talk into shipped outcomes.\"", author: "VP Operations · Logistics Tech · £36M revenue" }
                            ].map((testi, i) => (
                                <FadeIn key={i} delay={i * 0.1} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 italic">
                                    <p className="text-slate-700 mb-6 text-lg">{testi.text}</p>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider not-italic block">{testi.author}</span>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* CTA */}
                <Section id="cta" className="bg-slate-50">
                    <div className="container mx-auto px-4 md:px-6">
                        <FadeIn className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                            {/* Abstract decorative circles */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

                            <div className="relative z-10 max-w-4xl mx-auto">
                                <h2 className="text-4xl md:text-6xl font-bold mb-8">Start With a Free Web Scan</h2>
                                <p className="text-xl md:text-2xl text-indigo-100 mb-12 leading-relaxed">See your readiness score across 6 dimensions, your competitive gaps vs. 5 peers, and your top 3 quick wins — in minutes, not months.</p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a href="mailto:hello@supastack.com" className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white text-indigo-700 font-bold text-lg hover:bg-indigo-50 transition-colors shadow-lg">
                                        Get My Free Assessment
                                    </a>
                                    <a href="#services" className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-transparent border-2 border-indigo-400 text-white font-bold text-lg hover:bg-indigo-700/50 hover:border-indigo-300 transition-colors">
                                        Review the process
                                    </a>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </Section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-100 py-12">
                <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                    <strong className="text-slate-900 text-base">SupaStack Ltd</strong>
                    <span>Company number 16869878 · Registered in England</span>
                    <span>© <span id="year">{new Date().getFullYear()}</span> SupaStack. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
