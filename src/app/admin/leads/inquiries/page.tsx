import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function NewInquiriesPage() {
    const supabase = await createClient()

    // New Inquiries:
    // Status = 'new_inquiry' (these are users who signed up but haven't clicked Generate Report yet)

    const { data: prospects, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('status', 'new_inquiry')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching new inquiries:', error)
    }

    return <DashboardClient initialProspects={prospects || []} title="New Inquiries" subtitle="Users who signed up but haven't generated report" allowAdd={false} />
}
