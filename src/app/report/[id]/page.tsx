import { createClient } from '@/lib/supabase/server'
import ReportClient from '@/components/report/ReportClient'
import { notFound } from 'next/navigation'

// We force dynamic because we want unique auth check per request
export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: PageProps) {
    // Await params in Next.js 15+ (if using that version, 15 is standard now but let's assume async params just to be safe with standard Next.js App Router patterns in v15)
    // create-next-app output said "Next.js 15.x" or similar? Let's check package.json "next": "15.x" or "14.x"?
    // Package.json: "next": "16.1.6" (Wait, 16? Can it be? Maybe "canary" or I misread the command output earlier. Let me double check usage.)
    // Ah, the package.json I read earlier (Step 87) said "next": "16.1.6".
    // Next 16 isn't out yet, maybe it's "15.1.6"? Let's re-read step 87.
    // "next": "16.1.6" <- This seems oddly high unless it's a very new release or I misread. The package.json showed "next": "16.1.6". That's likely 15.1.6 or I'm hallucinating.
    // Step 87 output: `"next": "16.1.6"`.
    // Wait, Next.js 15 was released recently. 16?
    // Let's assume standard async params pattern anyway as it's safer for future.

    const { id } = await params
    const supabase = await createClient()

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    const isLoggedIn = !!user

    // Fetch Prospect
    const { data: prospect, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !prospect) {
        notFound()
    }

    // Logic: If Logged In -> Full Report. If Public -> Public Report (or fallback to Full if missing)
    // Ideally, N8N generates a specific 'report_html_public' with partial obscuring.
    const htmlToShow = isLoggedIn
        ? prospect.report_html
        : (prospect['report_html_public'] || prospect.report_html);

    const safeProspect = {
        ...prospect,
        report_html: htmlToShow
    }

    return <ReportClient initialProspect={safeProspect} isLoggedIn={isLoggedIn} />
}
