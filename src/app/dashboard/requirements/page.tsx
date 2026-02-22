import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import CustomerRequirementsClient from '@/components/dashboard/CustomerRequirementsClient'

export const dynamic = 'force-dynamic'

export default async function RequirementsPage() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect('/login')
    }

    const admin = supabaseAdmin
    const domain = user.user_metadata?.company_domain || user.email?.split('@')[1]

    if (!domain) {
        return <NotAvailable message="Unable to determine your organization." />
    }

    // Find organization
    const { data: org } = await admin
        .from('organizations')
        .select('id')
        .eq('domain', domain)
        .single()

    if (!org) {
        return <NotAvailable message="Organization not found." />
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
        return <NotAvailable message="Requirements are not available yet. Your account manager will notify you when they are ready." />
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
        return <NotAvailable message="No assessment data found." />
    }

    // Fetch questions, documents, answers
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

    const answersMap = new Map(
        (answersResult.data || []).map((a: any) => [a.discovery_question_id, a])
    )
    const questionsWithAnswers = (questionsResult.data || []).map((q: any) => ({
        ...q,
        answer: answersMap.get(q.id) || null,
    }))

    return (
        <CustomerRequirementsClient
            questions={questionsWithAnswers}
            documents={documentsResult.data || []}
            assessmentId={assessment.id}
            formStatus={customer.requirements_form_status || 'draft'}
            submittedAt={customer.requirements_submitted_at || null}
        />
    )
}

function NotAvailable({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-sm">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Requirements Not Available</h3>
                <p className="text-sm text-slate-500">{message}</p>
            </div>
        </div>
    )
}
