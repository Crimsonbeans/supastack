import { createClient } from '@/lib/supabase/server'
import MQLeadsClient from '@/components/admin/MQLeadsClient'

export const dynamic = 'force-dynamic'

export default async function MQLeadsPage() {
    const supabase = await createClient()

    const { data: leads, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching leads:', error)
    }

    // Map prospects to MQLead type, defaulting source to 'outbound' if undefined
    const validLeads = (leads || []).map(lead => ({
        ...lead,
        source: lead.source || 'outbound'
    }))

    return <MQLeadsClient initialLeads={validLeads} />
}
