'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
    FileText,
    ClipboardList,
    FileBarChart,
    ChevronLeft,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Lock,
    Play,
    RefreshCw,
    Circle,
    LayoutDashboard,
    User,
    Mail,
    Globe,
    Calendar,
    Briefcase,
    ArrowUpRight,
    Download,
    FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import RequirementsForm from '@/components/admin/RequirementsForm'

// --- Types ---

interface CustomerData {
    id: string
    converted_at: string
    contract_signed_at: string
    contract_type: string | null
    account_manager: string | null
    status: string
    phase: string
    notes: string | null
    organization_id: string
}

interface OrganizationData {
    id: string
    name: string
    domain: string
}

interface ProspectData {
    id: string
    company_name: string
    contact_name: string
    contact_email: string
    created_at: string
    has_report: boolean
    source: string
    qualified_at: string | null
}

interface CustomerDetailClientProps {
    customer: CustomerData
    organization: OrganizationData | null
    prospect: ProspectData | null
    reportHtml: string | null
}

interface DynamicDetails {
    assessment_id: string | null
    req_gen_status: 'not_started' | 'running' | 'completed' | 'failed'
    req_gen_error: string | null
    req_gen_error_details: any
    req_gen_started_at: string | null
    req_gen_questions_count: number
    req_gen_documents_count: number
    requirements_approved_at: string | null
    requirements_approved_by: string | null
    auto_approve_requirements: boolean
    requirements_form_status: string
    requirements_submitted_at: string | null
}

interface UploadedDocItem {
    id: string
    file_name: string
    file_size: number
    file_type: string
    created_at: string
    uploaded_by: string
    download_url?: string | null
}

type SectionKey = 'overview' | 'phase1_report' | 'phase2_requirements' | 'phase2_report_1' | 'phase2_report_2' | 'phase2_report_3' | 'phase2_report_4' | 'phase2_report_5'
type SectionStatus = 'completed' | 'running' | 'failed' | 'not_started' | 'locked'

const JOURNEY_SECTIONS: { key: SectionKey; title: string; icon: any; phase: number }[] = [
    { key: 'phase1_report', title: 'Report', icon: FileText, phase: 1 },
    { key: 'phase2_requirements', title: 'Requirements', icon: ClipboardList, phase: 2 },
    { key: 'phase2_report_1', title: 'Report 1', icon: FileBarChart, phase: 2 },
    { key: 'phase2_report_2', title: 'Report 2', icon: FileBarChart, phase: 2 },
    { key: 'phase2_report_3', title: 'Report 3', icon: FileBarChart, phase: 2 },
    { key: 'phase2_report_4', title: 'Report 4', icon: FileBarChart, phase: 2 },
    { key: 'phase2_report_5', title: 'Report 5', icon: FileBarChart, phase: 2 },
]

// --- Main Component ---

