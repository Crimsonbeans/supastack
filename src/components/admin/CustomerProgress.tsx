'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface ProgressData {
    req_gen_status: 'not_started' | 'running' | 'completed' | 'failed'
    has_report: boolean
}

const STEPS = [
    { key: 'phase1_report', label: 'Phase 1 Report' },
    { key: 'phase2_requirements', label: 'Requirements' },
    { key: 'phase2_report_1', label: 'Report 1' },
    { key: 'phase2_report_2', label: 'Report 2' },
    { key: 'phase2_report_3', label: 'Report 3' },
    { key: 'phase2_report_4', label: 'Report 4' },
]

export default function CustomerProgress({ customerId }: { customerId: string }) {
    const [data, setData] = useState<ProgressData | null>(null)

    const fetchProgress = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/customer-details?customer_id=${customerId}`)
            const json = await res.json()
            if (res.ok) setData(json)
        } catch { /* silent */ }
    }, [customerId])

    useEffect(() => { fetchProgress() }, [fetchProgress])

    // Auto-refresh when generating
    useEffect(() => {
        if (data?.req_gen_status !== 'running') return
        const interval = setInterval(fetchProgress, 5000)
        return () => clearInterval(interval)
    }, [data?.req_gen_status, fetchProgress])

    const getStepState = (key: string): 'completed' | 'running' | 'failed' | 'upcoming' => {
        if (!data) return 'upcoming'
        if (key === 'phase1_report') return data.has_report ? 'completed' : 'upcoming'
        if (key === 'phase2_requirements') {
            if (data.req_gen_status === 'completed') return 'completed'
            if (data.req_gen_status === 'running') return 'running'
            if (data.req_gen_status === 'failed') return 'failed'
            return 'upcoming'
        }
        return 'upcoming'
    }

    const getStatusText = (): string => {
        if (!data) return ''
        if (data.req_gen_status === 'running') return 'Generating requirements...'
        if (data.req_gen_status === 'failed') return 'Requirements failed'
        if (data.req_gen_status === 'completed') return 'Requirements generated'
        if (data.has_report) return 'Phase 1 complete'
        return ''
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
                {STEPS.map((step) => {
                    const state = getStepState(step.key)
                    return (
                        <div
                            key={step.key}
                            title={`${step.label}: ${state}`}
                            className="relative"
                        >
                            {state === 'running' ? (
                                <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                            ) : (
                                <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                                    state === 'completed'
                                        ? 'bg-green-500'
                                        : state === 'failed'
                                        ? 'bg-red-500'
                                        : 'bg-slate-200'
                                }`} />
                            )}
                        </div>
                    )
                })}
            </div>
            {data && (
                <span className={`text-[10px] leading-tight ${
                    data.req_gen_status === 'running' ? 'text-indigo-600' :
                    data.req_gen_status === 'failed' ? 'text-red-600' :
                    'text-slate-500'
                }`}>
                    {getStatusText()}
                </span>
            )}
        </div>
    )
}
