import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function OutboundPage() {
    const supabase = await createClient()

    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching prospects:', error)
    }

    return <DashboardClient initialProspects={prospects || []} />
}
