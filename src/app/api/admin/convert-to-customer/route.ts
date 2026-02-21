import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

interface ConvertToCustomerRequest {
    prospect_ids: string[] // Array of prospect IDs to convert
    contract_details: {
        signed_at: string
        account_manager?: string
        notes?: string
    }
}

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { prospect_ids, contract_details } = await request.json() as ConvertToCustomerRequest

        if (!prospect_ids || prospect_ids.length === 0) {
            return NextResponse.json(
                { error: 'No prospects selected for conversion' },
                { status: 400 }
            )
        }

        // 1. Validate all prospects can be converted
        const { data: prospects, error: prospectError } = await supabase
            .from('prospects')
            .select('id, status, organization_id, company_name, report_html')
            .in('id', prospect_ids)

        if (prospectError || !prospects || prospects.length !== prospect_ids.length) {
            return NextResponse.json(
                { error: 'Failed to fetch all selected prospects' },
                { status: 404 }
            )
        }

        // 2. HARD RULE: All must have completed Phase 1 reports
        const invalidProspects = prospects.filter(
            p => p.status !== 'completed' || !p.report_html
        )

        if (invalidProspects.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot convert prospects without completed Phase 1 reports',
                    invalid_prospects: invalidProspects.map(p => ({
                        id: p.id,
                        company: p.company_name,
                        status: p.status,
                        has_report: !!p.report_html
                    }))
                },
                { status: 400 }
            )
        }

        // 3. Validate: All must have organization_id
        const prospectsWithoutOrg = prospects.filter(p => !p.organization_id)
        if (prospectsWithoutOrg.length > 0) {
            return NextResponse.json(
                {
                    error: 'Cannot convert prospects without organization_id',
                    prospects_without_org: prospectsWithoutOrg.map(p => ({
                        id: p.id,
                        company: p.company_name
                    }))
                },
                { status: 400 }
            )
        }

        // 4. Validate: All from same organization
        const orgIds = new Set(prospects.map(p => p.organization_id))
        if (orgIds.size !== 1) {
            return NextResponse.json(
                { error: 'All selected prospects must be from the same organization' },
                { status: 400 }
            )
        }

        const organizationId = prospects[0].organization_id
        const conversionBatchId = randomUUID()

        // 5. Create customer records for each prospect
        const customerRecords = prospects.map(prospect => ({
            prospect_id: prospect.id,
            organization_id: organizationId,
            contract_signed_at: contract_details.signed_at || new Date().toISOString(),
            account_manager: contract_details.account_manager || null,
            notes: contract_details.notes || null,
            conversion_batch_id: conversionBatchId,
            status: 'active',
            phase: 'phase1_delivered'
        }))

        const { data: customers, error: customerError } = await supabase
            .from('customers')
            .insert(customerRecords)
            .select()

        if (customerError) {
            console.error('Customer creation failed:', customerError)
            console.error('Customer records attempted:', JSON.stringify(customerRecords, null, 2))
            return NextResponse.json(
                {
                    error: 'Failed to create customer records',
                    details: customerError.message,
                    code: customerError.code,
                    hint: customerError.hint
                },
                { status: 500 }
            )
        }

        // 6. Update prospect statuses to 'converted_to_customer'
        const { error: updateError } = await supabase
            .from('prospects')
            .update({ status: 'converted_to_customer' })
            .in('id', prospect_ids)

        if (updateError) {
            console.error('Prospect status update failed:', updateError)
            return NextResponse.json(
                {
                    error: 'Customers created but prospect status update failed',
                    details: updateError.message,
                    customers_created: customers.length
                },
                { status: 500 }
            )
        }

        // 7. Update organization type to 'customer'
        await supabase
            .from('organizations')
            .update({ org_type: 'customer' })
            .eq('id', organizationId)

        return NextResponse.json({
            success: true,
            customers_created: customers.length,
            conversion_batch_id: conversionBatchId,
            organization_id: organizationId,
            message: `${customers.length} prospect(s) converted to customer(s)`
        })

    } catch (error: any) {
        console.error('Conversion error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
