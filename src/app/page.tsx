'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    motion,
    AnimatePresence,
    useScroll,
    useTransform,
    useMotionValue,
    useSpring,
    useInView,
} from 'framer-motion';
import {
    ArrowRight,
    Menu,
    X,
    Quote,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const AnimatedText = ({
    children,
    className = '',
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });
    return (
        <div ref={ref} className={cn('overflow-hidden', className)}>
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
            >
                {children}
            </motion.div>
        </div>
    );
};

const FadeInView = ({
    children,
    delay = 0,
    className = '',
    direction = 'up',
}: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}) => {
    const dirMap = { up: { y: 40, x: 0 }, down: { y: -40, x: 0 }, left: { x: 60, y: 0 }, right: { x: -60, y: 0 } };
    const { x, y } = dirMap[direction];
    return (
        <motion.div
            initial={{ opacity: 0, y, x, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay, ease: EASE_OUT_EXPO }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

const GlowCard = ({
    children,
    className = '',
    glowColor = 'from-indigo-500 via-violet-500 to-fuchsia-500',
}: {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
}) => (
    <motion.div
        className="relative group"
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
        <div className={cn(
            'absolute -inset-[1px] rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[2px]',
            glowColor
        )} />
        <div className={cn('relative rounded-3xl', className)}>
            {children}
        </div>
    </motion.div>
);

const AnimatedCounter = ({
    target,
    prefix = '',
    suffix = '',
    decimals = 0,
    className = '',
}: {
    target: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    className?: string;
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const motionVal = useMotionValue(0);
    const springVal = useSpring(motionVal, { stiffness: 50, damping: 20, restDelta: decimals > 0 ? 0.01 : 0.5 });
    const [display, setDisplay] = useState('0');

    useEffect(() => {
        if (isInView) motionVal.set(target);
    }, [isInView, motionVal, target]);

    useEffect(() => {
        const unsub = springVal.on('change', (v) => {
            setDisplay(decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString());
        });
        return unsub;
    }, [springVal, decimals]);

    return (
        <span ref={ref} className={className}>
            {prefix}{display}{suffix}
        </span>
    );
};

// ============================================================
// CONTENT DATA
// ============================================================

const NAV_LINKS = [
    { href: '#problem', label: 'Problem' },
    { href: '#comparison', label: 'Vs Consulting' },
    { href: '#services', label: 'Service Model' },
    { href: '#dimensions', label: 'Dimensions' },
    { href: '#results', label: 'Results' },
];

const PROBLEM_POINTS = [
    { number: '01', title: 'Opinion-Led Discovery', desc: 'Traditional consultants rely on interviews and workshops. You get filtered narratives, not ground truth about your revenue engine.' },
    { number: '02', title: 'Disconnected from Revenue Reality', desc: 'AI and GTM initiatives live in silos, disconnected from how marketing, sales, and CS actually work together.' },
    { number: '03', title: 'Endless Planning Cycles', desc: '8-12 weeks of discovery. £50-150K spent. And still no execution-ready specs for your revenue operations.' },
    { number: '04', title: 'Technology-First Thinking', desc: 'Vendors sell CRM add-ons and point solutions. You need an integrated revenue engine. The gap costs you £25-100K/year.' },
    { number: '05', title: "Teams Aren't Ready", desc: "You have budget for tools but lack confidence in implementation. The gap isn't technology — it's knowing whether your people, data, and processes can absorb change." },
];

const COMPARISON_TABLE = [
    { metric: 'Time', traditional: '8–12 weeks of interviews', supa: 'Days to first insights' },
    { metric: 'Cost', traditional: '£50–150K+ diagnostic fees', supa: 'From £20K all-in' },
    { metric: 'Approach', traditional: 'Interview-led, subjective readouts', supa: 'Evidence-led, AI-powered signal modelling' },
    { metric: 'Validation', traditional: 'AI-only or human-only. Rarely both.', supa: 'Human-in-the-loop alignment with operating leaders' },
    { metric: 'Output', traditional: 'Long lists of ideas and shelfware decks', supa: 'Prioritised, feasible initiatives with clear ownership' },
    { metric: 'Result', traditional: 'Reports on shelves', supa: 'Execution-ready requirements, deployed squads' },
];

const DIMENSIONS = [
    {
        id: 'dim-people', label: 'People & Org', title: 'People & Org Readiness',
        desc: 'Structure, roles, incentives, leadership coverage. We assess change capacity, leadership sponsorship, and the incentives to absorb AI-driven workflows.',
        cards: [
            { title: 'Organizational Structure', text: 'Heatmaps of enablement, capacity, and adoption velocity updated weekly with clear ownership trails.' },
            { title: 'Role Evolution', text: 'AI literacy programs, role evolution plans, and playbook certifications that build team confidence.' },
            { title: 'Leadership Alignment', text: 'Transformation councils with measurable adoption gates and clear escalation pathways.' },
        ]
    },
    {
        id: 'dim-data', label: 'Data & Intelligence', title: 'Data & Revenue Intelligence',
        desc: 'Metrics completeness, attribution, forecasting. Integrity of pipeline, customer, and financial signals—and how they inform prioritisation.',
        cards: [
            { title: 'Data Quality', text: 'Identify buying triggers, product telemetry, and market intent patterns worth automating.' },
            { title: 'Revenue Signals', text: 'Curated revenue data warehouse with quality assurance layers and complete lineage tracking.' },
            { title: 'Intelligence Cadence', text: 'Weekly insight delivery aligning marketing, sales, customer success, and finance to shared truth.' },
        ]
    },
    {
        id: 'dim-tech', label: 'Technology & Stack', title: 'Technology & Stack',
        desc: 'CRM, RevOps tooling, automation, AI adoption. Systems architecture, interoperability, and technical debt tolerance for new AI services.',
        cards: [
            { title: 'Stack Architecture', text: 'Complete architecture mapping with retire, retain, and integrate recommendations tied to ROI.' },
            { title: 'AI Enablement', text: 'Prompt libraries, policy guardrails, and observability metrics built for operators, not engineers.' },
            { title: 'Automation Framework', text: 'Reusable orchestration patterns mapped directly to go-to-market outcomes and revenue impact.' },
        ]
    },
    {
        id: 'dim-commercial', label: 'Commercial Strategy', title: 'Commercial Strategy & GTM',
        desc: 'ICP, pricing, routes to market, positioning. Product-market motion, route-to-market coverage, and AI leverage in customer experience.',
        cards: [
            { title: 'ICP Definition', text: 'Buyer jobs, decision triggers, and proof points captured in AI-assisted playbooks with real validation.' },
            { title: 'Pricing & Packaging', text: 'Pricing and packaging models tested against actual demand signals and unit economics data.' },
            { title: 'Go-to-Market Motion', text: 'Cross-functional launches with embedded telemetry and real-time response loops built in from day one.' },
        ]
    },
    {
        id: 'dim-ops', label: 'Operations & Process', title: 'Operations & Process',
        desc: 'Lead management, sales process, customer lifecycle. Workflow maturity, automation coverage, and the rituals that keep teams aligned.',
        cards: [
            { title: 'Process Documentation', text: 'End-to-end GTM workflows documented with automation candidates identified and prioritized by impact.' },
            { title: 'RevOps Command Center', text: 'Real-time alerts, dashboards, and anomaly detection across every critical conversion stage.' },
            { title: 'Continuous Improvement', text: 'Closed-loop sprint cycles fueled by AI signal monitoring combined with human validation and action.' },
        ]
    },
    {
        id: 'dim-fin', label: 'Financial & Economics', title: 'Financial & Unit Economics',
        desc: 'CAC/LTV, margin structure, scalability. Margin sensitivity, capital allocation, and the ROI guardrails that shape every pilot.',
        cards: [
            { title: 'Unit Economics', text: 'Dynamic models connecting pricing, volume, and cost structure to every GTM decision with scenario planning.' },
            { title: 'Capital Allocation', text: 'Prioritization frameworks for investing into proven, de-risked initiatives with clear payback horizons.' },
            { title: 'Board Visibility', text: 'Live dashboards and executive briefing packs with leading indicators, risk flags, and action triggers.' },
        ]
    },
];

const SERVICE_STEPS = [
    { num: '01', title: 'Web Scan', desc: 'AI analyzes public signals about your company. See your readiness score and competitive position in minutes.', del: 'Deliverable · Free', out: 'Outcome · Readiness score in minutes', focus: false },
    { num: '02', title: 'Deep Diagnostic', desc: 'We analyze your internal data — CRM, financials, processes — and validate with key stakeholders.', del: 'Deliverable · £20K', out: 'Outcome · Execution-ready insights', focus: true },
    { num: '03', title: 'Requirements Packs', desc: 'Receive execution-ready specs: scope, roles, systems, success criteria, dependencies.', del: 'Deliverable · Blueprints', out: 'Outcome · Teams briefed & resourced', focus: false },
    { num: '04', title: 'Governed Execution', desc: 'We help you find the right resources and govern execution through to ROI achievement.', del: 'Deliverable · Ongoing', out: 'Outcome · Time-to-value assured', focus: false },
];

const READINESS_BARS = [
    { label: 'People & Org', score: 87 },
    { label: 'Data & Intelligence', score: 91 },
    { label: 'Technology Stack', score: 84 },
    { label: 'GTM Strategy', score: 89 },
    { label: 'Operations', score: 86 },
    { label: 'Financial Guardrails', score: 93 },
];

const TESTIMONIALS = [
    { text: '"SupaStack is the first partner that gave us live ROI guardrails. We green-lit pilots knowing exactly where the returns would land."', author: 'COO · Manufacturing Services · £80M revenue' },
    { text: '"They translated our messy CRM into an actionable blueprint in three weeks. Our board signed off unanimously."', author: 'Chief Revenue Officer · B2B SaaS · £52M revenue' },
    { text: '"We tried consulting twice. SupaStack\'s governed execution finally turned our AI talk into shipped outcomes."', author: 'VP Operations · Logistics Tech · £36M revenue' },
];

// Deterministic particles for CTA (avoids hydration mismatch)
const CTA_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
    size: 2 + ((i * 7) % 4),
    top: ((i * 37 + 13) % 100),
    left: ((i * 53 + 7) % 100),
    opacity: 0.08 + ((i * 13) % 20) / 100,
    duration: 15 + ((i * 11) % 15),
    delay: ((i * 3) % 10),
}));

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function Home() {
    const [activeTab, setActiveTab] = useState(DIMENSIONS[0].id);
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const servicesRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress: servicesProgress } = useScroll({
        target: servicesRef,
        offset: ['start 0.8', 'end 0.6'],
    });
    const lineWidth = useTransform(servicesProgress, [0, 1], ['0%', '100%']);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="bg-white font-sans selection:bg-indigo-500/30">
            {/* CSS Keyframes */}
            <style jsx global>{`
                @keyframes v6-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -25px) scale(1.05); }
                    66% { transform: translate(-20px, 15px) scale(0.95); }
                }
                @keyframes v6-float-reverse {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-25px, 30px) scale(0.95); }
                    66% { transform: translate(20px, -20px) scale(1.05); }
                }
                @keyframes v6-float-slow {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(15px, -10px); }
                }
                @keyframes v6-gradient-shift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes v6-rotate-border {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes v6-scan {
                    0% { transform: translateY(-100%); }
                    50% { transform: translateY(100%); }
                    100% { transform: translateY(-100%); }
                }
                @keyframes v6-grid-fade {
                    0%, 100% { opacity: 0.03; }
                    50% { opacity: 0.07; }
                }
                @keyframes v6-shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                @keyframes v6-pulse-ring {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
            `}</style>

            {/* ============ HEADER ============ */}
            <header className={cn(
                'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
                isScrolled
                    ? 'bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 py-3 shadow-sm'
                    : 'bg-transparent py-5'
            )}>
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    <Link href="#top" className="text-2xl font-bold tracking-tighter">
                        <span className="text-slate-900">SupaStack</span>
                    </Link>

                    <nav className="hidden md:block">
                        <ul className="flex items-center gap-8 text-sm font-medium text-slate-500">
                            {NAV_LINKS.map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="hover:text-slate-900 transition-colors duration-300">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden md:inline-flex text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors duration-300">
                            Sign In
                        </Link>
                        <Link
                            href="/signup"
                            className="hidden md:inline-flex items-center h-9 px-5 rounded-lg text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300"
                        >
                            Get Started
                        </Link>
                        <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            {mobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-slate-100 overflow-hidden"
                        >
                            <ul className="flex flex-col p-4 gap-4">
                                {NAV_LINKS.map(link => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="block text-lg font-medium text-slate-600" onClick={() => setMobileMenuOpen(false)}>
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                                <li className="pt-2 border-t border-slate-100">
                                    <Link href="/signup" className="block text-lg font-medium text-indigo-600" onClick={() => setMobileMenuOpen(false)}>
                                        Get Started
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/login" className="block text-lg font-medium text-slate-400" onClick={() => setMobileMenuOpen(false)}>
                                        Sign In
                                    </Link>
                                </li>
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ============ HERO ============ */}
            <section id="top" className="relative min-h-screen flex items-center pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
                {/* Animated gradient orbs — soft light-mode colors */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
                        style={{ top: '-10%', left: '5%', background: 'radial-gradient(circle, #c7d2fe, transparent 70%)', animation: 'v6-float 20s ease-in-out infinite', willChange: 'transform' }}
                    />
                    <div
                        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-25"
                        style={{ top: '25%', right: '0%', background: 'radial-gradient(circle, #ddd6fe, transparent 70%)', animation: 'v6-float-reverse 25s ease-in-out infinite', willChange: 'transform' }}
                    />
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
                        style={{ bottom: '-5%', left: '35%', background: 'radial-gradient(circle, #a5f3fc, transparent 70%)', animation: 'v6-float-slow 30s ease-in-out infinite', willChange: 'transform' }}
                    />
                </div>

                {/* Grid pattern — light mode */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.08) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                />

                <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 md:gap-20 items-center relative z-10">
                    {/* Left: Text */}
                    <div className="space-y-8">
                        <AnimatedText delay={0.1}>
                            <span className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold tracking-widest uppercase">
                                GTM Transformation. Evidence-Led.
                            </span>
                        </AnimatedText>

                        <div>
                            <AnimatedText delay={0.2}>
                                <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-slate-900 leading-[1.08]">
                                    95% of AI Pilots Fail.
                                </h1>
                            </AnimatedText>
                            <AnimatedText delay={0.35}>
                                <h1
                                    className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600"
                                    style={{ backgroundSize: '200% 100%', animation: 'v6-shimmer 4s linear infinite' }}
                                >
                                    Yours Doesn&apos;t Have To.
                                </h1>
                            </AnimatedText>
                        </div>

                        <FadeInView delay={0.55}>
                            <p className="text-xl text-slate-500 leading-relaxed max-w-xl">
                                SupaStack replaces slow, expensive discovery with AI-powered, evidence-led GTM transformation. Build the revenue engine that connects marketing, sales, and customer success — in weeks, not months.
                            </p>
                        </FadeInView>

                        <FadeInView delay={0.7}>
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        href="/signup"
                                        className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow duration-300"
                                    >
                                        Get Your Free Web Scan <ArrowRight className="ml-2 h-5 w-5" />
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                        href="#services"
                                        className="inline-flex items-center justify-center h-14 px-8 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm"
                                    >
                                        See How It Works
                                    </Link>
                                </motion.div>
                            </div>
                        </FadeInView>
                    </div>

                    {/* Right: Readiness Score Card with rotating border — dark card for contrast */}
                    <FadeInView delay={0.4} direction="left">
                        <div className="relative p-[1px] rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10">
                            {/* Rotating gradient border */}
                            <div
                                className="absolute inset-[-50%] opacity-60"
                                style={{ background: 'conic-gradient(from 0deg, #6366f1, #8b5cf6, #d946ef, #06b6d4, #6366f1)', animation: 'v6-rotate-border 4s linear infinite' }}
                            />
                            {/* Card content — stays dark for contrast */}
                            <div className="relative bg-[#0c0c1a] rounded-3xl overflow-hidden">
                                <div className="bg-gradient-to-r from-[#0f0f24] to-[#12122a] px-8 py-6 flex justify-between items-center">
                                    <span className="font-medium text-slate-400 uppercase tracking-[0.2em] text-xs">Readiness Pulse</span>
                                    <AnimatedCounter
                                        target={92}
                                        className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-400"
                                    />
                                </div>
                                <div className="p-8 space-y-5">
                                    {READINESS_BARS.map((row, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <span className="text-slate-400 font-medium text-sm group-hover:text-slate-200 transition-colors">{row.label}</span>
                                            <div className="flex items-center gap-4 flex-1 justify-end">
                                                <div className="h-2 w-32 bg-white/[0.06] rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileInView={{ width: `${row.score}%` }}
                                                        viewport={{ once: true }}
                                                        transition={{ type: 'spring', stiffness: 40, damping: 15, delay: 0.8 + i * 0.12 }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full"
                                                    />
                                                </div>
                                                <span className="text-white font-bold tabular-nums text-sm">{row.score}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {/* Scanline */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-400/[0.03] to-transparent pointer-events-none" style={{ animation: 'v6-scan 4s ease-in-out infinite' }} />
                            </div>
                        </div>
                    </FadeInView>
                </div>
            </section>

            {/* ============ TRUST RIBBON ============ */}
            <section className="py-16 bg-white/50 border-y border-slate-100/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView>
                        <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-10">
                            Trusted by revenue leaders at
                        </p>
                    </FadeInView>
                    <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
                        {['Fintech Co', 'B2B Services', 'SaaS Platform', 'Professional Services', 'Tech Startup'].map((name, i) => (
                            <FadeInView key={name} delay={i * 0.08}>
                                <span className="text-xl font-bold text-slate-300 hover:text-indigo-500 transition-colors duration-300 cursor-default">{name}</span>
                            </FadeInView>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gradient divider light->dark */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

            {/* ============ BELIEF STATEMENT ============ */}
            <section id="belief" className="py-24 md:py-36 bg-[#0a0a14] relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                <div className="container mx-auto px-4 md:px-6 py-12 relative z-10 max-w-5xl text-center">
                    <FadeInView>
                        <p className="text-indigo-400 font-medium tracking-[0.3em] uppercase text-sm mb-10">
                            We Believe Transformation Shouldn&apos;t Be This Hard
                        </p>
                    </FadeInView>
                    <FadeInView delay={0.2}>
                        <h2 className="text-3xl md:text-5xl font-light leading-tight md:leading-tight text-slate-200/90">
                            &ldquo;The AI revolution promised speed. Instead, most companies got: 8-week discovery cycles. £100K consulting bills. PowerPoints that never became products. We started SupaStack because mid-market companies deserve better than expensive opinion-gathering dressed up as strategy.&rdquo;
                        </h2>
                    </FadeInView>
                </div>
            </section>

            {/* Gradient divider dark->light */}
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {/* ============ PROBLEM ============ */}
            <section id="problem" className="py-24 md:py-36 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Why GTM Transformation Fails</h2>
                        <p className="text-xl text-slate-500">It&apos;s not the AI. It&apos;s the readiness gap — 83% of leaders know AI will transform their business, but only 39% feel confident implementing it.</p>
                    </FadeInView>

                    <div className="grid lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit mb-12 lg:mb-0">
                            <FadeInView>
                                <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-violet-500 mb-8 rounded-full" />
                                <h3 className="text-3xl font-bold text-slate-900 leading-snug">
                                    The problem isn&apos;t AI. It&apos;s the guidance gap between GTM strategy and RevOps execution.
                                </h3>
                            </FadeInView>
                        </div>

                        <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
                            {PROBLEM_POINTS.map((item, i) => (
                                <FadeInView key={i} delay={i * 0.1} className={i === PROBLEM_POINTS.length - 1 ? 'md:col-span-2' : ''}>
                                    <GlowCard className="bg-slate-50 p-8 border border-slate-100">
                                        <motion.span
                                            className="text-5xl font-mono font-extralight text-slate-200 group-hover:text-indigo-200 transition-colors block mb-4"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.5, delay: i * 0.1 }}
                                        >
                                            {item.number}
                                        </motion.span>
                                        <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                                        <p className="text-slate-500 leading-relaxed">{item.desc}</p>
                                    </GlowCard>
                                </FadeInView>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ COMPARISON ============ */}
            <section id="comparison" className="py-24 md:py-36 bg-[#f8f8fa] relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Evidence-Led GTM Transformation</h2>
                        <p className="text-xl text-slate-500">AI finds the patterns. Humans validate the priorities. You get execution-ready plans.</p>
                    </FadeInView>

                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        {/* Traditional */}
                        <FadeInView>
                            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden h-full">
                                <div className="absolute top-0 left-0 w-full h-1 bg-slate-300" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-4">Traditional Consulting</p>
                                <h3 className="text-3xl font-bold text-slate-900 mb-4">8-12 weeks discovery</h3>
                                <p className="text-slate-500 mb-8">Interview-led, subjective. AI-only or human-only. Long lists of ideas. Reports on shelves.</p>
                                <div className="flex gap-8 mb-8 pb-8 border-b border-slate-100">
                                    <div>
                                        <strong className="block text-2xl font-bold text-slate-900">8–12 weeks</strong>
                                        <span className="text-sm text-slate-400 uppercase font-semibold">discovery</span>
                                    </div>
                                    <div>
                                        <strong className="block text-2xl font-bold text-slate-900">£50–150K+</strong>
                                        <span className="text-sm text-slate-400 uppercase font-semibold">investment</span>
                                    </div>
                                </div>
                                <ul className="space-y-4">
                                    {['Interview-led, subjective approach', 'AI-only or human-only validation', 'Long lists of ideas without prioritization'].map((t, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-500">
                                            <span className="text-red-400 font-bold mt-0.5">&#x2715;</span> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeInView>

                        {/* SupaStack */}
                        <FadeInView delay={0.15}>
                            <div className="bg-[#0c0c1a] p-10 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden text-white h-full" style={{ boxShadow: '0 0 60px -12px rgba(99,102,241,0.15)' }}>
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" style={{ backgroundSize: '200% 100%', animation: 'v6-gradient-shift 3s ease infinite' }} />
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.15em] mb-4">SupaStack Approach</p>
                                <h3 className="text-3xl font-bold text-white mb-4">Days to first insights</h3>
                                <p className="text-slate-300 mb-8">Evidence-led, AI-powered. Human-in-the-Loop validation. Prioritized, feasible initiatives. Execution-ready requirements.</p>
                                <div className="flex gap-8 mb-8 pb-8 border-b border-white/10">
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
                                    {['Evidence-led, AI-powered signal extraction', 'Human-in-the-Loop validation with stakeholders', 'Prioritized, feasible initiatives with clear ROI'].map((t, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300">
                                            <span className="text-emerald-400 font-bold mt-0.5" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }}>&#x2713;</span> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeInView>
                    </div>

                    {/* The signal is impossible to miss — Metric Cards Grid */}
                    <div className="mt-4">
                        <FadeInView className="text-center max-w-3xl mx-auto mb-12">
                            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The signal is impossible to miss.</h3>
                            <p className="text-lg text-slate-500">Every dimension that matters flips green with SupaStack. You feel the pace difference, the confidence difference, and the readiness difference.</p>
                        </FadeInView>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {COMPARISON_TABLE.map((row, i) => (
                                <FadeInView key={i} delay={i * 0.08}>
                                    <GlowCard className="bg-white border border-slate-100 p-6 h-full">
                                        <div className="mb-5">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                                                {row.metric}
                                            </span>
                                        </div>

                                        {/* Traditional — struck through */}
                                        <div className="flex items-start gap-3 mb-4 pb-4 border-b border-slate-100">
                                            <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-red-400 text-xs font-bold">&#x2715;</span>
                                            </div>
                                            <p className="text-slate-400 text-sm leading-relaxed line-through decoration-slate-300">{row.traditional}</p>
                                        </div>

                                        {/* SupaStack — highlighted */}
                                        <div className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-emerald-500 text-xs font-bold">&#x2713;</span>
                                            </div>
                                            <p className="text-slate-800 text-sm leading-relaxed font-medium">{row.supa}</p>
                                        </div>
                                    </GlowCard>
                                </FadeInView>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ SERVICES ============ */}
            <section id="services" className="py-24 md:py-36 bg-white relative overflow-hidden" ref={servicesRef}>
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">From Assessment to Action</h2>
                        <p className="text-xl text-slate-500">AI finds the patterns. Humans validate the priorities. You get execution-ready plans — not shelf-ware.</p>
                    </FadeInView>

                    <div className="grid md:grid-cols-4 gap-6 relative">
                        {/* Static background line */}
                        <div className="hidden md:block absolute top-[60px] left-0 w-full h-0.5 bg-slate-100 -z-10" />
                        {/* Animated gradient fill line */}
                        <motion.div
                            className="hidden md:block absolute top-[60px] left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 -z-10"
                            style={{ width: lineWidth }}
                        />

                        {SERVICE_STEPS.map((step, i) => (
                            <FadeInView key={i} delay={i * 0.15} className={`relative pt-8 ${step.focus ? 'md:-mt-8' : ''}`}>
                                <div className="relative mx-auto mb-6">
                                    <div className={cn(
                                        'w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl border-4 bg-white z-10 relative mx-auto',
                                        step.focus
                                            ? 'border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-200'
                                            : 'border-slate-100 text-slate-300'
                                    )}>
                                        {step.num}
                                    </div>
                                    {step.focus && (
                                        <div
                                            className="absolute inset-0 rounded-full border-2 border-indigo-500/40 mx-auto"
                                            style={{ width: 64, height: 64, animation: 'v6-pulse-ring 2s ease-out infinite' }}
                                        />
                                    )}
                                </div>

                                <div className={cn(
                                    'p-6 rounded-2xl border',
                                    step.focus
                                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-transparent shadow-xl shadow-indigo-500/20'
                                        : 'bg-slate-50 border-slate-100 hover:border-indigo-100 transition-colors'
                                )}>
                                    <h3 className={cn('text-xl font-bold mb-4', step.focus ? 'text-white' : 'text-slate-900')}>{step.title}</h3>
                                    <p className={cn('mb-6 text-sm leading-relaxed', step.focus ? 'text-indigo-100' : 'text-slate-500')}>{step.desc}</p>
                                    <div className={cn('pt-4 border-t text-xs space-y-2', step.focus ? 'border-indigo-500/50 text-indigo-200' : 'border-slate-200 text-slate-400')}>
                                        <div className="font-semibold">{step.del}</div>
                                        <div className="font-semibold">{step.out}</div>
                                    </div>
                                </div>
                            </FadeInView>
                        ))}
                    </div>
                </div>
            </section>

            {/* Gradient divider light->dark */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />

            {/* ============ DIMENSIONS ============ */}
            <section id="dimensions" className="py-24 md:py-36 bg-[#080812] text-white relative overflow-hidden">
                {/* Animated grid */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(99,102,241,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.06) 1px, transparent 1px)',
                        backgroundSize: '80px 80px',
                        animation: 'v6-grid-fade 8s ease-in-out infinite',
                    }}
                />

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <FadeInView className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Six Dimensions of Readiness</h2>
                        <p className="text-xl text-slate-400">Every initiative scored on Impact x Feasibility</p>
                    </FadeInView>

                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Tabs */}
                        <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                            {DIMENSIONS.map((dim) => (
                                <button
                                    key={dim.id}
                                    onClick={() => setActiveTab(dim.id)}
                                    className={cn(
                                        'flex items-center text-left px-5 py-4 rounded-xl transition-all duration-300 whitespace-nowrap lg:whitespace-normal',
                                        activeTab === dim.id
                                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                                            : 'hover:bg-white/[0.03] text-slate-500 hover:text-slate-300 border border-transparent'
                                    )}
                                >
                                    {activeTab === dim.id && (
                                        <motion.div
                                            layoutId="v6-tab-dot"
                                            className="w-2 h-2 rounded-full bg-indigo-400 mr-3 shrink-0"
                                            style={{ boxShadow: '0 0 8px rgba(99,102,241,0.6)' }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
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
                                            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                            exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
                                            transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                                            className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 md:p-12 backdrop-blur-sm"
                                        >
                                            <h3 className="text-3xl font-bold text-white mb-4">{dim.title}</h3>
                                            <p className="text-lg text-slate-400 mb-12 max-w-3xl">{dim.desc}</p>

                                            <div className="grid md:grid-cols-3 gap-8">
                                                {dim.cards.map((card, i) => (
                                                    <motion.div
                                                        key={i}
                                                        className="bg-white/[0.03] p-6 rounded-2xl border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-300"
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                                    >
                                                        <h4 className="text-indigo-400 font-bold mb-3">{card.title}</h4>
                                                        <p className="text-slate-400 text-sm leading-relaxed">{card.text}</p>
                                                    </motion.div>
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
            </section>

            {/* Gradient divider dark->light */}
            <div className="h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

            {/* ============ RESULTS ============ */}
            <section id="results" className="py-24 md:py-36 bg-white relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Proven Results</h2>
                        <p className="text-xl text-slate-500">Mid-market operators choose SupaStack to compress the time between recognising AI potential and capturing measurable value.</p>
                    </FadeInView>

                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-8 mb-20">
                        <FadeInView className="text-center p-10 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100">
                            <strong className="block text-6xl md:text-7xl font-bold mb-4">
                                <AnimatedCounter
                                    target={2.4}
                                    prefix="£"
                                    suffix="M"
                                    decimals={1}
                                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600"
                                />
                            </strong>
                            <p className="text-slate-600 font-medium">Pipeline identified in first 90 days for a £15M B2B services company</p>
                        </FadeInView>
                        <FadeInView delay={0.12} className="text-center p-10 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100">
                            <strong className="block text-6xl md:text-7xl font-bold mb-4">
                                <AnimatedCounter
                                    target={67}
                                    suffix="%"
                                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600"
                                />
                            </strong>
                            <p className="text-slate-600 font-medium">Faster from assessment to execution-ready plan vs. traditional consulting</p>
                        </FadeInView>
                        <FadeInView delay={0.24} className="text-center p-10 rounded-3xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-100">
                            <strong className="block text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 mb-4">
                                3 of 3
                            </strong>
                            <p className="text-slate-600 font-medium">Pilots succeeded vs. industry average of 5%</p>
                        </FadeInView>
                    </div>

                    {/* Testimonials */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {TESTIMONIALS.map((testi, i) => (
                            <FadeInView key={i} delay={i * 0.1}>
                                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg hover:shadow-indigo-100/30 hover:-translate-y-1 transition-all duration-300 h-full">
                                    <Quote className="w-8 h-8 text-indigo-100 fill-indigo-100 mb-4" />
                                    <p className="text-slate-700 mb-6 text-lg italic leading-relaxed">{testi.text}</p>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider not-italic block">{testi.author}</span>
                                </div>
                            </FadeInView>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section id="cta" className="py-24 md:py-36 bg-[#f8f8fa]">
                <div className="container mx-auto px-4 md:px-6">
                    <FadeInView>
                        <div
                            className="relative rounded-[3rem] p-12 md:p-24 text-center text-white overflow-hidden shadow-2xl"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #c026d3)', backgroundSize: '200% 200%', animation: 'v6-gradient-shift 6s ease infinite' }}
                        >
                            {/* Floating particles */}
                            {CTA_PARTICLES.map((p, i) => (
                                <div
                                    key={i}
                                    className="absolute rounded-full bg-white"
                                    style={{
                                        width: p.size, height: p.size,
                                        top: `${p.top}%`, left: `${p.left}%`,
                                        opacity: p.opacity,
                                        animation: `v6-float-slow ${p.duration}s ease-in-out infinite`,
                                        animationDelay: `${p.delay}s`,
                                    }}
                                />
                            ))}

                            {/* Decorative blurs */}
                            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-400/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />

                            <div className="relative z-10 max-w-4xl mx-auto">
                                <h2 className="text-4xl md:text-6xl font-bold mb-8">Start With a Free Web Scan</h2>
                                <p className="text-xl md:text-2xl text-white/80 mb-12 leading-relaxed">
                                    See your readiness score across 6 dimensions, your competitive gaps vs. 5 peers, and your top 3 quick wins — in minutes, not months.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                        <Link
                                            href="/signup"
                                            className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white text-indigo-700 font-bold text-lg shadow-xl shadow-black/10 hover:shadow-2xl transition-shadow duration-300"
                                        >
                                            Get My Free Assessment
                                        </Link>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                        <a
                                            href="#services"
                                            className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300"
                                        >
                                            Review the process
                                        </a>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </FadeInView>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer className="bg-[#0a0a0f] border-t border-white/5 py-16">
                <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
                    <strong className="text-white text-base font-bold">SupaStack Ltd</strong>
                    <span>Company number 16869878 · Registered in England</span>
                    <span>&copy; {new Date().getFullYear()} SupaStack. All rights reserved.</span>
                </div>
            </footer>
        </div>
    );
}
