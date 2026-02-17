import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function ProspectsPage() {
    const supabase = await createClient()

    // Prospects: Outbound list (manually added, not yet qualified)
    // Filter: source = 'outbound' AND qualified_at IS NULL (no user has signed up yet)
    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('source', 'outbound')
        .is('qualified_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching prospects:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="Prospects (Outbound)" subtitle="Manually added companies" allowAdd={true} />
}