export default function CustomerDetailClient({
    customer,
    organization,
    prospect,
    reportHtml,
}: CustomerDetailClientProps) {
    const [activeSection, setActiveSection] = useState<SectionKey>('overview')
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [dynamicDetails, setDynamicDetails] = useState<DynamicDetails | null>(null)
    const [reqResults, setReqResults] = useState<any>(null)
    const [loadingResults, setLoadingResults] = useState(false)

    const fetchDynamic = useCallback(async () => {
        try {
            const res = await fetch(`/api/admin/customer-details?customer_id=${customer.id}`)
            const data = await res.json()
            if (res.ok) {
                setDynamicDetails({
                    assessment_id: data.assessment_id,
                    req_gen_status: data.req_gen_status,
                    req_gen_error: data.req_gen_error,
                    req_gen_error_details: data.req_gen_error_details,
                    req_gen_started_at: data.req_gen_started_at,
                    req_gen_questions_count: data.req_gen_questions_count,
                    req_gen_documents_count: data.req_gen_documents_count,
                    requirements_approved_at: data.requirements_approved_at,
                    requirements_approved_by: data.requirements_approved_by,
                    auto_approve_requirements: data.auto_approve_requirements,
                    requirements_form_status: data.requirements_form_status,
                    requirements_submitted_at: data.requirements_submitted_at,
                })
            }
        } catch { /* silent */ }
    }, [customer.id])

    useEffect(() => { fetchDynamic() }, [fetchDynamic])

    useEffect(() => {
        if (dynamicDetails?.req_gen_status !== 'running') return
        const interval = setInterval(fetchDynamic, 5000)
        return () => clearInterval(interval)
    }, [dynamicDetails?.req_gen_status, fetchDynamic])

    useEffect(() => {
        if (activeSection !== 'phase2_requirements') return
        if (dynamicDetails?.req_gen_status !== 'completed') return
        if (reqResults) return
        setLoadingResults(true)
        fetch(`/api/admin/requirement-results?customer_id=${customer.id}`)
            .then(res => res.json())
            .then(data => setReqResults(data))
            .catch(() => {})
            .finally(() => setLoadingResults(false))
    }, [activeSection, dynamicDetails?.req_gen_status, reqResults, customer.id])

    const handleGenerateReqs = async () => {
        try {
            const res = await fetch('/api/admin/retry-requirement-gen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: customer.id }),
            })
            const data = await res.json()
            if (res.ok) {
                setDynamicDetails(prev => prev
                    ? { ...prev, req_gen_status: 'running', req_gen_error: null, req_gen_started_at: new Date().toISOString() }
                    : null
                )
                toast.success('Requirement generation started')
            } else {
                toast.error(data.error || 'Failed to trigger generation')
            }
        } catch {
            toast.error('Failed to trigger generation')
        }
    }

    const getSectionStatus = (key: SectionKey): SectionStatus => {
        if (key === 'overview') return 'completed'
        if (key === 'phase1_report') return prospect?.has_report ? 'completed' : 'not_started'
        if (key === 'phase2_requirements') return dynamicDetails?.req_gen_status || 'not_started'
        return 'locked'
    }

    const companyName = organization?.name || prospect?.company_name || 'Unknown'

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <header className="shrink-0 bg-white border-b border-slate-200">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/customers"
                            className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Customers
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900">{companyName}</h1>
                            <p className="text-xs text-slate-500">
                                {prospect?.contact_name}
                                {organization?.domain && <> &middot; {organization.domain}</>}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        {customer.account_manager && (
                            <>
                                <span>AM: {customer.account_manager}</span>
                                <div className="h-4 w-px bg-slate-200" />
                            </>
                        )}
                        <span>Converted {new Date(customer.converted_at).toLocaleDateString()}</span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            customer.status === 'active' ? 'bg-green-100 text-green-700' :
                            customer.status === 'churned' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {customer.status}
                        </span>
                    </div>
                </div>
            </header>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Sidebar wrapper */}
                <div className={`shrink-0 relative z-10 transition-all duration-300 ${sidebarCollapsed ? 'w-[52px]' : 'w-[240px]'}`}>
                    {/* Drawer handle */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 w-7 h-12 flex-col items-center justify-center gap-[3px] bg-slate-100 border border-slate-300 border-l-0 rounded-r-lg cursor-pointer hover:bg-slate-200 transition-colors group"
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        <span className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-slate-500 group-hover:text-slate-700 transition-colors">
                            <path
                                d={sidebarCollapsed ? "M2.5 1 L5.5 4 L2.5 7" : "M5.5 1 L2.5 4 L5.5 7"}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span className="w-1 h-1 rounded-full bg-slate-400 group-hover:bg-slate-600 transition-colors" />
                    </button>

                    <aside className="h-full bg-white border-r border-slate-200 overflow-y-auto">
                    {/* Overview */}
                    <div className={`${sidebarCollapsed ? 'px-1' : 'px-3'} pt-4 pb-1`}>
                        <button
                            onClick={() => setActiveSection('overview')}
                            title={sidebarCollapsed ? 'Overview' : undefined}
                            className={`
                                w-full flex items-center gap-3 py-2 rounded-lg text-left transition-all cursor-pointer
                                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
                                ${activeSection === 'overview'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-slate-600 hover:bg-slate-50'
                                }
                            `}
                        >
                            <div className="shrink-0 w-5 flex justify-center">
                                <LayoutDashboard className={`w-[18px] h-[18px] ${activeSection === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`} />
                            </div>
                            {!sidebarCollapsed && (
                                <span className={`text-[13px] font-medium ${activeSection === 'overview' ? 'text-indigo-700' : 'text-slate-700'}`}>
                                    Overview
                                </span>
                            )}
                        </button>
                    </div>

                    <div className={`my-2 border-t border-slate-100 ${sidebarCollapsed ? 'mx-2' : 'mx-4'}`} />

                    {/* Phase 1 */}
                    <div className={`pb-2 ${sidebarCollapsed ? 'px-2' : 'px-5'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest text-slate-400 ${sidebarCollapsed ? 'hidden' : ''}`}>Phase 1</span>
                        {sidebarCollapsed && <span className="text-[9px] font-bold text-slate-400 block text-center">P1</span>}
                    </div>
                    <nav className={`${sidebarCollapsed ? 'px-1' : 'px-3'} space-y-0.5`}>
                        {JOURNEY_SECTIONS.filter(s => s.phase === 1).map(section => (
                            <SidebarItem
                                key={section.key}
                                section={section}
                                status={getSectionStatus(section.key)}
                                isActive={activeSection === section.key}
                                dynamicDetails={dynamicDetails}
                                prospect={prospect}
                                collapsed={sidebarCollapsed}
                                onClick={() => setActiveSection(section.key)}
                            />
                        ))}
                    </nav>

                    {/* Phase 2 */}
                    <div className={`pt-6 pb-2 ${sidebarCollapsed ? 'px-2' : 'px-5'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest text-slate-400 ${sidebarCollapsed ? 'hidden' : ''}`}>Phase 2</span>
                        {sidebarCollapsed && <span className="text-[9px] font-bold text-slate-400 block text-center">P2</span>}
                    </div>
                    <nav className={`${sidebarCollapsed ? 'px-1' : 'px-3'} pb-5 space-y-0.5`}>
                        {JOURNEY_SECTIONS.filter(s => s.phase === 2).map(section => (
                            <SidebarItem
                                key={section.key}
                                section={section}
                                status={getSectionStatus(section.key)}
                                isActive={activeSection === section.key}
                                dynamicDetails={dynamicDetails}
                                prospect={prospect}
                                collapsed={sidebarCollapsed}
                                onClick={() => getSectionStatus(section.key) !== 'locked' && setActiveSection(section.key)}
                            />
                        ))}
                    </nav>
                    </aside>
                </div>

                {/* Content */}
                <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-white">
                    {activeSection === 'overview' && (
                        <div className="flex-1 overflow-y-auto">
                            <OverviewContent
                                customer={customer}
                                organization={organization}
                                prospect={prospect}
                                dynamicDetails={dynamicDetails}
                            />
                        </div>
                    )}
                    {activeSection === 'phase1_report' && (
                        <Phase1ReportContent
                            reportHtml={reportHtml}
                            hasReport={prospect?.has_report || false}
                            generatedAt={prospect?.created_at || null}
                        />
                    )}
                    {activeSection === 'phase2_requirements' && (
                        <div className="flex-1 overflow-y-auto">
                            <Phase2RequirementsContent
                                status={dynamicDetails?.req_gen_status || 'not_started'}
                                error={dynamicDetails?.req_gen_error || null}
                                errorDetails={dynamicDetails?.req_gen_error_details}
                                startedAt={dynamicDetails?.req_gen_started_at || null}
                                questionsCount={dynamicDetails?.req_gen_questions_count || 0}
                                documentsCount={dynamicDetails?.req_gen_documents_count || 0}
                                results={reqResults}
                                loadingResults={loadingResults}
                                onGenerate={handleGenerateReqs}
                                onRetry={handleGenerateReqs}
                                customerId={customer.id}
                                approvedAt={dynamicDetails?.requirements_approved_at || null}
                                approvedBy={dynamicDetails?.requirements_approved_by || null}
                                formStatus={dynamicDetails?.requirements_form_status || 'draft'}
                                onApproved={fetchDynamic}
                                contactEmail={prospect?.contact_email || null}
                                onRefresh={() => { setReqResults(null); fetchDynamic() }}
                            />
                        </div>
                    )}
                    {activeSection.startsWith('phase2_report_') && (
                        <div className="flex-1 overflow-y-auto">
                            <LockedSectionContent
                                title={JOURNEY_SECTIONS.find(s => s.key === activeSection)?.title || ''}
                            />
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

// --- Sidebar Item ---

function SidebarItem({
    section,
    status,
    isActive,
    dynamicDetails,
    prospect,
    collapsed,
    onClick,
}: {
    section: (typeof JOURNEY_SECTIONS)[number]
    status: SectionStatus
    isActive: boolean
    dynamicDetails: DynamicDetails | null
    prospect: ProspectData | null
    collapsed: boolean
    onClick: () => void
}) {
    const isLocked = status === 'locked'

    return (
        <button
            onClick={onClick}
            disabled={isLocked}
            title={collapsed ? section.title : undefined}
            className={`
                w-full flex items-center gap-3 py-2 rounded-lg text-left transition-all
                ${collapsed ? 'justify-center px-0' : 'px-3'}
                ${isActive
                    ? 'bg-indigo-50 text-indigo-700 cursor-pointer'
                    : isLocked
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-50 cursor-pointer'
                }
            `}
        >
            {/* Status dot / icon */}
            <div className="shrink-0 w-5 flex justify-center">
                {status === 'completed' ? (
                    <CheckCircle className={`w-[18px] h-[18px] ${isActive ? 'text-indigo-600' : 'text-green-500'}`} />
                ) : status === 'running' ? (
                    <Loader2 className="w-[18px] h-[18px] text-indigo-500 animate-spin" />
                ) : status === 'failed' ? (
                    <AlertTriangle className="w-[18px] h-[18px] text-red-500" />
                ) : isLocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-300" />
                ) : (
                    <Circle className={`w-[18px] h-[18px] ${isActive ? 'text-indigo-400' : 'text-slate-300'}`} />
                )}
            </div>

            {/* Text — hidden when collapsed */}
            {!collapsed && (
                <div className="flex-1 min-w-0">
                    <span className={`text-[13px] font-medium leading-tight block ${
                        isActive ? 'text-indigo-700' :
                        isLocked ? 'text-slate-400' : 'text-slate-700'
                    }`}>
                        {section.title}
                    </span>
                    <SidebarSubtext sectionKey={section.key} status={status} dynamicDetails={dynamicDetails} prospect={prospect} />
                </div>
            )}
        </button>
    )
}

function SidebarSubtext({
    sectionKey,
    status,
    dynamicDetails,
    prospect,
}: {
    sectionKey: SectionKey
    status: string
    dynamicDetails: DynamicDetails | null
    prospect: ProspectData | null
}) {
    if (sectionKey === 'phase1_report' && status === 'completed' && prospect?.created_at) {
        return <span className="text-[10px] text-slate-500 block">{new Date(prospect.created_at).toLocaleDateString()}</span>
    }
    if (sectionKey === 'phase2_requirements') {
        if (status === 'completed' && dynamicDetails) {
            return <span className="text-[10px] text-green-600 block">{dynamicDetails.req_gen_questions_count} questions generated</span>
        }
        if (status === 'running') {
            return <span className="text-[10px] text-indigo-500 block">Generating...</span>
        }
        if (status === 'failed') {
            return <span className="text-[10px] text-red-500 block">Failed</span>
        }
    }
    return null
}

// --- Overview Content ---

interface JourneyStage {
    title: string
    status: 'completed' | 'active' | 'upcoming' | 'locked'
    date?: string | null
    subtitle?: string
}

function OverviewContent({
    customer,
    organization,
    prospect,
    dynamicDetails,
}: {
    customer: CustomerData
    organization: OrganizationData | null
    prospect: ProspectData | null
    dynamicDetails: DynamicDetails | null
}) {
    const companyName = organization?.name || prospect?.company_name || 'Unknown'
    const reqStatus = dynamicDetails?.req_gen_status || 'not_started'

    const stages: JourneyStage[] = [
        {
            title: 'Prospect',
            subtitle: prospect?.source === 'inbound' ? 'Inbound Inquiry' : 'Outbound',
            status: 'completed',
            date: prospect?.created_at,
        },
        {
            title: 'Qualified',
            subtitle: 'Signed up & verified',
            status: 'completed',
            date: prospect?.qualified_at,
        },
        {
            title: 'Phase 1 Report',
            subtitle: 'AI readiness assessment',
            status: prospect?.has_report ? 'completed' : 'upcoming',
            date: prospect?.has_report ? prospect?.created_at : null,
        },
        {
            title: 'Customer',
            subtitle: 'Converted to active customer',
            status: 'completed',
            date: customer.converted_at,
        },
        {
            title: 'Requirements Generated',
            subtitle: 'Phase 2 discovery questions',
            status: reqStatus === 'completed' ? 'completed'
                : reqStatus === 'running' ? 'active'
                : reqStatus === 'failed' ? 'active'
                : 'upcoming',
            date: reqStatus === 'completed' ? dynamicDetails?.req_gen_started_at : null,
        },
        {
            title: 'Requirements Approved',
            subtitle: dynamicDetails?.requirements_approved_by === 'auto'
                ? 'Auto-approved on generation'
                : dynamicDetails?.requirements_approved_at ? 'Manually approved by admin' : 'Pending admin approval',
            status: dynamicDetails?.requirements_approved_at ? 'completed'
                : reqStatus === 'completed' ? 'upcoming'
                : 'locked',
            date: dynamicDetails?.requirements_approved_at || null,
        },
        {
            title: 'Requirements Submitted',
            subtitle: 'Customer responses for Report 1',
            status: dynamicDetails?.requirements_form_status === 'completed' ? 'completed'
                : dynamicDetails?.requirements_approved_at ? 'upcoming'
                : 'locked',
            date: dynamicDetails?.requirements_submitted_at || null,
        },
        { title: 'Report 1', subtitle: 'Phase 2', status: 'locked' },
        { title: 'Report 2', subtitle: 'Phase 2', status: 'locked' },
        { title: 'Report 3', subtitle: 'Phase 2', status: 'locked' },
        { title: 'Report 4', subtitle: 'Phase 2', status: 'locked' },
        { title: 'Report 5', subtitle: 'Phase 2', status: 'locked' },
    ]

    return (
        <div className="p-6 max-w-3xl">
            {/* Customer Details Card */}
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Customer Details</h2>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                        <DetailItem icon={Briefcase} label="Company" value={companyName} />
                        <DetailItem icon={Globe} label="Domain" value={organization?.domain || '—'} />
                        <DetailItem icon={User} label="Contact" value={prospect?.contact_name || '—'} />
                        <DetailItem icon={Mail} label="Email" value={prospect?.contact_email || '—'} />
                        <DetailItem icon={User} label="Account Manager" value={customer.account_manager || '—'} />
                        <DetailItem icon={Calendar} label="Converted" value={new Date(customer.converted_at).toLocaleDateString()} />
                        {customer.contract_type && (
                            <DetailItem icon={FileText} label="Contract" value={customer.contract_type} />
                        )}
                        <div className="flex items-start gap-2.5">
                            <div className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">Source</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                    prospect?.source === 'inbound'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {prospect?.source === 'inbound' ? 'Inbound' : 'Outbound'}
                                    <ArrowUpRight className="w-3 h-3 ml-0.5" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Uploaded Documents */}
            {dynamicDetails?.assessment_id && (
                <DocumentsOverviewPanel assessmentId={dynamicDetails.assessment_id} />
            )}

            {/* Journey Timeline */}
            <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Customer Journey</h2>
                <div className="relative">
                    {stages.map((stage, i) => {
                        const isLast = i === stages.length - 1
                        return (
                            <div key={i} className="flex gap-4 relative">
                                {/* Vertical line */}
                                {!isLast && (
                                    <div className={`absolute left-[11px] top-[26px] w-px bottom-0 ${
                                        stage.status === 'completed' ? 'bg-green-200' :
                                        stage.status === 'active' ? 'bg-indigo-200' :
                                        'bg-slate-200'
                                    }`} />
                                )}

                                {/* Dot */}
                                <div className="shrink-0 w-[23px] flex justify-center pt-[5px] relative z-10">
                                    {stage.status === 'completed' ? (
                                        <div className="w-[22px] h-[22px] rounded-full bg-green-500 flex items-center justify-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    ) : stage.status === 'active' ? (
                                        <div className="w-[22px] h-[22px] rounded-full bg-indigo-500 flex items-center justify-center ring-4 ring-indigo-100">
                                            {dynamicDetails?.req_gen_status === 'running' ? (
                                                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                            ) : dynamicDetails?.req_gen_status === 'failed' ? (
                                                <AlertTriangle className="w-3.5 h-3.5 text-white" />
                                            ) : (
                                                <Circle className="w-3 h-3 text-white" />
                                            )}
                                        </div>
                                    ) : stage.status === 'upcoming' ? (
                                        <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-300 bg-white" />
                                    ) : (
                                        <div className="w-[22px] h-[22px] rounded-full border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <Lock className="w-2.5 h-2.5 text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-[13px] font-medium ${
                                            stage.status === 'completed' ? 'text-slate-900' :
                                            stage.status === 'active' ? 'text-indigo-700' :
                                            stage.status === 'upcoming' ? 'text-slate-500' :
                                            'text-slate-400'
                                        }`}>
                                            {stage.title}
                                        </span>
                                        {stage.date && (
                                            <span className="text-[11px] text-slate-400">
                                                {new Date(stage.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    {stage.subtitle && (
                                        <span className={`text-[11px] block mt-0.5 ${
                                            stage.status === 'completed' ? 'text-slate-500' :
                                            stage.status === 'active' ? 'text-indigo-500' :
                                            'text-slate-400'
                                        }`}>
                                            {stage.subtitle}
                                            {stage.title === 'Requirements Generated' && dynamicDetails?.req_gen_status === 'running' && (
                                                <> &middot; Generating...</>
                                            )}
                                            {stage.title === 'Requirements Generated' && dynamicDetails?.req_gen_status === 'failed' && (
                                                <> &middot; <span className="text-red-500">Failed</span></>
                                            )}
                                            {stage.title === 'Requirements Generated' && dynamicDetails?.req_gen_status === 'completed' && dynamicDetails.req_gen_questions_count > 0 && (
                                                <> &middot; {dynamicDetails.req_gen_questions_count} questions</>
                                            )}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function DetailItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
            <div className="min-w-0">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">{label}</span>
                <span className="text-[13px] text-slate-900 block truncate">{value}</span>
            </div>
        </div>
    )
}

// --- Content Panels ---

function Phase1ReportContent({
    reportHtml,
    hasReport,
    generatedAt,
}: {
    reportHtml: string | null
    hasReport: boolean
    generatedAt: string | null
}) {
    if (!hasReport || !reportHtml) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No Report Available</h3>
                    <p className="text-sm text-slate-500">Phase 1 report has not been generated.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-2.5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Phase 1 Report</h2>
                    {generatedAt && (
                        <span className="text-[11px] text-slate-500">
                            Generated {new Date(generatedAt).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </div>
            <iframe
                srcDoc={reportHtml}
                className="flex-1 w-full border-0"
                title="Phase 1 Report"
                sandbox="allow-same-origin"
            />
        </div>
    )
}

function Phase2RequirementsContent({
    status,
    error,
    errorDetails,
    startedAt,
    questionsCount,
    documentsCount,
    results,
    loadingResults,
    onGenerate,
    onRetry,
    customerId,
    approvedAt,
    approvedBy,
    formStatus,
    onApproved,
    contactEmail,
    onRefresh,
}: {
    status: 'not_started' | 'running' | 'completed' | 'failed'
    error: string | null
    errorDetails: any
    startedAt: string | null
    questionsCount: number
    documentsCount: number
    results: any
    loadingResults: boolean
    onGenerate: () => void
    onRetry: () => void
    customerId: string
    approvedAt: string | null
    approvedBy: string | null
    formStatus: string
    onApproved: () => void
    contactEmail: string | null
    onRefresh: () => void
}) {
    const [showApproveDialog, setShowApproveDialog] = useState(false)
    const [approving, setApproving] = useState(false)
    const [editMode, setEditMode] = useState(false)

    if (status === 'not_started') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <ClipboardList className="w-7 h-7 text-slate-400" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Requirements Not Generated</h3>
                    <p className="text-sm text-slate-500 mb-5">
                        Generate AI-powered discovery questions based on Phase 1 analysis.
                    </p>
                    <button
                        onClick={onGenerate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                    >
                        <Play className="w-4 h-4" />
                        Generate Requirements
                    </button>
                </div>
            </div>
        )
    }

    if (status === 'running') {
        const isTimedOut = startedAt && (Date.now() - new Date(startedAt).getTime() > 10 * 60 * 1000)
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        isTimedOut ? 'bg-amber-100' : 'bg-indigo-50'
                    }`}>
                        {isTimedOut
                            ? <AlertTriangle className="w-7 h-7 text-amber-500" />
                            : <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
                        }
                    </div>
                    <h3 className={`text-base font-semibold mb-1 ${isTimedOut ? 'text-amber-900' : 'text-slate-900'}`}>
                        {isTimedOut ? 'Taking Longer Than Expected' : 'Generating Requirements...'}
                    </h3>
                    <p className="text-sm text-slate-500 mb-1">
                        AI is analyzing dimensions and generating discovery questions.
                    </p>
                    {startedAt && (
                        <p className="text-xs text-slate-400">
                            Started {new Date(startedAt).toLocaleTimeString()}
                        </p>
                    )}
                    {isTimedOut && (
                        <button
                            onClick={onRetry}
                            className="mt-4 inline-flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-800 font-medium cursor-pointer"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry
                        </button>
                    )}
                </div>
            </div>
        )
    }

    if (status === 'failed') {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-sm">
                    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-base font-semibold text-red-900 mb-1">Generation Failed</h3>
                    {error && <p className="text-sm text-red-600 mb-1">{error}</p>}
                    {errorDetails?.node && (
                        <p className="text-xs text-red-500/70 mb-4">Failed at: {errorDetails.node}</p>
                    )}
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Retry Generation
                    </button>
                </div>
            </div>
        )
    }

    // COMPLETED
    if (loadingResults) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="ml-2 text-sm text-slate-500">Loading requirements...</span>
            </div>
        )
    }

    if (!results || !results.questions?.length) {
        return (
            <div className="text-center py-16 text-slate-500 text-sm">No results found</div>
        )
    }

    const handleApproveConfirm = async () => {
        setApproving(true)
        try {
            const res = await fetch('/api/admin/approve-requirements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: customerId }),
            })
            if (res.ok) {
                toast.success('Requirements approved successfully')
                setShowApproveDialog(false)
                onApproved()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to approve')
            }
        } catch {
            toast.error('Failed to approve requirements')
        } finally {
            setApproving(false)
        }
    }

    // Admin: readOnly unless editMode is enabled (and requirements are approved)
    const adminReadOnly = !approvedAt || !editMode

    return (
        <>
            <RequirementsForm
                questions={results.questions}
                documents={results.documents || []}
                assessmentId={results.assessment_id}
                mode="admin"
                formStatus={formStatus as any}
                readOnly={adminReadOnly}
                approvalInfo={approvedAt ? { approved_at: approvedAt, approved_by: approvedBy || 'manual' } : null}
                onApprove={!approvedAt ? () => setShowApproveDialog(true) : undefined}
                onRefresh={onRefresh}
                editMode={editMode}
                onToggleEditMode={approvedAt ? () => setEditMode(prev => !prev) : undefined}
            />

            {/* Approve Confirmation Dialog */}
            {showApproveDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !approving && setShowApproveDialog(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">Approve Requirements</h3>
                        <p className="text-sm text-slate-600 text-center leading-relaxed mb-1">
                            Are you sure you want to approve these requirements?
                        </p>
                        <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                            Once approved, a notification will be sent to{' '}
                            <span className="font-medium text-slate-700">{contactEmail || 'the customer'}</span>{' '}
                            confirming that their requirements are ready for review.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApproveDialog(false)}
                                disabled={approving}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveConfirm}
                                disabled={approving}
                                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {approving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    'Yes, Approve'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}


// --- Documents Overview Panel (for admin overview) ---

function DocumentsOverviewPanel({ assessmentId }: { assessmentId: string }) {
    const [documents, setDocuments] = useState<Record<string, UploadedDocItem[]>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/list-documents?assessment_id=${assessmentId}&mode=admin`)
            .then(res => res.json())
            .then(data => {
                if (data.documents) setDocuments(data.documents)
            })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [assessmentId])

    const allDocs = Object.entries(documents).flatMap(([slotKey, docs]) =>
        docs.map(d => ({ ...d, slotKey }))
    )

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (loading) {
        return (
            <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">Uploaded Documents</h2>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="ml-2 text-sm text-slate-400">Loading documents...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Uploaded Documents</h2>
                <span className="text-[11px] text-slate-400">{allDocs.length} file{allDocs.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                {allDocs.length === 0 ? (
                    <div className="p-5 text-center">
                        <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No documents uploaded yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {allDocs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        {doc.download_url ? (
                                            <a
                                                href={doc.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[12px] text-indigo-600 hover:text-indigo-700 truncate block underline decoration-indigo-200 hover:decoration-indigo-400"
                                            >
                                                {doc.file_name}
                                            </a>
                                        ) : (
                                            <span className="text-[12px] text-slate-700 truncate block">{doc.file_name}</span>
                                        )}
                                        <span className="text-[10px] text-slate-400">
                                            {formatFileSize(doc.file_size)} &middot; {new Date(doc.created_at).toLocaleDateString()}
                                            {doc.slotKey === '__other__' ? ' &middot; Other' : ''}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                                        doc.uploaded_by === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {doc.uploaded_by}
                                    </span>
                                    {doc.download_url && (
                                        <a
                                            href={doc.download_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                                        >
                                            <Download className="w-3.5 h-3.5 text-slate-400" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function LockedSectionContent({ title }: { title: string }) {
    return (
        <div className="flex flex-col h-full">
            {/* Header — same style as Phase1ReportContent */}
            <div className="shrink-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-2.5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="w-3 h-3" /> Locked
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                        <FileBarChart className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-5">
                        This report will be generated once the preceding steps are completed.
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-[12px] text-slate-500 font-medium">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Available after requirements are submitted
                    </div>
                </div>
            </div>
        </div>
    )
}
