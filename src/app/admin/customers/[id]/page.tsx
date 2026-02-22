import { supabaseAdmin } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import CustomerDetailClient from '@/components/admin/CustomerDetailClient'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = supabaseAdmin

    // Fetch customer with all related data
    const { data: customer, error } = await supabase
        .from('customers')
        .select(`
            id,
            converted_at,
            contract_signed_at,
            contract_type,
            account_manager,
            status,
            phase,
            notes,
            organization_id,
            organization:organizations(id, name, domain),
            prospect:prospects(
                id,
                company_name,
                contact_name,
                contact_email,
                report_html,
                report_html_public,
                created_at,
                source,
                qualified_at
            )
        `)
        .eq('id', id)
        .single()

    if (error || !customer) return notFound()

    const org = customer.organization as any
    const prospect = customer.prospect as any

    return (
        <CustomerDetailClient
            customer={{
                id: customer.id,
                converted_at: customer.converted_at,
                contract_signed_at: customer.contract_signed_at,
                contract_type: customer.contract_type,
                account_manager: customer.account_manager,
                status: customer.status as string,
                phase: customer.phase as string,
                notes: customer.notes,
                organization_id: customer.organization_id,
            }}
            organization={org ? {
                id: org.id,
                name: org.name,
                domain: org.domain,
            } : null}
            prospect={prospect ? {
                id: prospect.id,
                company_name: prospect.company_name,
                contact_name: prospect.contact_name,
                contact_email: prospect.contact_email,
                created_at: prospect.created_at,
                has_report: !!prospect.report_html,
                source: prospect.source || 'outbound',
                qualified_at: prospect.qualified_at || null,
            } : null}
            reportHtml={prospect?.report_html || null}
        />
    )
}
