import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

interface RequirementCallbackRequest {
    assessment_id: string
    workflow_execution_id?: string
    status: 'completed' | 'failed'
    error_message?: string
    error_node?: string
    questions_count?: number
    documents_count?: number
    n8n_execution_id?: string
}

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const body = await request.json() as RequirementCallbackRequest
        const { assessment_id, workflow_execution_id, status, error_message, error_node, questions_count, documents_count, n8n_execution_id } = body

        if (!status) {
            return NextResponse.json(
                { error: 'status is required' },
                { status: 400 }
            )
        }

        // Build the query to find the workflow execution record
        // Priority: workflow_execution_id > assessment_id > n8n_execution_id > most recent triggered
        let query = supabase
            .from('workflow_executions')
            .select('id, started_at')
            .eq('workflow_type', 'phase2_requirements')

        if (workflow_execution_id) {
            query = query.eq('id', workflow_execution_id)
        } else if (assessment_id) {
            query = query.eq('assessment_id', assessment_id)
        } else if (n8n_execution_id) {
            query = query.eq('n8n_execution_id', n8n_execution_id)
        } else {
            // Fallback: find the most recent triggered record
            query = query.eq('status', 'running')
        }

        const { data: execRecord, error: findError } = await query
            .order('started_at', { ascending: false })
            .limit(1)
            .single()

        if (findError || !execRecord) {
            console.error('Workflow execution record not found:', findError)
            return NextResponse.json(
                { error: 'Workflow execution record not found' },
                { status: 404 }
            )
        }

        const now = new Date().toISOString()
        const durationSeconds = execRecord.started_at
            ? Math.round((new Date(now).getTime() - new Date(execRecord.started_at).getTime()) / 1000)
            : null

        if (status === 'completed') {
            const { error: updateError } = await supabase
                .from('workflow_executions')
                .update({
                    status: 'completed',
                    completed_at: now,
                    duration_seconds: durationSeconds,
                    n8n_execution_id: n8n_execution_id || null,
                    error_message: null,
                    error_details: null
                })
                .eq('id', execRecord.id)

            if (updateError) {
                console.error('Failed to update workflow execution:', updateError)
                return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
            }

            // Auto-approve: if the customer has auto_approve_requirements enabled, approve now
            if (assessment_id) {
                try {
                    const { data: assessment } = await supabase
                        .from('assessments')
                        .select('organization_id')
                        .eq('id', assessment_id)
                        .single()

                    if (assessment) {
                        await supabase
                            .from('customers')
                            .update({
                                requirements_approved_at: now,
                                requirements_approved_by: 'auto',
                            })
                            .eq('organization_id', assessment.organization_id)
                            .eq('auto_approve_requirements', true)
                            .is('requirements_approved_at', null)
                    }
                } catch (autoApproveErr) {
                    // Don't fail the callback if auto-approve fails
                    console.error('Auto-approve check failed:', autoApproveErr)
                }
            }

            return NextResponse.json({
                success: true,
                status: 'completed',
                duration_seconds: durationSeconds,
                questions_count,
                documents_count
            })
        }

        if (status === 'failed') {
            const { error: updateError } = await supabase
                .from('workflow_executions')
                .update({
                    status: 'failed',
                    completed_at: now,
                    duration_seconds: durationSeconds,
                    n8n_execution_id: n8n_execution_id || null,
                    error_message: error_message || 'Unknown error',
                    error_details: { node: error_node || null, raw_error: error_message || null }
                })
                .eq('id', execRecord.id)

            if (updateError) {
                console.error('Failed to update workflow execution:', updateError)
                return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                status: 'failed',
                error_message
            })
        }

        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    } catch (error: any) {
        console.error('Requirement callback error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
