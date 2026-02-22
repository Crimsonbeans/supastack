import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const admin = supabaseAdmin
        const { question_id, assessment_id, answer_text, answer_json } = await request.json()

        if (!question_id || !assessment_id) {
            return NextResponse.json({ error: 'question_id and assessment_id required' }, { status: 400 })
        }

        // Verify user has access: find their org → customer with approved requirements
        const domain = user.user_metadata?.company_domain || user.email?.split('@')[1]
        const { data: org } = await admin.from('organizations').select('id').eq('domain', domain!).single()

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
        }

        const { data: customer } = await admin
            .from('customers')
            .select('requirements_approved_at, requirements_form_status')
            .eq('organization_id', org.id)
            .not('requirements_approved_at', 'is', null)
            .limit(1)
            .single()

        if (!customer) {
            return NextResponse.json({ error: 'Requirements not approved' }, { status: 403 })
        }

        if (customer.requirements_form_status === 'completed') {
            return NextResponse.json({ error: 'Form already submitted' }, { status: 400 })
        }

        // Upsert answer
        const now = new Date().toISOString()
        const { error: upsertError } = await admin
            .from('discovery_answers')
            .upsert({
                discovery_question_id: question_id,
                assessment_id,
                answer_text: answer_text || null,
                answer_json: answer_json || null,
                answered_by: 'customer',
                updated_at: now,
            }, { onConflict: 'discovery_question_id' })

        if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, saved_at: now })

    } catch (error: any) {
        console.error('Customer save-answer error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
