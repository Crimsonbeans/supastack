'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ClipboardList, FileBarChart, Loader2, CheckCircle, Clock } from 'lucide-react'

interface CustomerDetails {
    customer_id: string
    prospect_id: string | null
    company_name: string
    contact_name: string
    contact_email: string
    report_generated_at: string
    has_report: boolean
}

const SECTIONS = [
    {
        key: 'phase1_report',
        title: 'Phase 1 Report',
        icon: FileText,
        phase: 1,
        type: 'report' as const
    },
    {
        key: 'phase2_requirements',
        title: 'Phase 2 Requirements',
        icon: ClipboardList,
        phase: 2,
        type: 'form' as const
    },
    {
        key: 'phase2_report_1',
        title: 'Phase 2 Report 1',
        icon: FileBarChart,
        phase: 2,
        type: 'report' as const
    },
    {
        key: 'phase2_report_2',
        title: 'Phase 2 Report 2',
        icon: FileBarChart,
        phase: 2,
        type: 'report' as const
    },
    {
        key: 'phase2_report_3',
        title: 'Phase 2 Report 3',
        icon: FileBarChart,
        phase: 2,
        type: 'report' as const
    },
    {
        key: 'phase2_report_4',
        title: 'Phase 2 Report 4',
        icon: FileBarChart,
        phase: 2,
        type: 'report' as const
    }
]

export default function CustomerExpandedRow({ customerId }: { customerId: string }) {
    const router = useRouter()
    const [details, setDetails] = useState<CustomerDetails | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDetails() {
            try {
                const res = await fetch(`/api/admin/customer-details?customer_id=${customerId}`)
                const data = await res.json()
                if (res.ok) setDetails(data)
            } catch (err) {
                console.error('Failed to fetch customer details:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [customerId])

    if (loading) {
        return (
            <div className="px-6 py-8">
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 py-5 bg-slate-50/50">
            <div className="grid grid-cols-3 gap-4">
                {SECTIONS.map((section) => {
                    const Icon = section.icon
                    const isPhase1Report = section.key === 'phase1_report'
                    const isAvailable = isPhase1Report && details?.has_report
                    const isComingSoon = !isPhase1Report

                    return (
                        <div
                            key={section.key}
                            onClick={() => {
                                if (isAvailable) {
                                    router.push(`/admin/customers/${customerId}/report`)
                                }
                            }}
                            className={`
                                relative rounded-xl border p-5 transition-all
                                ${isAvailable
                                    ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer group'
                                    : 'bg-white/60 border-dashed border-slate-200'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`
                                    p-2 rounded-lg
                                    ${isAvailable ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    <Icon className="w-5 h-5" />
                                </div>

                                {isAvailable && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                        <CheckCircle className="w-3 h-3" />
                                        Available
                                    </span>
                                )}
                                {isComingSoon && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                        <Clock className="w-3 h-3" />
                                        Coming Soon
                                    </span>
                                )}
                                {isPhase1Report && !details?.has_report && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                        Not Generated
                                    </span>
                                )}
                            </div>

                            <h4 className={`text-sm font-semibold mb-1 ${isAvailable ? 'text-slate-900' : 'text-slate-400'}`}>
                                {section.title}
                            </h4>

                            {isAvailable && details?.report_generated_at && (
                                <p className="text-[11px] text-slate-500">
                                    Generated {new Date(details.report_generated_at).toLocaleDateString()}
                                </p>
                            )}

                            {isComingSoon && (
                                <p className="text-[11px] text-slate-400">
                                    {section.type === 'form' ? 'Requirements form' : 'Report delivery'}
                                </p>
                            )}

                            {isAvailable && (
                                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
