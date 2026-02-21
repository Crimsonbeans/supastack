import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function NewInquiriesPage() {
    const supabase = await createClient()

    // New Inquiries: Inbound users who signed up but haven't visited dashboard yet
    // Filter: source = 'inbound' AND qualified_at IS NULL AND status != 'converted_to_customer'
    // Note: Converted prospects are shown in /admin/customers instead

    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('source', 'inbound')
        .is('qualified_at', null)
        .neq('status', 'converted_to_customer')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching new inquiries:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="New Inquiries" subtitle="Users who signed up but haven't generated report" allowAdd={false} />
}
