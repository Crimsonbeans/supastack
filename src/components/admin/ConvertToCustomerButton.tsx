'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Loader2, AlertCircle, Users, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Prospect {
    id: string
    company_name: string
    contact_name: string
    contact_email: string
    status: string
    report_html: string | null
    qualified_at: string | null
    organization_id?: string
}

interface ConvertToCustomerButtonProps {
    prospect: Prospect
    onSuccess?: () => void
    variant?: 'icon' | 'large'
    disabled?: boolean
}

export default function ConvertToCustomerButton({
    prospect,
    onSuccess,
    variant = 'icon',
    disabled = false
}: ConvertToCustomerButtonProps) {
    const [showDialog, setShowDialog] = useState(false)

    // Only show for qualified leads with Phase 1 reports
    const canConvert = prospect.qualified_at !== null && prospect.report_html

    if (!canConvert) {
        return null
    }

    return (
        <>
            {variant === 'large' ? (
                <button
                    onClick={() => setShowDialog(true)}
                    disabled={disabled}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                >
                    <CheckCircle className="w-4 h-4" />
                    Convert to Customer
                </button>
            ) : (
                <button
                    onClick={() => setShowDialog(true)}
                    className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 transition-all"
                    title="Convert to Customer"
                >
                    <CheckCircle className="w-4 h-4" />
                </button>
            )}

            {showDialog && (
                <MultiProspectConversionDialog
                    initialProspect={prospect}
                    onClose={() => setShowDialog(false)}
                    onSuccess={onSuccess}
                />
            )}
        </>
    )
}

// Multi-prospect conversion dialog
function MultiProspectConversionDialog({
    initialProspect,
    onClose,
    onSuccess
}: {
    initialProspect: Prospect
    onClose: () => void
    onSuccess?: () => void
}) {
    const [orgProspects, setOrgProspects] = useState<Prospect[]>([])
    const [selectedProspectIds, setSelectedProspectIds] = useState<Set<string>>(
        new Set([initialProspect.id])
    )
    const [loadingProspects, setLoadingProspects] = useState(true)
    const [converting, setConverting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        signed_at: new Date().toISOString().split('T')[0],
        account_manager: '',
        notes: ''
    })

    // Fetch all prospects from same organization
    useEffect(() => {
        async function fetchOrgProspects() {
            if (!initialProspect.organization_id) {
                setError('Prospect has no organization_id')
                setLoadingProspects(false)
                return
            }

            try {
                const response = await fetch(
                    `/api/admin/get-org-prospects?organization_id=${initialProspect.organization_id}`
                )
                const data = await response.json()

                if (response.ok) {
                    setOrgProspects(data.prospects || [])
                } else {
                    setError(data.error || 'Failed to load organization prospects')
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoadingProspects(false)
            }
        }

        fetchOrgProspects()
    }, [initialProspect.organization_id])

    const toggleProspect = (prospectId: string) => {
        const newSet = new Set(selectedProspectIds)
        if (newSet.has(prospectId)) {
            newSet.delete(prospectId)
        } else {
            newSet.add(prospectId)
        }
        setSelectedProspectIds(newSet)
    }

    const handleConvert = async () => {
        if (selectedProspectIds.size === 0) {
            setError('Please select at least one prospect to convert')
            return
        }

        setConverting(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/convert-to-customer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prospect_ids: Array.from(selectedProspectIds),
                    contract_details: formData
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Conversion failed')
            }

            toast.success(`${data.customers_created} prospect(s) converted to customer`, {
                description: initialProspect.company_name
            })
            onClose()
            onSuccess?.()

        } catch (err: any) {
            setError(err.message)
            toast.error('Conversion failed', { description: err.message })
        } finally {
            setConverting(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-xl font-bold">
                        Convert {initialProspect.company_name} to Customer
                    </h3>
                </div>

                {/* Organization Prospects Selection */}
                <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm text-slate-700">
                        Select Prospects to Convert
                        {!loadingProspects && ` (${orgProspects.length} found)`}
                    </h4>

                    {loadingProspects ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading organization prospects...</span>
                        </div>
                    ) : orgProspects.length === 0 ? (
                        <div className="text-sm text-slate-500">
                            No other prospects found for this organization
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {orgProspects.map(p => {
                                const canConvert = p.status === 'completed' && p.report_html
                                const isSelected = selectedProspectIds.has(p.id)
                                const isInitial = p.id === initialProspect.id

                                return (
                                    <label
                                        key={p.id}
                                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                                            isSelected
                                                ? 'bg-indigo-50 border-indigo-200'
                                                : 'hover:bg-slate-50'
                                        } ${!canConvert ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleProspect(p.id)}
                                            disabled={!canConvert}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {p.contact_name || 'Unknown'}
                                                </span>
                                                {isInitial && (
                                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                                        Selected
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500">{p.contact_email}</span>
                                            {!canConvert && (
                                                <span className="text-xs text-red-500 block mt-0.5">
                                                    No Phase 1 report
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    )}

                    <div className="text-xs text-slate-500 pt-2 border-t">
                        {selectedProspectIds.size} prospect(s) selected for conversion
                    </div>
                </div>

                {/* Contract Details */}
                <div className="space-y-3 border-t pt-4">
                    <h4 className="font-medium text-sm text-slate-700">Contract Details</h4>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Contract Signed Date
                        </label>
                        <input
                            type="date"
                            value={formData.signed_at}
                            onChange={(e) => setFormData({ ...formData, signed_at: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Account Manager (optional)
                        </label>
                        <input
                            type="text"
                            value={formData.account_manager}
                            onChange={(e) => setFormData({ ...formData, account_manager: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            placeholder="Name or email"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Notes (optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            rows={3}
                            placeholder="Contract details, special terms, etc."
                        />
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                    <button
                        onClick={handleConvert}
                        disabled={converting || selectedProspectIds.size === 0}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {converting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Converting {selectedProspectIds.size} prospect(s)...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Convert {selectedProspectIds.size} to Customer
                                {selectedProspectIds.size > 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={converting}
                        className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
