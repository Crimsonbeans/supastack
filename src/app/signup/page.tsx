'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, Sparkles, ArrowLeft, Quote } from 'lucide-react'

// Blocklist of non-business / disposable domains
const BLOCKED_DOMAINS = new Set([
    'gmail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
    'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
    'aol.com', 'icloud.com', 'me.com', 'mac.com',
    'mail.com', 'email.com',
    'protonmail.com', 'proton.me',
    'zoho.com', 'zohomail.com',
    'yandex.com', 'yandex.ru',
    'rediffmail.com', 'rediff.com',
    'test.com', 'example.com', 'example.org', 'example.net',
    'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'temp-mail.org',
    'throwaway.email', 'sharklasers.com', 'guerrillamailblock.com',
    'grr.la', 'dispostable.com', 'yopmail.com',
])

// Domain format regex: word characters/hyphens + dot + 2-12 char TLD
const DOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,12}$/

// Email format regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

function cleanDomain(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/\/.*$/, '') // remove trailing paths
}

function validateDomain(domain: string): string | null {
    if (!domain) return 'Company domain is required'
    if (!DOMAIN_REGEX.test(domain)) return 'Please enter a valid domain (e.g. yourcompany.com)'
    if (BLOCKED_DOMAINS.has(domain)) return 'Please enter a valid business domain, not a personal email provider'
    return null
}

function validateEmail(email: string): string | null {
    if (!email) return 'Email is required'
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address'
    return null
}

const STATS = [
    { value: '£2.4M', label: 'Pipeline identified in 90 days' },
    { value: '67%', label: 'Faster than traditional consulting' },
    { value: '3 of 3', label: 'Pilots succeeded (vs 5% avg)' },
]

