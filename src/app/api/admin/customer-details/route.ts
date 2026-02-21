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
        if (prospect?.id) {
            const { data: reportCheck } = await supabase
                .from('prospects')
                .select('report_html')
                .eq('id', prospect.id)
                .single()

            return NextResponse.json({
                customer_id: customerId,
                prospect_id: prospect.id,
                company_name: prospect.company_name,
                contact_name: prospect.contact_name,
                contact_email: prospect.contact_email,
                report_generated_at: prospect.created_at,
                has_report: !!reportCheck?.report_html
            })
        }

        return NextResponse.json({
            customer_id: customerId,
            prospect_id: null,
            has_report: false
        })

    } catch (error: any) {
        console.error('Customer details error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
