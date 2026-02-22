import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customer_id')

    if (!customerId) {
        return NextResponse.json({ error: 'customer_id required' }, { status: 400 })
    }

    try {
        // Get customer's organization
        const { data: customer, error: custError } = await supabase
            .from('customers')
            .select('organization_id')
            .eq('id', customerId)
            .single()

        if (custError || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Get the assessment for this organization
        const { data: assessment, error: assessError } = await supabase
            .from('assessments')
            .select('id')
            .eq('organization_id', customer.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (assessError || !assessment) {
            return NextResponse.json({ error: 'No assessment found' }, { status: 404 })
        }

        // Fetch discovery questions, document requests, and existing answers in parallel
        const [questionsResult, documentsResult, answersResult] = await Promise.all([
            supabase
                .from('discovery_questions')
                .select('*')
                .eq('assessment_id', assessment.id)
                .order('dimension_key', { ascending: true })
                .order('display_order', { ascending: true }),
            supabase
                .from('document_requests')
                .select('*')
                .eq('assessment_id', assessment.id)
                .order('dimension_key', { ascending: true }),
            supabase
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
            questions: questionsWithAnswers,
            documents: documentsResult.data || []
        })

    } catch (error: any) {
        console.error('Requirement results error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