function SignupContent() {
    const searchParams = useSearchParams()
    const initialCompany = searchParams.get('company_name') || ''
    const initialDomain = searchParams.get('domain') || ''

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [companyName, setCompanyName] = useState(initialCompany)
    const [companyDomain, setCompanyDomain] = useState(initialDomain ? cleanDomain(initialDomain) : '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [domainError, setDomainError] = useState<string | null>(null)
    const [emailError, setEmailError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleEmailChange = (value: string) => {
        setEmail(value)
        setEmailError(null)

        // Auto-populate domain from email if domain is empty
        if (!companyDomain && value.includes('@')) {
            const emailDomain = value.split('@')[1]
            if (emailDomain && emailDomain.includes('.') && !BLOCKED_DOMAINS.has(emailDomain.toLowerCase())) {
                setCompanyDomain(emailDomain.toLowerCase())
            }
        }
    }

    const handleDomainChange = (value: string) => {
        const cleaned = cleanDomain(value)
        setCompanyDomain(cleaned)
        setDomainError(null)
    }

    const handleDomainBlur = () => {
        if (companyDomain) {
            const err = validateDomain(companyDomain)
            setDomainError(err)
        }
    }

    const handleEmailBlur = () => {
        if (email) {
            const err = validateEmail(email)
            setEmailError(err)
        }
    }

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validate all fields
        const dErr = validateDomain(companyDomain)
        const eErr = validateEmail(email)

        if (dErr) { setDomainError(dErr); return }
        if (eErr) { setEmailError(eErr); return }

        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    full_name: fullName,
                    company_name: companyName,
                    company_domain: companyDomain
                }
            }
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        // Signup succeeded — show verification screen
        setSuccess(true)
        setLoading(false)

        // Fire-and-forget: trigger report generation in background
        fetch('/api/auto-generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, company_domain: companyDomain }),
        }).catch(() => {
            // Silently ignore — user can still trigger manually later
        })
    }

    if (success) {
        return (
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 border border-indigo-100">
                        <Mail className="w-8 h-8" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-slate-900">Check Your Inbox</h2>
                    <p className="text-slate-500">
                        We&apos;ve sent a verification link to <span className="text-slate-900 font-medium">{email}</span>.
                    </p>
                    <p className="text-sm text-slate-600">
                        Click the link in your email and you&apos;ll be taken directly to your report — no need to sign in again.
                    </p>
                </div>

                <div className="pt-4 space-y-4">
                    <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-600">
                        <Sparkles className="w-5 h-5 shrink-0" />
                        <span>Your report is already being generated in the background!</span>
                    </div>
                    <p className="text-xs text-slate-400">
                        Didn&apos;t receive the email? Check your spam folder.
                    </p>
                    <p className="text-xs text-slate-400">
                        Already verified? <Link href="/login" className="text-indigo-600 hover:text-indigo-700 underline">Sign in</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm space-y-7">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-slate-900">Create your account</h1>
                <p className="text-slate-500">Get your GTM &amp; AI Readiness Report.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                        placeholder="Jane Smith"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                        placeholder="Acme Inc"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Domain</label>
                    <input
                        type="text"
                        value={companyDomain}
                        onChange={(e) => handleDomainChange(e.target.value)}
                        onBlur={handleDomainBlur}
                        placeholder="e.g. yourcompany.com"
                        className={`w-full bg-white border rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all ${domainError ? 'border-red-400' : 'border-slate-200'}`}
                        required
                    />
                    {domainError && <p className="text-red-500 text-xs mt-1.5">{domainError}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={handleEmailBlur}
                        placeholder="you@company.com"
                        className={`w-full bg-white border rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all ${emailError ? 'border-red-400' : 'border-slate-200'}`}
                        required
                    />
                    {emailError && <p className="text-red-500 text-xs mt-1.5">{emailError}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
                </button>
            </form>

            <div className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Sign in</Link>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel — Decorative */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex-col justify-between p-12 overflow-hidden border-r border-slate-100">
                {/* Gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-30"
                        style={{ top: '-10%', right: '10%', background: 'radial-gradient(circle, #c7d2fe, transparent 70%)' }}
                    />
                    <div
                        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-20"
                        style={{ bottom: '5%', left: '-5%', background: 'radial-gradient(circle, #ddd6fe, transparent 70%)' }}
                    />
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,.08) 1px, transparent 1px)', backgroundSize: '60px 60px' }}
                />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900">
                        SupaStack
                    </Link>

                    {/* Center content */}
                    <div className="flex-1 flex flex-col justify-center max-w-sm">
                        <h2 className="text-3xl font-bold text-slate-900 leading-snug mb-3">
                            See where you stand. In minutes.
                        </h2>
                        <p className="text-slate-500 mb-10 leading-relaxed">
                            AI-powered, evidence-led GTM transformation. No interviews. No guesswork. Just signal.
                        </p>

                        {/* Stats */}
                        <div className="space-y-6 mb-10">
                            {STATS.map((stat, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 min-w-[80px]">
                                        {stat.value}
                                    </span>
                                    <span className="text-slate-500 text-sm">{stat.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial */}
                        <div className="pt-8 border-t border-slate-100">
                            <Quote className="w-6 h-6 text-indigo-200 fill-indigo-200 mb-3" />
                            <p className="text-slate-600 text-sm italic leading-relaxed">
                                &ldquo;SupaStack is the first partner that gave us live ROI guardrails. We green-lit pilots knowing exactly where the returns would land.&rdquo;
                            </p>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 block">
                                COO &middot; Manufacturing Services &middot; £80M revenue
                            </span>
                        </div>
                    </div>

                    {/* Bottom */}
                    <p className="text-xs text-slate-400">
                        Trusted by revenue leaders at mid-market companies
                    </p>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <div className="flex items-center justify-between p-6">
                    <Link href="/" className="lg:hidden text-xl font-bold tracking-tighter text-slate-900">
                        SupaStack
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors ml-auto">
                        <ArrowLeft className="w-4 h-4" />
                        Back to home
                    </Link>
                </div>

                {/* Form centered */}
                <div className="flex-1 flex items-center justify-center px-6 md:px-12">
                    <Suspense fallback={<div className="text-slate-400"><Loader2 className="animate-spin" /></div>}>
                        <SignupContent />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
