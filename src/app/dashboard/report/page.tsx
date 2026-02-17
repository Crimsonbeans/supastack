import { createClient } from '@/lib/supabase/server'
import ClientDashboard from '@/components/dashboard/ClientDashboard'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
    const supabase = await createClient()

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Please login.</div>
    }

    // Prepare User Data for Autofill
    const emailDomain = user.email?.split('@')[1] || ''

    const userData = {
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        companyName: user.user_metadata?.company_name || '',
        domain: emailDomain
    }

    // 2. Get User's Public Profile & Organization
    const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (userError || !userProfile?.organization_id) {
        console.error('User fetching error or no org:', userError)
        return <ClientDashboard error="Your account setup is incomplete (Organization missing). Please contact support." />
    }

    // 3. Get Organization's Report (Latest one)
    const { data: report, error: reportError } = await supabase
        .from('prospects')
        .select('*')
        .eq('organization_id', userProfile.organization_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (reportError && reportError.code !== 'PGRST116') {
        console.error('Report fetching error:', reportError)
        return <ClientDashboard error="Failed to fetch report data." />
    }

    return <ClientDashboard report={report} userData={userData} userOrganizationId={userProfile.organization_id} />
}
