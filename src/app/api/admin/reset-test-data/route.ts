import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// TEMPORARY endpoint for resetting test data — DELETE after testing
export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { organization_name } = await request.json()

        if (!organization_name) {
            return NextResponse.json(
                { error: 'organization_name is required' },
                { status: 400 }
            )
        }

        // Step 1: Find the organization
        const { data: orgs, error: orgError } = await supabase
            .from('organizations')
            .select('id, name, org_type')
            .ilike('name', `%${organization_name}%`)

        if (orgError || !orgs || orgs.length === 0) {
            return NextResponse.json(
                { error: `Organization matching "${organization_name}" not found`, debug: orgError?.message },
                { status: 404 }
            )
        }

        if (orgs.length > 1) {
            return NextResponse.json(
                { error: 'Multiple organizations found', matches: orgs.map(o => o.name) },
                { status: 400 }
            )
        }

        const org = orgs[0]

        // Step 2: Get all prospect_ids
        const { data: prospects } = await supabase
            .from('prospects')
            .select('id, status, company_name')
            .eq('organization_id', org.id)

        const prospect_ids = prospects?.map(p => p.id) || []

        // Step 3: Get all assessment_ids
        const { data: assessments } = await supabase
            .from('assessments')
            .select('id')
            .eq('organization_id', org.id)

        const assessment_ids = assessments?.map(a => a.id) || []

        const results: Record<string, any> = {
            organization: { id: org.id, name: org.name, org_type: org.org_type },
            prospects_found: prospects?.length || 0,
            assessments_found: assessment_ids.length
        }

        // Step 4: Delete discovery_questions
        if (assessment_ids.length > 0) {
            const { error: qErr } = await supabase
                .from('discovery_questions')
                .delete()
                .in('assessment_id', assessment_ids)
            results.discovery_questions_deleted = qErr ? `Error: ${qErr.message}` : 'done'
        }

        // Step 5: Delete document_requests
        if (assessment_ids.length > 0) {
            const { error: dErr } = await supabase
                .from('document_requests')
                .delete()
                .in('assessment_id', assessment_ids)
            results.document_requests_deleted = dErr ? `Error: ${dErr.message}` : 'done'
        }

        // Step 6: Delete workflow_executions
        if (assessment_ids.length > 0) {
            const { error: wErr } = await supabase
                .from('workflow_executions')
                .delete()
                .in('assessment_id', assessment_ids)
            results.workflow_executions_deleted = wErr ? `Error: ${wErr.message}` : 'done'
        }

        // Step 7: Delete customers
        if (prospect_ids.length > 0) {
            const { error: cErr } = await supabase
                .from('customers')
                .delete()
                .in('prospect_id', prospect_ids)
            results.customers_deleted = cErr ? `Error: ${cErr.message}` : 'done'
        }

        // Step 8: Reset prospect statuses to 'qualified'
        if (prospect_ids.length > 0) {
            const { error: updateError } = await supabase
                .from('prospects')
                .update({ status: 'qualified' })
                .in('id', prospect_ids)

            results.prospects_reset = updateError ? `Error: ${updateError.message}` : prospect_ids.length
        }

        // Step 9: Reset organization type to 'prospect'
        const { error: orgUpdateError } = await supabase
            .from('organizations')
            .update({ org_type: 'prospect' })
            .eq('id', org.id)

        results.org_type_reset = orgUpdateError ? `Error: ${orgUpdateError.message}` : 'prospect'

        return NextResponse.json({
            success: true,
            message: `Reset complete for "${org.name}"`,
            results
        })

    } catch (error: any) {
        console.error('Reset test data error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
