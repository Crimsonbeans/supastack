import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function QualifiedPage() {
    const supabase = await createClient()

    // Qualified: Prospects where a user has actually engaged (signed up + visited dashboard)
    // Filter: qualified_at IS NOT NULL

    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .not('qualified_at', 'is', null)
        .order('qualified_at', { ascending: false })

    if (error) {
        console.error('Error fetching qualified leads:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="Qualified Leads" subtitle="Users who generated reports or claimed their company" allowAdd={false} />
}
