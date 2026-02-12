import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminLayoutContent from './layout-content'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Auth Check (Top Level for all admin routes)
    const cookieStore = await cookies()
    const isAdmin = cookieStore.get('admin_session')?.value === 'true'
    const adminName = cookieStore.get('admin_name')?.value || 'Admin'

    if (!isAdmin) {
        redirect('/controlpanel')
    }

    return (
        <AdminLayoutContent adminName={adminName}>
            {children}
        </AdminLayoutContent>
    )
}
