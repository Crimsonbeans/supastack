import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use SERVICE_ROLE key — user has no session at this point (pre-verification)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        const { email, company_domain } = await request.json()

        if (!email || !company_domain) {
            return NextResponse.json(
                { error: 'Missing email or company_domain' },
                { status: 400 }
            )
        }

        // Find the prospect created by the DB trigger for this user
        // Match by domain since the trigger uses domain to create/link prospects
        const { data: prospect, error: findError } = await supabaseAdmin
            .from('prospects')
            .select('id, status, organization_id, company_domain')
            .eq('company_domain', company_domain)
            .eq('contact_email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (findError || !prospect) {
            // Prospect may not exist yet if trigger hasn't fired — that's OK
            return NextResponse.json({ skipped: true, reason: 'prospect_not_found' })
        }

        // If already processing or completed, don't re-trigger
        if (prospect.status === 'processing' || prospect.status === 'completed') {
            return NextResponse.json({ skipped: true, reason: `already_${prospect.status}` })
        }

        // Check if any other prospect in the same org already has a completed report
        if (prospect.organization_id) {
            const { data: existingReport } = await supabaseAdmin
                .from('prospects')
                .select('report_html, report_html_public')
                .eq('organization_id', prospect.organization_id)
                .eq('status', 'completed')
                .not('report_html', 'is', null)
                .neq('id', prospect.id)
                .limit(1)
                .single()

            if (existingReport?.report_html) {
                // Copy report from existing prospect in same org
                await supabaseAdmin
                    .from('prospects')
                    .update({
                        status: 'completed',
                        report_html: existingReport.report_html,
                        report_html_public: existingReport.report_html_public || null,
                    })
                    .eq('id', prospect.id)

                return NextResponse.json({ success: true, reused: true })
            }
        }

        // No existing report — update status to pending and trigger N8N scan
        await supabaseAdmin
            .from('prospects')
            .update({ status: 'pending' })
            .eq('id', prospect.id)

        // Trigger the scan via the existing execute-scans endpoint
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL
        if (!N8N_WEBHOOK_URL) {
            return NextResponse.json({ error: 'N8N webhook not configured' }, { status: 500 })
        }

        // Fetch the full prospect data for the N8N payload
        const { data: fullProspect } = await supabaseAdmin
            .from('prospects')
            .select('*')
            .eq('id', prospect.id)
            .single()

        if (fullProspect) {
            const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: fullProspect.company_name,
                    company_domain: fullProspect.company_domain.replace(/^https?:\/\//, ''),
                    webscan_type: fullProspect.webscan_type,
                    contact_email: fullProspect.contact_email,
                    contact_name: fullProspect.contact_name,
                    prospect_id: fullProspect.id,
                }),
            })

            if (webhookResponse.ok) {
                // Update status to processing
                await supabaseAdmin
                    .from('prospects')
                    .update({ status: 'processing' })
                    .eq('id', prospect.id)
            }
        }

        return NextResponse.json({ success: true, reused: false })

    } catch (error: any) {
        console.error('Auto-generate report error:', error)
        // Return 200 even on error — this is fire-and-forget from the client
        return NextResponse.json({ error: error.message }, { status: 200 })
    }
}
