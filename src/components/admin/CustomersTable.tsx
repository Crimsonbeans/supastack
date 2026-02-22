'use client'

import { useState } from 'react'
import { Calendar, Building, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CustomerProgress from './CustomerProgress'

interface Customer {
    id: string
    created_at: string
    converted_at: string
    contract_signed_at: string
    contract_type: string | null
    account_manager: string | null
    status: string
    phase: string
    notes: string | null
    tags: string[] | null
    conversion_batch_id: string | null
    organization: {
        id: string
        name: string
        domain: string
    } | null
    prospect: {
        id: string
        company_name: string
        contact_name: string
        contact_email: string
        created_at: string
    } | null
}

interface CustomersTableProps {
    customers: Customer[]
}

export default function CustomersTable({ customers }: CustomersTableProps) {
    const router = useRouter()
    const [progressFilter, setProgressFilter] = useState<'all' | 'req_generated' | 'report1' | 'report2' | 'report3' | 'report4'>('all')

    const filtered = customers.filter(() => {
        // progressFilter will be used once phase 2 progress tracking is implemented
        return true
    })

    return (
        <div className="space-y-4">
            {/* Progress Filters */}
            <div className="flex items-center gap-2">
                {([
                    { key: 'all', label: 'All' },
                    { key: 'req_generated', label: 'Requirement Generated' },
                    { key: 'report1', label: 'Report 1 Generated' },
                    { key: 'report2', label: 'Report 2 Generated' },
                    { key: 'report3', label: 'Report 3 Generated' },
                    { key: 'report4', label: 'Report 4 Generated' },
                ] as const).map(item => (
                    <button
                        key={item.key}
                        onClick={() => setProgressFilter(item.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            progressFilter === item.key
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="border rounded-lg p-12 text-center">
                    <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No customers found</h3>
                    <p className="text-sm text-slate-500">
                        {progressFilter !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Convert qualified prospects to get started'}
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-hidden bg-white">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Contract
                                </th>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Progress
                                </th>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Account Mgr
                                </th>
                                <th className="text-left p-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="w-10 p-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(customer => (
                                <tr
                                    key={customer.id}
                                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                    onClick={() => router.push(`/admin/customers/${customer.id}`)}
                                >
                                    <td className="p-3">
                                        <div className="font-medium text-sm text-slate-900">
                                            {customer.organization?.name || customer.prospect?.company_name || 'Unknown'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {customer.organization?.domain}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-sm text-slate-900">
                                            {customer.prospect?.contact_name || '—'}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {customer.prospect?.contact_email || '—'}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="text-xs space-y-0.5">
                                            <div className="flex items-center gap-1 text-slate-600">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(customer.contract_signed_at).toLocaleDateString()}
                                            </div>
                                            {customer.contract_type && (
                                                <div className="text-slate-500">
                                                    {customer.contract_type.replace(/_/g, ' ')}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <CustomerProgress customerId={customer.id} />
                                    </td>
                                    <td className="p-3">
                                        <div className="text-sm text-slate-600">
                                            {customer.account_manager || '—'}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                                            customer.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : customer.status === 'churned'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {customer.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
