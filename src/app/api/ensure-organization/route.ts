import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use SERVICE_ROLE key to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { company_name, company_domain } = await request.json()

        if (!company_name || !company_domain) {
            return NextResponse.json(
                { error: 'Missing company_name or company_domain' },
                { status: 400 }
            )
        }

        // Check if organization exists
        const { data: existingOrg, error: findError } = await supabaseAdmin
            .from('organizations')
            .select('id, name')
            .eq('domain', company_domain)
            .maybeSingle()

        if (findError) {
            console.error('Error finding org:', findError)
            throw findError
        }

        if (existingOrg) {
            return NextResponse.json({
                id: existingOrg.id,
                name: existingOrg.name,
                newlyCreated: false
            })
        }

        // Create new organization
        const { data: newOrg, error: createError } = await supabaseAdmin
            .from('organizations')
            .insert([{
                name: company_name,
                domain: company_domain,
                org_type: 'customer'
            }])
            .select('id')
            .single()

        if (createError) {
            console.error('Error creating org:', createError)
            // Handle unique constraint manually just in case race condition
            if (createError.code === '23505') { // unique_violation
                const { data: retryOrg } = await supabaseAdmin
                    .from('organizations')
                    .select('id')
                    .eq('domain', company_domain)
                    .single()
                return NextResponse.json({ id: retryOrg?.id, newlyCreated: false })
            }
            throw createError
        }

        return NextResponse.json({ id: newOrg.id, newlyCreated: true })

    } catch (error: any) {
        console.error('Ensure organization error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to ensure organization' },
            { status: 500 }
        )
    }
}
