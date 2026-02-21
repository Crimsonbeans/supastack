import { supabaseAdmin } from '@/lib/supabase/admin'
import CustomersTable from '@/components/admin/CustomersTable'

export const dynamic = 'force-dynamic'

export default async function CustomersPage() {
    const supabase = supabaseAdmin

    const { data: customers, error } = await supabase
        .from('customers')
        .select(`
            *,
            organization:organizations(id, name, domain),
            prospect:prospects(
                id,
                company_name,
                contact_name,
                contact_email,
                created_at
            )
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching customers:', error)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Converted prospects with active contracts
                    </p>
                </div>
                <div className="text-sm text-slate-500">
                    {customers?.length || 0} total customer{customers?.length !== 1 ? 's' : ''}
                </div>
            </div>

            <CustomersTable customers={customers || []} />
        </div>
    )
}
