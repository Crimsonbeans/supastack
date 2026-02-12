import { createClient } from '@/lib/supabase/server'
import ClientDashboard from '@/components/dashboard/ClientDashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Get Current Use
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Should be caught by middleware/layout, but safe fallback
        return <div>Please login.</div>
    }

    // Prepare User Data for Autofill
    // Extract domain from email for default company domain
    const emailDomain = user.email?.split('@')[1] || ''

    const userData = {
        name: user.user_metadata?.full_name || '',
        email: user.email || '',
        companyName: user.user_metadata?.company_name || '',
        domain: emailDomain
    }

    // 2. Get User's Public Profile & Organization
    // We select organization_id but also want to be robust if this fails
    const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (userError || !userProfile?.organization_id) {
        // If user is not linked to an organization, we can still show the dashboard
        // but maybe with a warning or just pass userData so they can start fresh?
        // Actually, our previous logic was to error out.
        // However, if they just signed up, they SHOULD have an organization linked via trigger.
        // If trigger failed, they might be in a weird state.

        // Let's allow them to see the "Generate Report" screen even if org link is missing, 
        // effectively treating them as a new user who needs to set up. 
        // (Though the form submission might fail if it relies on org_id, but the current form creates a prospect)

        // BETTER APPROACH: Return the dashboard with userData, and let the component handle "Link Organization" or "Create Prospect" logic.
        // But for consistency with previous logic, let's keep the error if org is missing, as it implies a system failure given our signup flow.

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

    // Note: If no report found, 'report' is null, reportError might be 'PGRST116' (0 rows)
    if (reportError && reportError.code !== 'PGRST116') {
        console.error('Report fetching error:', reportError)
        return <ClientDashboard error="Failed to fetch report data." />
    }

    return <ClientDashboard report={report} userData={userData} userOrganizationId={userProfile.organization_id} />
}
