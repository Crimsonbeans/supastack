'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, ClipboardList, FileBarChart, Loader2, CheckCircle, Clock, Play, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

interface CustomerDetails {
    customer_id: string
    prospect_id: string | null
    company_name: string
    contact_name: string
    contact_email: string
    report_generated_at: string
    has_report: boolean
    req_gen_status: 'not_started' | 'running' | 'completed' | 'failed'
    req_gen_error: string | null
    req_gen_error_details: any
    req_gen_started_at: string | null
    req_gen_questions_count: number
    req_gen_documents_count: number
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
    const [showReqResults, setShowReqResults] = useState(false)
    const [reqResults, setReqResults] = useState<any>(null)
    const [loadingResults, setLoadingResults] = useState(false)

    const fetchDetails = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/customer-details?customer_id=${customerId}`)
            const data = await res.json()
            if (res.ok) setDetails(data)
        } catch (err) {
            console.error('Failed to fetch customer details:', err)
        } finally {
            setLoading(false)
        }
    }, [customerId])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    // Auto-refresh when status is 'triggered' (poll every 5s)
    useEffect(() => {
        if (details?.req_gen_status !== 'running') return
        const interval = setInterval(fetchDetails, 5000)
        return () => clearInterval(interval)
    }, [details?.req_gen_status, fetchDetails])

    const handleGenerateReqs = async () => {
        try {
            const res = await fetch('/api/admin/retry-requirement-gen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: customerId })
            })
            const data = await res.json()
            if (res.ok) {
                // Optimistically set status to running
                setDetails(prev => prev ? { ...prev, req_gen_status: 'running', req_gen_error: null } : prev)
                toast.success('Requirement generation started')
            } else {
                toast.error(data.error || 'Failed to trigger generation')
            }
        } catch (err: any) {
            toast.error('Failed to trigger generation')
        }
    }

    const handleRetry = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await handleGenerateReqs()
    }

    const handleViewResults = async () => {
        if (loadingResults) return
        setShowReqResults(true)
        setLoadingResults(true)
        try {
            const res = await fetch(`/api/admin/requirement-results?customer_id=${customerId}`)
            const data = await res.json()
            if (res.ok) {
                setReqResults(data)
            }
        } catch (err) {
            console.error('Failed to fetch results:', err)
        } finally {
            setLoadingResults(false)
        }
    }

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
                    const isPhase2Reqs = section.key === 'phase2_requirements'
                    const isOtherSection = !isPhase1Report && !isPhase2Reqs

                    // Phase 1 Report
                    if (isPhase1Report) {
                        const isAvailable = details?.has_report
                        return (
                            <div
                                key={section.key}
                                onClick={() => {
                                    if (isAvailable) router.push(`/admin/customers/${customerId}/report`)
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
                                    <div className={`p-2 rounded-lg ${isAvailable ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    {isAvailable && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            <CheckCircle className="w-3 h-3" />
                                            Available
                                        </span>
                                    )}
                                    {!isAvailable && (
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
                                {isAvailable && (
                                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    // Phase 2 Requirements — dynamic status box
                    if (isPhase2Reqs) {
                        const status = details?.req_gen_status || 'not_started'
                        return (
                            <Phase2RequirementsBox
                                key={section.key}
                                status={status}
                                error={details?.req_gen_error ?? null}
                                errorDetails={details?.req_gen_error_details ?? null}
                                startedAt={details?.req_gen_started_at ?? null}
                                questionsCount={details?.req_gen_questions_count || 0}
                                documentsCount={details?.req_gen_documents_count || 0}
                                onGenerate={handleGenerateReqs}
                                onRetry={handleRetry}
                                onViewResults={handleViewResults}
                            />
                        )
                    }

                    // Other sections — Coming Soon
                    return (
                        <div
                            key={section.key}
                            className="relative rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 transition-all"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-slate-100 text-slate-400">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                    <Clock className="w-3 h-3" />
                                    Coming Soon
                                </span>
                            </div>
                            <h4 className="text-sm font-semibold mb-1 text-slate-400">{section.title}</h4>
                            <p className="text-[11px] text-slate-400">
                                {section.type === 'form' ? 'Requirements form' : 'Report delivery'}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Results Modal */}
            {showReqResults && (
                <RequirementResultsModal
                    results={reqResults}
                    loading={loadingResults}
                    onClose={() => { setShowReqResults(false); setReqResults(null) }}
                />
            )}
        </div>
    )
}

function Phase2RequirementsBox({
    status,
    error,
    errorDetails,
    startedAt,
    questionsCount,
    documentsCount,
    onGenerate,
    onRetry,
    onViewResults
}: {
    status: 'not_started' | 'running' | 'completed' | 'failed'
    error: string | null
    errorDetails: any
    startedAt: string | null
    questionsCount: number
    documentsCount: number
    onGenerate: () => void
    onRetry: (e: React.MouseEvent) => void
    onViewResults: () => void
}) {
    const Icon = ClipboardList

    // NOT STARTED — show Generate button
    if (status === 'not_started') {
        return (
            <div className="relative rounded-xl border border-dashed border-slate-200 bg-white/60 p-5 transition-all">
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-400">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        Not Started
                    </span>
                </div>
                <h4 className="text-sm font-semibold mb-2 text-slate-600">Phase 2 Requirements</h4>
                <button
                    onClick={onGenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Play className="w-3.5 h-3.5" />
                    Generate
                </button>
            </div>
        )
    }

    // RUNNING — show Generating with spinner (+ timeout warning after 10min)
    if (status === 'running') {
        const isTimedOut = startedAt && (Date.now() - new Date(startedAt).getTime() > 10 * 60 * 1000)
        return (
            <div className={`relative rounded-xl border p-5 transition-all ${
                isTimedOut ? 'border-amber-200 bg-amber-50/50' : 'border-indigo-200 bg-indigo-50/50'
            }`}>
                <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${isTimedOut ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            isTimedOut ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                            {isTimedOut ? (
                                <>
                                    <AlertTriangle className="w-3 h-3" />
                                    Taking longer than expected
                                </>
                            ) : (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Generating...
                                </>
                            )}
                        </span>
                        {isTimedOut && (
                            <button
                                onClick={onRetry}
                                className="p-1 rounded-md hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors"
                                title="Retry generation"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
                <h4 className="text-sm font-semibold mb-1 text-indigo-900">Phase 2 Requirements</h4>
                <p className="text-[11px] text-indigo-600/70">
                    AI is analyzing dimensions and generating requirements...
                </p>
                {startedAt && (
                    <p className="text-[10px] text-indigo-500/60 mt-1">
                        Started {new Date(startedAt).toLocaleTimeString()}
                    </p>
                )}
            </div>
        )
    }

    // COMPLETED — show Generated, clickable
    if (status === 'completed') {
        return (
            <div
                onClick={onViewResults}
                className="relative rounded-xl border border-green-200 bg-white p-5 transition-all hover:border-green-300 hover:shadow-md cursor-pointer group"
            >
                <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-green-50 text-green-600">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Generated
                    </span>
                </div>
                <h4 className="text-sm font-semibold mb-1 text-slate-900">Phase 2 Requirements</h4>
                <p className="text-[11px] text-slate-500">
                    {questionsCount} questions, {documentsCount} document requests
                </p>
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                </div>
            </div>
        )
    }

    // FAILED — show error + retry
    return (
        <div className="relative rounded-xl border border-red-200 bg-red-50/50 p-5 transition-all">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600">
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Failed
                    </span>
                    <button
                        onClick={onRetry}
                        className="p-1 rounded-md hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors"
                        title="Retry generation"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
            <h4 className="text-sm font-semibold mb-1 text-red-900">Phase 2 Requirements</h4>
            {error && (
                <p className="text-[11px] text-red-600 line-clamp-2" title={error}>
                    {error}
                </p>
            )}
            {errorDetails?.node && (
                <p className="text-[10px] text-red-500/70 mt-0.5">
                    Failed at: {errorDetails.node}
                </p>
            )}
        </div>
    )
}

function RequirementResultsModal({
    results,
    loading,
    onClose
}: {
    results: any
    loading: boolean
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-bold text-slate-900">Generated Requirements</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                            <span className="ml-2 text-slate-500">Loading results...</span>
                        </div>
                    ) : results ? (
                        <div className="space-y-6">
                            {results.questions?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                        Discovery Questions ({results.questions.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {results.questions.map((q: any, i: number) => (
                                            <div key={q.id || i} className="border rounded-lg p-3 bg-slate-50">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                                                        {q.dimension_key || 'general'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-slate-900 font-medium">{q.question_text}</p>
                                                        {q.question_context && (
                                                            <p className="text-xs text-slate-500 mt-1">{q.question_context}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                                                            <span>Format: {q.answer_format}</span>
                                                            <span>Impact: {q.confidence_impact}</span>
                                                            {q.is_required && <span className="text-red-500">Required</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {results.documents?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900 mb-3">
                                        Document Requests ({results.documents.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {results.documents.map((d: any, i: number) => (
                                            <div key={d.id || i} className="border rounded-lg p-3 bg-slate-50">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                                                        {d.dimension_key || 'general'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-slate-900 font-medium">{d.document_type}</p>
                                                        <p className="text-xs text-slate-500 mt-1">{d.document_description}</p>
                                                        {d.why_needed && (
                                                            <p className="text-[10px] text-slate-400 mt-1">Why: {d.why_needed}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(!results.questions?.length && !results.documents?.length) && (
                                <div className="text-center py-8 text-slate-500">
                                    No results found
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Failed to load results
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
