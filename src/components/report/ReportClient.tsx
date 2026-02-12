'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CheckCircle, Smartphone, Globe, BarChart3, Calendar } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Prospect = {
    id: string
    company_name: string
    company_domain: string
    status: string
    report_html?: string | null
    report_html_public?: string | null
    confidence_score: number
    webscan_type: string
}

export default function ReportClient({
    initialProspect,
    isLoggedIn
}: {
    initialProspect: Prospect
    isLoggedIn: boolean
}) {
    const [prospect, setProspect] = useState<Prospect>(initialProspect)
    const supabase = createClient()

    // Polling logic
    useEffect(() => {
        // Poll if pending or processing
        if (prospect.status !== 'processing' && prospect.status !== 'pending') return

        const interval = setInterval(async () => {
            const { data, error } = await supabase
                .from('prospects')
                .select('*')
                .eq('id', prospect.id)
                .single()

            if (data && !error) {
                setProspect(data)
                // Stop if completed
                if (data.status === 'completed') {
                    clearInterval(interval)
                }
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [prospect.status, prospect.id, supabase])

    // Pending State
    if (prospect.status === 'pending') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="p-6 bg-zinc-900/50 rounded-full inline-block border border-zinc-800">
                        <BarChart3 className="w-12 h-12 text-zinc-500" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">Analysis Queued</h2>
                    <p className="text-zinc-400">
                        Your request for <span className="text-white font-medium">{prospect.company_name || prospect.company_domain}</span> has been received.
                        Our team is initiating the deep-dive web scan.
                    </p>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-zinc-700"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-xs text-zinc-600">Please wait for an admin to start the process...</p>
                </div>
            </div>
        )
    }

    // Loading State (Processing)
    if (prospect.status === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="relative w-32 h-32 mx-auto">
                        <motion.div
                            className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"
                            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute inset-0 border-t-4 border-indigo-500 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Globe className="w-10 h-10 text-indigo-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">Analyzing {prospect.company_name}</h2>
                        <div className="flex flex-col gap-1 text-sm text-zinc-400">
                            <LoadingMessage delay={0} text="Scanning company domain..." />
                            <LoadingMessage delay={2} text="Analyzing market positioning..." />
                            <LoadingMessage delay={4} text="Evaluating AI readiness signals..." />
                            <LoadingMessage delay={6} text="Generating strategic insights..." />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Display Report (Public or Private)
    // The report content is now pre-processed by the server.
    const displayHtml = prospect.report_html;




    if (!displayHtml) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-zinc-500">
                <p>No report data available yet.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-black" dangerouslySetInnerHTML={{ __html: displayHtml }} />
    )

}

function LoadingMessage({ delay, text }: { delay: number, text: string }) {
    return (
        <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            {text}
        </motion.span>
    )
}
