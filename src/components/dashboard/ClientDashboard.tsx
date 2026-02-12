'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Loader2, Link as LinkIcon, Building2, Plus, ArrowRight, Sparkles, CheckCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ReportData = {
    id: string
    company_name: string
    webscan_type: string
    report_html?: string | null
    status: string
}

type UserData = {
    name: string
    email: string
    companyName?: string
    domain?: string
}

export default function ClientDashboard({ loading, report, error, userData, userOrganizationId }: {
    loading?: boolean
    report?: ReportData | null
    error?: string,
    userData?: UserData
    userOrganizationId?: string
}) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [formData, setFormData] = useState({
        company_name: userData?.companyName || '',
        company_domain: userData?.domain || '',
        webscan_type: 'GTM AI Readiness',
        contact_name: userData?.name || '',
        contact_email: userData?.email || '',
        contact_linkedin: ''
    })

    const router = useRouter()
    const supabase = createClient()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Auto-refresh logic: Poll for status updates if report is generating
    useEffect(() => {
        let intervalId: NodeJS.Timeout

        if (report && (report.status === 'pending' || report.status === 'processing')) {
            intervalId = setInterval(async () => {
                const { data: updatedReport } = await supabase
                    .from('prospects')
                    .select('*')
                    .eq('id', report.id)
                    .single()

                if (updatedReport && updatedReport.status !== report.status) {
                    router.refresh() // Refresh server components if any
                    // Ideally we should also update local state if we had a setReport, but here 'report' prop might be static unless we refactor.
                    // Since 'report' is likely passed as a prop from a server component page, router.refresh() is the correct valid way to re-fetch the server data.
                    // HOWEVER, ClientDashboard receives 'report' as a prop. To update it, we need local state initialized from props.
                }
            }, 5000)
        }

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [report, supabase, router])

    // If status is 'new_inquiry', treat as if report needs to be GENERATED (updated)
    const showGenerateForm = !report || report.status === 'new_inquiry'

    const handleGenerateReport = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)

        try {
            let error;
            let prospectId = report?.id

            if (report && report.id) {
                // UPDATE existing "new_inquiry" prospect
                const { error: updateError } = await supabase
                    .from('prospects')
                    .update({
                        company_name: formData.company_name,
                        company_domain: formData.company_domain,
                        webscan_type: formData.webscan_type,
                        contact_name: formData.contact_name,
                        contact_email: formData.contact_email,
                        contact_linkedin: formData.contact_linkedin || null,
                        status: 'pending', // Triggers generation
                        // source remains 'inbound' or 'outbound' as set by trigger
                    })
                    .eq('id', report.id)
                error = updateError
            } else {
                // INSERT new (fallback)
                const { data: newProspect, error: insertError } = await supabase
                    .from('prospects')
                    .insert([{
                        company_name: formData.company_name,
                        company_domain: formData.company_domain,
                        webscan_type: formData.webscan_type,
                        contact_name: formData.contact_name,
                        contact_email: formData.contact_email,
                        contact_linkedin: formData.contact_linkedin || null,
                        status: 'pending',
                        source: 'inbound',
                        confidence_score: 0,
                        organization_id: userOrganizationId
                    }])
                    .select()
                    .single()

                error = insertError
                if (newProspect) prospectId = newProspect.id
            }

            if (error) throw error

            // Trigger Scan via API
            if (prospectId) {
                await fetch('/api/execute-scans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prospectIds: [prospectId] }),
                })
            }

            router.refresh()

        } catch (err: any) {
            console.error('Error creating report request:', err)
            alert('Failed to submit report request. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-red-100 p-3 text-red-500">
                    <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Unable to load report</h3>
                <p className="max-w-sm text-sm text-gray-500">{error}</p>
            </div>
        )
    }

    if (showGenerateForm) {
        return (
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Generate Your First Report</h1>
                    <p className="text-gray-500 max-w-lg mx-auto">
                        To get started, please confirm your company details. Our AI will analyze your digital footprint and generate a comprehensive readiness report.
                    </p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8">
                    <form onSubmit={handleGenerateReport} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Company Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="company_name"
                                    value={formData.company_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    placeholder="e.g. Acme Corp"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Company Domain <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="company_domain"
                                    value={formData.company_domain}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                    placeholder="e.g. acme.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Scan Type
                                </label>
                                <select
                                    name="webscan_type"
                                    value={formData.webscan_type}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                >
                                    <option value="GTM AI Readiness">GTM AI Readiness</option>
                                    <option value="Partnership Readiness">Partnership Readiness</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    LinkedIn Profile
                                </label>
                                <input
                                    name="contact_linkedin"
                                    value={formData.contact_linkedin}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="https://linkedin.com/in/..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Contact Name
                                </label>
                                <input
                                    name="contact_name"
                                    value={formData.contact_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    readOnly // Auto-filled from profile, maybe editable? Let keeps editable if needed, but per request "autofilled"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Contact Email
                                </label>
                                <input
                                    name="contact_email"
                                    type="email"
                                    value={formData.contact_email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                                {isGenerating ? 'Initiating Scan...' : 'Generate Report'}
                                {!isGenerating && <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Report</h1>
                    <p className="text-sm text-gray-500">
                        {report.webscan_type} for {report.company_name}
                    </p>
                </div>
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium border
                    ${report.status === 'completed'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                >
                    {report.status.toUpperCase()}
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-12 text-center">
                {report.status === 'completed' ? (
                    <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Success Icon */}
                        <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center ring-8 ring-green-50 shadow-sm">
                            <CheckCircle className="w-10 h-10" />
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Congratulations!
                            </h2>
                            <p className="text-gray-500 text-lg leading-relaxed">
                                Your comprehensive <strong>{report.webscan_type}</strong> report is ready to view. We've analyzed your company data successfully.
                            </p>
                        </div>

                        <div className="pt-4">
                            <a
                                href={`/report/${report.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-1 hover:shadow-xl group"
                            >
                                <FileText className="w-6 h-6" />
                                View Full Report
                                <ExternalLink className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto space-y-10 py-8 animate-in fade-in duration-1000 relative">
                        {/* Magic Loading Icon with Ripple Effect */}
                        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                            {/* Outer Ripples */}
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute inset-4 bg-blue-500/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_200ms]"></div>
                            <div className="absolute inset-8 bg-blue-600/20 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_400ms]"></div>

                            {/* Core Icon */}
                            <div className="relative w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center ring-4 ring-blue-50 shadow-xl z-10">
                                <Sparkles className="w-10 h-10 text-blue-600 animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center justify-center gap-1">
                                Magic is happening
                                <span className="flex gap-1 ml-1">
                                    <span className="animate-[bounce_1.4s_infinite] delay-0">.</span>
                                    <span className="animate-[bounce_1.4s_infinite_200ms] delay-200">.</span>
                                    <span className="animate-[bounce_1.4s_infinite_400ms] delay-400">.</span>
                                </span>
                            </h3>
                            <p className="text-gray-500 text-lg leading-relaxed">
                                Now you can sit back. We are analyzing your digital footprint and generating your report.
                            </p>
                            <p className="text-xs text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full inline-block animate-pulse">
                                We will notify you via email once the report is ready!
                            </p>
                        </div>

                        {/* Enhanced Progress Bar */}
                        {/* Enhanced Progress Bar */}
                        <div className="pt-4 max-w-xs mx-auto space-y-2">
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden relative">
                                <div className="h-full w-[60%] bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full relative overflow-hidden animate-pulse">
                                    <div className="absolute inset-0 bg-white/40 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 font-mono animate-pulse">PROCESSING DATA...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
