import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
    const supabase = await createClient()

    // Prospects: Outbound list (manually added)
    // Filter: source = 'outbound' AND status = 'pending' (not yet engaged/processed)
    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('source', 'outbound')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching prospects:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="Prospects (Outbound)" subtitle="Manually added companies" allowAdd={true} />
}
