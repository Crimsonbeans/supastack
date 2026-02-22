import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { customer_id } = await request.json()

        if (!customer_id) {
            return NextResponse.json(
                { error: 'customer_id is required' },
                { status: 400 }
            )
        }

        // Look up the customer's organization
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .select('organization_id')
            .eq('id', customer_id)
            .single()

        if (custError || !customer) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        // Look up the assessment for this organization
        const { data: assessment, error: assessError } = await supabase
            .from('assessments')
            .select('id')
            .eq('organization_id', customer.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (assessError || !assessment) {
            return NextResponse.json(
                { error: 'No assessment found for this customer\'s organization' },
                { status: 404 }
            )
        }

        // Find existing workflow_executions record
        const { data: existingExec } = await supabase
            .from('workflow_executions')
            .select('id, retry_count, status')
            .eq('assessment_id', assessment.id)
            .eq('workflow_type', 'phase2_requirements')
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

        // Duplicate protection: if already running or completed, don't trigger again
        if (existingExec?.status === 'running') {
            return NextResponse.json({
                success: true,
                workflow_execution_id: existingExec.id,
                already_running: true,
                message: 'Workflow is already running'
            })
        }

        if (existingExec?.status === 'completed') {
            return NextResponse.json({
                success: true,
                workflow_execution_id: existingExec.id,
                already_completed: true,
                message: 'Requirements already generated for this organization'
            })
        }

        // Also check if questions already exist (generated via another path)
        if (!existingExec) {
            const { count: existingQuestions } = await supabase
                .from('discovery_questions')
                .select('id', { count: 'exact', head: true })
                .eq('assessment_id', assessment.id)

            if (existingQuestions && existingQuestions > 0) {
                return NextResponse.json({
                    success: true,
                    already_completed: true,
                    message: 'Requirements already generated for this organization'
                })
            }
        }

        const now = new Date().toISOString()

        if (existingExec) {
            // Update existing record: increment retry_count, reset status
            const { error: updateError } = await supabase
                .from('workflow_executions')
                .update({
                    status: 'running',
                    started_at: now,
                    completed_at: null,
                    duration_seconds: null,
                    error_message: null,
                    error_details: null,
                    retry_count: (existingExec.retry_count || 0) + 1
                })
                .eq('id', existingExec.id)

            if (updateError) {
                return NextResponse.json(
                    { error: 'Failed to update workflow execution record' },
                    { status: 500 }
                )
            }

            // Fire n8n webhook
            const webhookUrl = process.env.N8N_WEBHOOK_URL_PHASE2_REQUIREMENTS
            if (webhookUrl) {
                const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/n8n/requirement-callback`
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assessment_id: assessment.id,
                        callback_url: callbackUrl,
                        workflow_execution_id: existingExec.id
                    })
                }).catch(err => {
                    console.error('Failed to trigger n8n webhook on retry:', err)
                    supabase
                        .from('workflow_executions')
                        .update({
                            status: 'failed',
                            error_message: 'Failed to trigger n8n webhook: ' + err.message,
                            completed_at: new Date().toISOString()
                        })
                        .eq('id', existingExec.id)
                        .then(() => {})
                })
            }

            return NextResponse.json({
                success: true,
                workflow_execution_id: existingExec.id,
                retry_count: (existingExec.retry_count || 0) + 1
            })
        } else {
            // No existing record — create a new one
            const { data: newExec, error: insertError } = await supabase
                .from('workflow_executions')
                .insert({
                    assessment_id: assessment.id,
                    workflow_name: 'requirement_generation',
                    workflow_type: 'phase2_requirements',
                    status: 'running',
                    started_at: now
                })
                .select('id')
                .single()

            if (insertError || !newExec) {
                return NextResponse.json(
                    { error: 'Failed to create workflow execution record' },
                    { status: 500 }
                )
            }

            // Fire n8n webhook
            const webhookUrl = process.env.N8N_WEBHOOK_URL_PHASE2_REQUIREMENTS
            if (webhookUrl) {
                const callbackUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/n8n/requirement-callback`
                fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assessment_id: assessment.id,
                        callback_url: callbackUrl,
                        workflow_execution_id: newExec.id
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
                        .eq('id', newExec.id)
                        .then(() => {})
                })
            }

            return NextResponse.json({
                success: true,
                workflow_execution_id: newExec.id,
                retry_count: 0
            })
        }

    } catch (error: any) {
        console.error('Retry requirement gen error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
