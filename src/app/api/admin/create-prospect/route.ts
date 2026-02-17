import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Use SERVICE_ROLE key to bypass RLS for admin operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        // Check admin auth cookie
        const cookieStore = await cookies()
        const isAdmin = cookieStore.get('admin_session')?.value === 'true'

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const prospectData = await request.json()

        // Ensure organization exists first
        const { company_name, company_domain } = prospectData

        let organizationId: string | null = null

        if (company_domain) {
            const orgResponse = await fetch(`${request.nextUrl.origin}/api/ensure-organization`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name,
                    company_domain
                })
            })

            if (orgResponse.ok) {
                const orgData = await orgResponse.json()
                organizationId = orgData.id
            }
        }

        // Check for duplicate: same email + same organization
        if (organizationId && prospectData.contact_email) {
            const { data: existing } = await supabaseAdmin
                .from('prospects')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('contact_email', prospectData.contact_email)
                .limit(1)
                .single()

            if (existing) {
                return NextResponse.json(
                    { error: 'A prospect with this email already exists in this organization' },
                    { status: 409 }
                )
            }
        }

        // Insert prospect using admin client (bypasses RLS)
        const { data, error } = await supabaseAdmin
            .from('prospects')
            .insert([{
                ...prospectData,
                organization_id: organizationId || null
            }])
            .select()
            .single()

        if (error) {
            console.error('Error creating prospect:', error)
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(data)

    } catch (error: any) {
        console.error('Admin create prospect error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create prospect' },
            { status: 500 }
        )
    }
}
