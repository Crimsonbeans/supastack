import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CustomerReportPage({ params }: PageProps) {
    const { id } = await params
    const supabase = supabaseAdmin

    // Fetch customer with prospect data including report HTML
    const { data: customer, error } = await supabase
        .from('customers')
        .select(`
            id,
            converted_at,
            contract_signed_at,
            status,
            phase,
            organization:organizations(id, name, domain),
            prospect:prospects(
                id,
                company_name,
                contact_name,
                contact_email,
                report_html,
                created_at
            )
        `)
        .eq('id', id)
        .single()

    if (error || !customer) return notFound()

    const org = customer.organization as any
    const prospect = customer.prospect as any
    const reportHtml = prospect?.report_html

    if (!reportHtml) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold text-slate-900 mb-2">No Report Available</h2>
                    <p className="text-sm text-slate-500 mb-4">Phase 1 report has not been generated for this customer.</p>
                    <Link
                        href={`/admin/customers?expand=${id}`}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                        Back to Customers
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Customer Summary Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link
                            href={`/admin/customers?expand=${id}`}
                            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back to Customers
                        </Link>
                        <div className="h-5 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-sm font-semibold text-slate-900">
                                {org?.name || prospect?.company_name || 'Unknown'}
                            </h1>
                            <p className="text-xs text-slate-500">
                                {prospect?.contact_name} &middot; {prospect?.contact_email}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Phase 1 Report</span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span>Generated {new Date(prospect?.created_at).toLocaleDateString()}</span>
                        <div className="h-4 w-px bg-slate-200" />
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            {(customer.status as string)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div
                className="report-content"
                dangerouslySetInnerHTML={{ __html: reportHtml }}
            />
        </div>
    )
}
