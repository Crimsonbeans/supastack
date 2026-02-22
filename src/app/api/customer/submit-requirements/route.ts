import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const admin = supabaseAdmin
        const domain = user.user_metadata?.company_domain || user.email?.split('@')[1]

        if (!domain) {
            return NextResponse.json({ error: 'No domain found' }, { status: 400 })
        }

        const { data: org } = await admin.from('organizations').select('id').eq('domain', domain).single()
        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const { data: customer } = await admin
            .from('customers')
            .select('id, organization_id, requirements_approved_at, requirements_form_status')
            .eq('organization_id', org.id)
            .not('requirements_approved_at', 'is', null)
            .limit(1)
            .single()

        if (!customer) {
            return NextResponse.json({ error: 'Requirements not approved' }, { status: 403 })
        }

        if (customer.requirements_form_status === 'completed') {
            return NextResponse.json({ error: 'Already submitted' }, { status: 400 })
        }

        // Find assessment to validate required questions
        const { data: assessment } = await admin
            .from('assessments')
            .select('id')
            .eq('organization_id', org.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!assessment) {
            return NextResponse.json({ error: 'No assessment found' }, { status: 404 })
        }

        // Check all required questions are answered
        const { data: requiredQuestions } = await admin
            .from('discovery_questions')
            .select('id')
            .eq('assessment_id', assessment.id)
            .eq('is_required', true)

        if (requiredQuestions && requiredQuestions.length > 0) {
            const requiredIds = requiredQuestions.map(q => q.id)
            const { data: answeredRequired } = await admin
                .from('discovery_answers')
                .select('discovery_question_id')
                .in('discovery_question_id', requiredIds)

            const answeredIds = new Set((answeredRequired || []).map(a => a.discovery_question_id))
            const unanswered = requiredIds.filter(id => !answeredIds.has(id))

            if (unanswered.length > 0) {
                return NextResponse.json(
                    { error: `${unanswered.length} required question(s) not answered` },
                    { status: 400 }
                )
            }
        }

        // Mark as completed
        const now = new Date().toISOString()
        const { error: updateErr } = await admin
            .from('customers')
            .update({
                requirements_form_status: 'completed',
                requirements_submitted_at: now,
            })
            .eq('id', customer.id)

        if (updateErr) {
            return NextResponse.json({ error: 'Failed to submit' }, { status: 500 })
        }

        return NextResponse.json({ success: true, submitted_at: now })

    } catch (error: any) {
        console.error('Submit requirements error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
