'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Loader2, Sparkles, Zap, Shield, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function LandingPage() {
    const [domain, setDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleScan = (e: React.FormEvent) => {
        e.preventDefault()
        if (!domain) return
        setLoading(true)

        // Clean domain
        const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '')

        // Extract potential company name (e.g. 'acme' from 'acme.com')
        // Simple extraction for pre-fill
        const companyName = cleanDomain.split('.')[0]
        const formattedCompanyName = companyName.charAt(0).toUpperCase() + companyName.slice(1)

        // Redirect to signup with params
        const params = new URLSearchParams()
        params.set('domain', cleanDomain)
        params.set('company_name', formattedCompanyName)

        router.push(`/signup?${params.toString()}`)
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
            {/* Navbar */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="font-bold text-[16px] tracking-wide">
                        SUPASTACK
                    </div>
                    <div className="flex gap-4">
                        {/* Client Portal TBD */}
                        <Link href="/login" className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign In</Link>
                        <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-white text-black rounded-full hover:bg-zinc-200 transition-colors">Get Started</Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 px-6 overflow-hidden">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -z-10" />
                    <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />

                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium hover:bg-white/10 transition-colors cursor-default"
                        >
                            <Sparkles className="w-4 h-4" />
                            <span>AI-Powered GTM Intelligence</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
                        >
                            Is your GTM Strategy <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-gradient bg-300%">
                                AI Ready?
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            Instant benchmarking for B2B SaaS companies. Analyze your web presence, positioning, and technology stack against the top 1% of the market.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="max-w-md mx-auto relative group"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <form onSubmit={handleScan} className="relative flex items-center bg-black border border-white/10 rounded-xl p-2 shadow-2xl">
                                <div className="pl-4 text-zinc-500">
                                    <Search className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="company.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-white flex-1 min-w-0 px-4 py-2 placeholder:text-zinc-600"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !domain}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Generate Report <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm text-zinc-600"
                        >
                            Free instant analysis. No credit card required.
                        </motion.p>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-20 px-6 border-t border-white/5 bg-black/50">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-400" />}
                            title="Instant Analysis"
                            description="Get a comprehensive report on your GTM readiness in under 2 minutes."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-green-400" />}
                            title="Competitive Benchmarking"
                            description="See how you stack up against industry leaders and direct competitors."
                        />
                        <FeatureCard
                            icon={<Sparkles className="w-6 h-6 text-purple-400" />}
                            title="AI Action Plan"
                            description="Actionable insights to integrate AI into your sales and marketing motion."
                        />
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-zinc-600 text-sm">
                &copy; 2026 Antigravity. All rights reserved.
            </footer>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="mb-4 bg-white/5 w-12 h-12 rounded-lg flex items-center justify-center border border-white/5">
                {icon}
            </div>
            <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
            <p className="text-zinc-400 leading-relaxed">{description}</p>
        </div>
    )
}
