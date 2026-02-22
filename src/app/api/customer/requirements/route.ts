import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
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

        // Find organization by domain
        const { data: org } = await admin
            .from('organizations')
            .select('id')
            .eq('domain', domain)
            .single()

        if (!org) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        // Find customer with approved requirements
        const { data: customer } = await admin
            .from('customers')
            .select('id, requirements_approved_at, requirements_form_status, requirements_submitted_at')
            .eq('organization_id', org.id)
            .not('requirements_approved_at', 'is', null)
            .limit(1)
            .single()

        if (!customer) {
            return NextResponse.json({ error: 'Requirements not available' }, { status: 403 })
        }

        // Find assessment
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

        // Fetch questions, documents, and answers in parallel
        const [questionsResult, documentsResult, answersResult] = await Promise.all([
            admin
                .from('discovery_questions')
                .select('*')
                .eq('assessment_id', assessment.id)
                .order('dimension_key', { ascending: true })
                .order('display_order', { ascending: true }),
            admin
                .from('document_requests')
                .select('*')
                .eq('assessment_id', assessment.id)
                .order('dimension_key', { ascending: true }),
            admin
                .from('discovery_answers')
                .select('*')
                .eq('assessment_id', assessment.id)
        ])

        // Merge answers into questions
        const answersMap = new Map(
            (answersResult.data || []).map((a: any) => [a.discovery_question_id, a])
        )
        const questionsWithAnswers = (questionsResult.data || []).map((q: any) => ({
            ...q,
            answer: answersMap.get(q.id) || null,
        }))

        return NextResponse.json({
            assessment_id: assessment.id,
            customer_id: customer.id,
            questions: questionsWithAnswers,
            documents: documentsResult.data || [],
            form_status: customer.requirements_form_status || 'draft',
            submitted_at: customer.requirements_submitted_at || null,
        })

    } catch (error: any) {
        console.error('Customer requirements error:', error)
        return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
    }
}
