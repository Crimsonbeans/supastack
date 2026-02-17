import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { prospectIds } = await request.json()

        if (!prospectIds || !Array.isArray(prospectIds) || prospectIds.length === 0) {
            return NextResponse.json(
                { error: 'Invalid prospect IDs' },
                { status: 400 }
            )
        }

        // Fetch the prospects from database
        const { data: prospects, error: fetchError } = await supabase
            .from('prospects')
            .select('*')
            .in('id', prospectIds)

        if (fetchError) {
            throw fetchError
        }

        if (!prospects || prospects.length === 0) {
            return NextResponse.json(
                { error: 'No prospects found' },
                { status: 404 }
            )
        }

        // n8n webhook URL - Replace with your actual n8n webhook URL
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'YOUR_N8N_WEBHOOK_URL_HERE'

        // Trigger n8n workflow for each prospect (with org-level report reuse)
        const results = await Promise.allSettled(
            prospects.map(async (prospect) => {
                // Check if another prospect in the same org already has a completed report
                if (prospect.organization_id) {
                    const { data: existingReport } = await supabase
                        .from('prospects')
                        .select('report_html, report_html_public')
                        .eq('organization_id', prospect.organization_id)
                        .eq('status', 'completed')
                        .not('report_html', 'is', null)
                        .neq('id', prospect.id)
                        .limit(1)
                        .single()

                    if (existingReport?.report_html) {
                        // Reuse existing report — no N8N call needed
                        await supabase
                            .from('prospects')
                            .update({
                                status: 'completed',
                                report_html: existingReport.report_html,
                                report_html_public: existingReport.report_html_public || null,
                            })
                            .eq('id', prospect.id)

                        return {
                            prospectId: prospect.id,
                            companyName: prospect.company_name,
                            success: true,
                            reused: true,
                        }
                    }
                }

                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'company_name': prospect.company_name,
                        'company_domain': prospect.company_domain.replace(/^https?:\/\//, ''),
                        'webscan_type': prospect.webscan_type,
                        'contact_email': prospect.contact_email,
                        'contact_name': prospect.contact_name,
                        'prospect_id': prospect.id,
                    }),
                })

                if (!response.ok) {
                    throw new Error(`Failed to trigger workflow for ${prospect.company_name}`)
                }

                // Update prospect status to processing
                await supabase
                    .from('prospects')
                    .update({ status: 'processing' })
                    .eq('id', prospect.id)

                return {
                    prospectId: prospect.id,
                    companyName: prospect.company_name,
                    success: true,
                    reused: false,
                }
            })
        )

        // Count successes and failures
        const successes = results.filter((r) => r.status === 'fulfilled')
        const failures = results.filter((r) => r.status === 'rejected')

        return NextResponse.json({
            message: `Successfully triggered ${successes.length} workflows`,
            total: prospectIds.length,
            successful: successes.length,
            failed: failures.length,
            results: results.map((r) =>
                r.status === 'fulfilled' ? r.value : { error: r.reason.message }
            ),
        })

    } catch (error) {
        console.error('Execute scans error:', error)
        return NextResponse.json(
            { error: 'Failed to execute scans' },
            { status: 500 }
        )
    }
}
