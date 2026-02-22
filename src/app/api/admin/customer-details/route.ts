import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    if (!customerId) {
        return NextResponse.json(
            { error: 'customer_id required' },
            { status: 400 }
        )
    }

    try {
        const { data: customer, error } = await supabase
            .from('customers')
            .select(`
                id,
                organization_id,
                requirements_approved_at,
                requirements_approved_by,
                auto_approve_requirements,
                requirements_form_status,
                requirements_submitted_at,
                prospect:prospects(
                    id,
                    company_name,
                    contact_name,
                    contact_email,
                    created_at
                )
            `)
            .eq('id', customerId)
            .single()

        if (error || !customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Check if report exists without fetching the HTML
        const prospect = customer.prospect as any
        let has_report = false
        let report_generated_at: string | null = null

        if (prospect?.id) {
            const { data: reportCheck } = await supabase
                .from('prospects')
                .select('report_html, created_at')
                .eq('id', prospect.id)
                .single()

            has_report = !!reportCheck?.report_html
            report_generated_at = prospect.created_at
        }

        // Fetch workflow execution status and question/document counts for Phase 2 requirements
        let req_gen_status = 'not_started' as string
        let req_gen_error: string | null = null
        let req_gen_error_details: any = null
        let req_gen_started_at: string | null = null
        let req_gen_questions_count = 0
        let req_gen_documents_count = 0
        let assessment_id: string | null = null

        if (customer.organization_id) {
            // Find the assessment for this organization (single query, reused below)
            const { data: assessment } = await supabase
                .from('assessments')
                .select('id')
                .eq('organization_id', customer.organization_id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (assessment) {
                assessment_id = assessment.id
                // Fetch workflow execution + question/document counts in parallel
                const [workflowResult, questionsResult, documentsResult] = await Promise.all([
                    supabase
                        .from('workflow_executions')
                        .select('status, error_message, error_details, started_at')
                        .eq('assessment_id', assessment.id)
                        .eq('workflow_type', 'phase2_requirements')
                        .order('started_at', { ascending: false })
                        .limit(1)
                        .single(),
                    supabase
                        .from('discovery_questions')
                        .select('id', { count: 'exact', head: true })
                        .eq('assessment_id', assessment.id),
                    supabase
                        .from('document_requests')
                        .select('id', { count: 'exact', head: true })
                        .eq('assessment_id', assessment.id)
                ])

                const workflowExec = workflowResult.data
                req_gen_questions_count = questionsResult.count || 0
                req_gen_documents_count = documentsResult.count || 0

                if (workflowExec) {
                    req_gen_status = workflowExec.status as typeof req_gen_status
                    req_gen_error = workflowExec.error_message
                    req_gen_error_details = workflowExec.error_details
                    req_gen_started_at = workflowExec.started_at

                    // Smart completion detection: if status is 'running' but data exists,
                    // the workflow completed successfully
                    if (req_gen_status === 'running' && req_gen_questions_count > 0) {
                        req_gen_status = 'completed'
                        req_gen_error = null
                        req_gen_error_details = null

                        // Also update the DB record so future polls don't need this check
                        const { data: wfExec } = await supabase
                            .from('workflow_executions')
                            .select('id')
                            .eq('assessment_id', assessment.id)
                            .eq('workflow_type', 'phase2_requirements')
                            .eq('status', 'running')
                            .limit(1)
                            .single()

                        if (wfExec) {
                            supabase.from('workflow_executions')
                                .update({
                                    status: 'completed',
                                    completed_at: new Date().toISOString(),
                                    error_message: null,
                                    error_details: null
                                })
                                .eq('id', wfExec.id)
                                .then(() => {})
                        }
                    }

                    // n8n API error detection: if running > 5 min with no data, check n8n
                    if (req_gen_status === 'running' && req_gen_questions_count === 0 && req_gen_started_at) {
                        const runningMinutes = (Date.now() - new Date(req_gen_started_at).getTime()) / 60000
                        if (runningMinutes > 5) {
                            try {
                                const n8nApiUrl = process.env.N8N_API_URL
                                const n8nApiKey = process.env.N8N_API_KEY
                                if (n8nApiUrl && n8nApiKey) {
                                    const execRes = await fetch(
                                        `${n8nApiUrl}/api/v1/executions?workflowId=eJQAcBlb45pMvMFw&limit=3&status=error`,
                                        { headers: { 'X-N8N-API-KEY': n8nApiKey } }
                                    )
                                    if (execRes.ok) {
                                        const execData = await execRes.json()
                                        const recentError = execData.data?.find((e: any) =>
                                            e.mode === 'webhook' &&
                                            new Date(e.startedAt).getTime() >= new Date(req_gen_started_at!).getTime() - 5000
                                        )
                                        if (recentError) {
                                            req_gen_status = 'failed'
                                            req_gen_error = 'Workflow execution failed in n8n'
                                            req_gen_error_details = { n8n_execution_id: recentError.id }

                                            // Update DB
                                            const { data: wfExec } = await supabase
                                                .from('workflow_executions')
                                                .select('id')
                                                .eq('assessment_id', assessment.id)
                                                .eq('workflow_type', 'phase2_requirements')
                                                .eq('status', 'running')
                                                .limit(1)
                                                .single()

                                            if (wfExec) {
                                                supabase.from('workflow_executions')
                                                    .update({
                                                        status: 'failed',
                                                        completed_at: new Date().toISOString(),
                                                        error_message: req_gen_error,
                                                        error_details: req_gen_error_details
                                                    })
                                                    .eq('id', wfExec.id)
                                                    .then(() => {})
                                            }
                                        }
                                    }
                                }
                            } catch {
                                // Don't fail the API call if n8n check fails
                            }
                        }
                    }
                } else if (req_gen_questions_count > 0) {
                    // Org-level check: no workflow execution record but questions already exist
                    // (generated via another customer from same org, or manually via n8n)
                    req_gen_status = 'completed'
                }
            }
        }

        return NextResponse.json({
            customer_id: customerId,
            assessment_id,
            prospect_id: prospect?.id || null,
            company_name: prospect?.company_name || null,
            contact_name: prospect?.contact_name || null,
            contact_email: prospect?.contact_email || null,
            report_generated_at,
            has_report,
            req_gen_status,
            req_gen_error,
            req_gen_error_details,
            req_gen_started_at,
            req_gen_questions_count,
            req_gen_documents_count,
            requirements_approved_at: customer.requirements_approved_at || null,
            requirements_approved_by: customer.requirements_approved_by || null,
            auto_approve_requirements: customer.auto_approve_requirements || false,
            requirements_form_status: customer.requirements_form_status || 'draft',
            requirements_submitted_at: customer.requirements_submitted_at || null,
        })

    } catch (error: any) {
        console.error('Customer details error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
