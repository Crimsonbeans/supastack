'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Quote } from 'lucide-react'

const READINESS_BARS = [
    { label: 'People & Org', score: 87 },
    { label: 'Data & Intelligence', score: 91 },
    { label: 'Technology Stack', score: 84 },
    { label: 'GTM Strategy', score: 89 },
    { label: 'Operations', score: 86 },
    { label: 'Financial Guardrails', score: 93 },
]

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/dashboard/report')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Panel — Decorative */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 flex-col justify-between p-12 overflow-hidden border-r border-slate-100">
                {/* Gradient orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div
                        className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-30"
                        style={{ top: '-10%', left: '5%', background: 'radial-gradient(circle, #c7d2fe, transparent 70%)' }}
                    />
                    <div
                        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-25"
                        style={{ bottom: '10%', right: '-5%', background: 'radial-gradient(circle, #ddd6fe, transparent 70%)' }}
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
                        {/* Readiness card */}
                        <div className="bg-[#0c0c1a] rounded-2xl overflow-hidden shadow-xl shadow-indigo-500/10">
                            <div className="bg-gradient-to-r from-[#0f0f24] to-[#12122a] px-6 py-4 flex justify-between items-center">
                                <span className="font-medium text-slate-400 uppercase tracking-[0.15em] text-xs">Readiness Pulse</span>
                                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-400">92</span>
                            </div>
                            <div className="p-6 space-y-4">
                                {READINESS_BARS.map((row, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <span className="text-slate-400 text-sm">{row.label}</span>
                                        <div className="flex items-center gap-3 flex-1 justify-end">
                                            <div className="h-1.5 w-24 bg-white/[0.06] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full"
                                                    style={{ width: `${row.score}%` }}
                                                />
                                            </div>
                                            <span className="text-white font-bold tabular-nums text-xs">{row.score}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Testimonial */}
                        <div className="mt-10">
                            <Quote className="w-6 h-6 text-indigo-200 fill-indigo-200 mb-3" />
                            <p className="text-slate-600 text-sm italic leading-relaxed">
                                &ldquo;They translated our messy CRM into an actionable blueprint in three weeks. Our board signed off unanimously.&rdquo;
                            </p>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-3 block">
                                Chief Revenue Officer &middot; B2B SaaS
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
                    <div className="w-full max-w-sm space-y-8">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                            <p className="text-slate-500">Enter your credentials to access the portal.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all"
                                    placeholder="you@company.com"
                                    required
                                />
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
                                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign In'}
                            </button>
                        </form>

                        <div className="text-center text-sm text-slate-500">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">Sign up</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
