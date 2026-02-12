'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

function SignupContent() {
    const searchParams = useSearchParams()
    const initialCompany = searchParams.get('company_name') || ''
    const initialDomain = searchParams.get('domain') || ''

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [companyName, setCompanyName] = useState(initialCompany)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
                data: {
                    full_name: fullName,
                    company_name: companyName,
                    company_domain: initialDomain // stored in metadata for trigger to use
                }
            }
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Successful signup - show verification message
            setSuccess(true)
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-md space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl text-center">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Mail className="w-8 h-8" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-white">Check Your Inbox</h2>
                    <p className="text-zinc-400">
                        We've sent a verification link to <span className="text-white font-medium">{email}</span>.
                    </p>
                    <p className="text-sm text-zinc-500">
                        Please verify your email address to access your dashboard and view your report.
                    </p>
                </div>

                <div className="pt-4 space-y-4">
                    <Link
                        href="/login"
                        className="block w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors"
                    >
                        Back to Sign In
                    </Link>
                    <p className="text-xs text-zinc-600">
                        Didn't receive the email? Check your spam folder.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-sm space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-zinc-400">Get your GTM & AI Readiness Report.</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Full Name</label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Company Name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                    />
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Sign Up'}
                </button>
            </form>

            <div className="text-center text-sm text-zinc-500">
                Already have an account? <Link href="/login" className="text-white hover:underline">Sign in</Link>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 relative">
            {/* Top Left Logo */}
            <Link href="/" className="absolute top-6 left-6 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                SUPASTACK
            </Link>

            {/* Top Right Close Icon */}
            <Link href="/" className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </Link>

            <Suspense fallback={<div className="text-white"><Loader2 className="animate-spin" /></div>}>
                <SignupContent />
            </Suspense>
        </div>
    )
}
