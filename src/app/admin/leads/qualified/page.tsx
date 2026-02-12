import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function QualifiedPage() {
    const supabase = await createClient()

    // Qualified:
    // 1. Inbound (New Inquiries) who have generated a report (status != 'new_inquiry')
    // 2. Outbound Prospects who have signed up (organization_id IS NOT NULL)

    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        // Qualified Logic:
        // 1. Inbound: Must have moved past 'new_inquiry' status (meaning report generated)
        // 2. Outbound: Must proceed beyond 'pending' (e.g., scanned/engaged)
        .or('and(source.eq.inbound,status.neq.new_inquiry),and(source.eq.outbound,status.neq.pending)')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching qualified leads:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="Qualified Leads" subtitle="Users who generated reports or claimed their company" allowAdd={false} />
}
