import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
        return NextResponse.json(
            { error: 'organization_id required' },
            { status: 400 }
        )
    }

    try {
        // Fetch all prospects from this org that aren't already converted
        const { data: prospects, error } = await supabase
            .from('prospects')
            .select('id, company_name, contact_name, contact_email, status, report_html, qualified_at, created_at')
            .eq('organization_id', organizationId)
            .neq('status', 'converted_to_customer')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Failed to fetch organization prospects:', error)
            return NextResponse.json(
                { error: 'Failed to fetch organization prospects', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            organization_id: organizationId,
            prospects: prospects || [],
            count: prospects?.length || 0
        })

    } catch (error: any) {
        console.error('Get org prospects error:', error)
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: 500 }
        )
    }
}
