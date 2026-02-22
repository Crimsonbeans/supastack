import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const supabase = supabaseAdmin

    try {
        const { customer_id } = await request.json()

        if (!customer_id) {
            return NextResponse.json({ error: 'customer_id required' }, { status: 400 })
        }

        // Get customer with org
        const { data: customer, error: custErr } = await supabase
            .from('customers')
            .select('id, organization_id, requirements_approved_at')
            .eq('id', customer_id)
            .single()

        if (custErr || !customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
        }

        // Already approved — idempotent
        if (customer.requirements_approved_at) {
            return NextResponse.json({
                success: true,
                already_approved: true,
                approved_at: customer.requirements_approved_at,
            })
        }

        // Verify requirements exist
        const { data: assessment } = await supabase
            .from('assessments')
            .select('id')
            .eq('organization_id', customer.organization_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!assessment) {
            return NextResponse.json({ error: 'No assessment found' }, { status: 400 })
        }

        const { count } = await supabase
            .from('discovery_questions')
            .select('id', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id)

        if (!count || count === 0) {
            return NextResponse.json({ error: 'No requirements generated yet' }, { status: 400 })
        }

        // Approve
        const now = new Date().toISOString()
        const { error: updateErr } = await supabase
            .from('customers')
            .update({
                requirements_approved_at: now,
                requirements_approved_by: 'manual',
            })
            .eq('id', customer_id)

        if (updateErr) {
            return NextResponse.json({ error: 'Failed to approve' }, { status: 500 })
        }

        return NextResponse.json({ success: true, approved_at: now })

    } catch (error: any) {
        console.error('Approve requirements error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error' },
            { status: 500 }
        )
    }
}
