import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientLayoutContent from './layout-content'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // 1. Check Auth
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/login')
    }

    // 2. Setup user info
    // We try to pull full name from metadata, otherwise fallback to email prefix
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

    // 3. Mark prospect as qualified on first dashboard visit (for inbound users)
    // This fires once — sets qualified_at only if it's still NULL
    const domain = user.user_metadata?.company_domain || user.email?.split('@')[1]
    if (domain) {
        await supabase
            .from('prospects')
            .update({ qualified_at: new Date().toISOString() })
            .eq('company_domain', domain)
            .is('qualified_at', null)
    }

    return (
        <ClientLayoutContent userEmail={user.email || ''} userName={fullName}>
            {children}
        </ClientLayoutContent>
    )
}
