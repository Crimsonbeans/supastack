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
    auto_generate_reqs?: boolean
    auto_approve_reqs?: boolean
}

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { prospect_ids, contract_details, auto_generate_reqs, auto_approve_reqs } = await request.json() as ConvertToCustomerRequest

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
        const convertableStatuses = ['completed', 'qualified']
        const invalidProspects = prospects.filter(
            p => !convertableStatuses.includes(p.status) || !p.report_html
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
            phase: 'phase1_delivered',
            auto_approve_requirements: auto_approve_reqs || false,
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

        // 8. If auto_generate_reqs is ON, trigger n8n Requirements Generator workflow
        let workflow_execution_id: string | null = null
        if (auto_generate_reqs) {
            try {
                // Look up the assessment for this organization
                const { data: assessment } = await supabase
                    .from('assessments')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()

                if (assessment) {
                    // Dedup: skip if workflow already running/completed OR questions already exist
                    const [existingExecResult, existingQuestionsResult] = await Promise.all([
                        supabase
                            .from('workflow_executions')
                            .select('id, status')
                            .eq('assessment_id', assessment.id)
                            .eq('workflow_type', 'phase2_requirements')
                            .in('status', ['running', 'completed'])
                            .limit(1)
                            .single(),
                        supabase
                            .from('discovery_questions')
                            .select('id', { count: 'exact', head: true })
                            .eq('assessment_id', assessment.id)
                    ])

                    const alreadyRunningOrDone = !!existingExecResult.data
                    const questionsAlreadyExist = (existingQuestionsResult.count || 0) > 0

                    if (!alreadyRunningOrDone && !questionsAlreadyExist) {
                        // Insert workflow_executions record
                        const { data: workflowExec, error: execError } = await supabase
                            .from('workflow_executions')
                            .insert({
                                assessment_id: assessment.id,
                                workflow_name: 'requirement_generation',
                                workflow_type: 'phase2_requirements',
                                status: 'running',
                                started_at: new Date().toISOString()
                            })
                            .select('id')
                            .single()

                        if (workflowExec && !execError) {
                            workflow_execution_id = workflowExec.id

                            // Fire n8n webhook (fire-and-forget — don't block conversion response)
                            const webhookUrl = process.env.N8N_WEBHOOK_URL_PHASE2_REQUIREMENTS
                            if (webhookUrl) {
                                const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/n8n/requirement-callback`
                                fetch(webhookUrl, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        assessment_id: assessment.id,
                                        callback_url: callbackUrl,
                                        workflow_execution_id: workflowExec.id,
                                        auto_approve: auto_approve_reqs || false
                                    })
                                }).catch(err => {
                                    console.error('Failed to trigger n8n webhook:', err)
                                    supabase
                                        .from('workflow_executions')
                                        .update({
                                            status: 'failed',
                                            error_message: 'Failed to trigger n8n webhook: ' + err.message,
                                            completed_at: new Date().toISOString()
                                        })
                                        .eq('id', workflowExec.id)
                                        .then(() => {})
                                })
                            } else {
                                console.error('N8N_WEBHOOK_URL_PHASE2_REQUIREMENTS not configured')
                            }
                        }
                    }
                    // If already running/done or questions exist, skip — no duplicate trigger
                }
            } catch (err) {
                console.error('Failed to trigger requirement generation:', err)
                // Don't fail the conversion — just log the error
            }
        }

        return NextResponse.json({
            success: true,
            customers_created: customers.length,
            conversion_batch_id: conversionBatchId,
            organization_id: organizationId,
            workflow_execution_id,
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
