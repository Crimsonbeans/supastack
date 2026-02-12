'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    Plus,
    Play,
    CheckSquare,
    Square,
    Loader2,
    Search,
    Database,
    Eye,
    Edit,
    Trash2,
    X,
    Upload,
    FileSpreadsheet,
    ArrowLeft,
    Save,
    FileText,
    ChevronDown,
    ExternalLink,
    AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Prospect = {
    id: string
    company_name: string
    company_domain: string
    webscan_type: string
    contact_name?: string | null
    contact_email?: string | null
    contact_linkedin?: string | null
    status: string
    confidence_score: number
}

export default function DashboardClient({
    initialProspects,
    title = 'Prospects',
    subtitle = 'Manage your pipeline',
    allowAdd = true
}: {
    initialProspects: Prospect[],
    title?: string,
    subtitle?: string,
    allowAdd?: boolean
}) {
    const [prospects, setProspects] = useState<Prospect[]>(initialProspects)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showCreateScreen, setShowCreateScreen] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [viewingProspect, setViewingProspect] = useState<Prospect | null>(null)
    const [editingProspect, setEditingProspect] = useState<Prospect | null>(null)
    const [deletingProspect, setDeletingProspect] = useState<Prospect | null>(null)
    const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single')

    const [formData, setFormData] = useState({
        company_name: '',
        company_domain: '',
        webscan_type: 'GTM AI Readiness',
        contact_name: '',
        contact_email: '',
        contact_linkedin: ''
    })



    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const [supabase] = useState(() => createClient())

    useEffect(() => {
        const channel = supabase.channel('prospect-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'prospects',
                },
                (payload) => {
                    const { new: newRecord, old: oldRecord, eventType } = payload

                    if (eventType === 'INSERT') {
                        // Optimistically or just wait for refresh? Refresh is safer but slower.
                        // Let's rely on refresh but notify.
                        // toast.success(`New prospect added: ${newRecord.company_name}`) 
                        // Actually, inserting via UI already toasts. This might double toast if I do it here too?
                        // "make it like toast notification everywhere".
                        // If I toast here AND in handleSubmit, I get double.
                        // I can remove toast from handleSubmit if I rely on this?
                        // No, handleSubmit is immediate feedback for the user doing the action.
                        // This listener catches background changes (workflow updates) or other users.
                        // For "workflow updates", it's UPDATE.
                        // So I'll focus on UPDATE.
                        router.refresh()
                    } else if (eventType === 'UPDATE') {
                        const statusChanged = (newRecord as any).status !== (oldRecord as any).status
                        if (statusChanged) {
                            toast.info(`Status updated: ${(newRecord as any).status}`)
                        }
                        router.refresh()
                    } else if (eventType === 'DELETE') {
                        router.refresh()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, router])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Check for potential duplicates based on domain + email (if provided)
            let query = supabase
                .from('prospects')
                .select('id')
                .eq('company_domain', formData.company_domain)

            if (formData.contact_email) {
                query = query.eq('contact_email', formData.contact_email)
            } else if (formData.contact_name) {
                // If no email, try to match on name
                query = query.eq('contact_name', formData.contact_name)
            } else {
                // If no unique contact info, check for generic entry
                query = query.is('contact_email', null).is('contact_name', null)
            }

            const { data: existing, error: checkError } = await query.maybeSingle()

            if (checkError) {
                console.error('Error checking duplicates:', checkError)
            }

            if (existing) {
                toast.error('This prospect already exists')
                setIsLoading(false)
                return
            }

            // Ensure organization exists (using admin API to bypass RLS)
            let organizationId: string | null = null

            try {
                const orgResponse = await fetch('/api/ensure-organization', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        company_name: formData.company_name,
                        company_domain: formData.company_domain
                    })
                })

                if (!orgResponse.ok) {
                    const errorData = await orgResponse.json()
                    throw new Error(errorData.error || 'Failed to ensure organization')
                }

                const orgData = await orgResponse.json()
                organizationId = orgData.id

                // Validate company name consistency for existing organizations
                if (!orgData.newlyCreated && orgData.name) {
                    const inputName = formData.company_name.trim().toLowerCase()
                    const existingName = orgData.name.trim().toLowerCase()

                    if (inputName !== existingName) {
                        // Use concise error message as requested
                        toast.error(`Another company '${orgData.name}' with same domain already exists. Check company name or domain name.`)
                        setIsLoading(false)
                        return
                    }
                }

                if (orgData.newlyCreated) {
                    toast.success('New organization created for this domain')
                }
            } catch (orgErr: any) {
                console.error('Organization check failed:', orgErr)
                toast.error(`Organization Error: ${orgErr.message}`)
                setIsLoading(false)
                return
            }

            // Use admin API to create prospect (bypasses RLS with service role key)
            const response = await fetch('/api/admin/create-prospect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_name: formData.company_name,
                    company_domain: formData.company_domain,
                    webscan_type: formData.webscan_type,
                    contact_name: formData.contact_name || null,
                    contact_email: formData.contact_email || null,
                    contact_linkedin: formData.contact_linkedin || null,
                    status: 'pending',
                    source: 'outbound',
                    confidence_score: 0
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to create prospect')
            }

            const data = await response.json()

            setProspects(prev => [data, ...prev])
            setFormData({
                company_name: '',
                company_domain: '',
                webscan_type: 'GTM AI Readiness',
                contact_name: '',
                contact_email: '',
                contact_linkedin: ''
            })
            toast.success('Prospect created successfully')
            setShowCreateScreen(false) // Return to prospect list
            router.refresh()
        } catch (error: any) {
            console.error('Error adding prospect:', error)
            toast.error(`Error adding prospect: ${error?.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formDataFile = new FormData()
        formDataFile.append('file', file)

        try {
            const response = await fetch('/api/upload-prospects', {
                method: 'POST',
                body: formDataFile,
            })

            if (!response.ok) throw new Error('Upload failed')

            const result = await response.json()
            toast.success(`Successfully uploaded ${result.count} prospects`)
            router.refresh()
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload CSV')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (fileInputRef.current) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(file)
                fileInputRef.current.files = dataTransfer.files
                handleFileUpload({ target: { files: dataTransfer.files } } as any)
            }
        }
    }

    const handleExecute = async () => {
        if (selectedIds.size === 0) return
        setIsLoading(true)

        try {
            const response = await fetch('/api/execute-scans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prospectIds: Array.from(selectedIds) }),
            })

            if (!response.ok) throw new Error('Execution failed')

            toast.success(`Started processing ${selectedIds.size} prospects`)
            setSelectedIds(new Set())
            router.refresh()
        } catch (error) {
            console.error('Execute error:', error)
            toast.error('Failed to execute scans')
        } finally {
            setIsLoading(false)
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === prospects.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(prospects.map(p => p.id)))
        }
    }

    const handleView = (prospect: Prospect) => {
        setViewingProspect(prospect)
    }

    const handleEdit = (prospect: Prospect) => {
        setEditingProspect(prospect)
        setFormData({
            company_name: prospect.company_name,
            company_domain: prospect.company_domain,
            webscan_type: prospect.webscan_type,
            contact_name: prospect.contact_name || '',
            contact_email: prospect.contact_email || '',
            contact_linkedin: prospect.contact_linkedin || ''
        })
        setShowCreateScreen(true)
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingProspect) return
        setIsLoading(true)

        try {
            const { data, error } = await supabase
                .from('prospects')
                .update({
                    company_name: formData.company_name,
                    company_domain: formData.company_domain,
                    webscan_type: formData.webscan_type,
                    contact_name: formData.contact_name || null,
                    contact_email: formData.contact_email || null,
                    contact_linkedin: formData.contact_linkedin || null,
                })
                .eq('id', editingProspect.id)
                .select()

            if (error) throw error

            if (data) {
                setProspects(prev => prev.map(p => p.id === editingProspect.id ? data[0] : p))
                setFormData({
                    company_name: '',
                    company_domain: '',
                    webscan_type: 'GTM AI Readiness',
                    contact_name: '',
                    contact_email: '',
                    contact_linkedin: ''
                })
                setEditingProspect(null)
                setShowCreateScreen(false)
                router.refresh()
                toast.success('Prospect updated successfully')
            }
        } catch (error) {
            console.error('Error updating prospect:', error)
            toast.error('Error updating prospect')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = (prospect: Prospect) => {
        setDeletingProspect(prospect)
    }

    const executeDelete = async () => {
        if (!deletingProspect) return
        setIsLoading(true)

        try {
            const { error } = await supabase
                .from('prospects')
                .delete()
                .eq('id', deletingProspect.id)

            if (error) throw error

            setProspects(prev => prev.filter(p => p.id !== deletingProspect.id))
            router.refresh()
            toast.success('Prospect deleted successfully')
            setDeletingProspect(null)
        } catch (error) {
            console.error('Error deleting prospect:', error)
            toast.error('Error deleting prospect')
        } finally {
            setIsLoading(false)
        }
    }


    if (showCreateScreen) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header - Minimal with Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                setShowCreateScreen(false)
                                setEditingProspect(null)
                                setUploadMode('single')
                                setFormData({
                                    company_name: '',
                                    company_domain: '',
                                    webscan_type: 'GTM AI Readiness',
                                    contact_name: '',
                                    contact_email: '',
                                    contact_linkedin: ''
                                })
                            }}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-foreground tracking-tight">
                                {editingProspect ? 'Edit Prospect' : uploadMode === 'bulk' ? 'Bulk Import' : 'New Prospect'}
                            </h1>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {editingProspect
                                    ? 'Update prospect information'
                                    : uploadMode === 'bulk'
                                        ? 'Upload CSV to import multiple prospects'
                                        : 'Add a single prospect manually'}
                            </p>
                        </div>
                    </div>

                    {!editingProspect && (
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setUploadMode('single')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                                    uploadMode === 'single'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                Manual Entry
                            </button>
                            <button
                                onClick={() => setUploadMode('bulk')}
                                className={cn(
                                    "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                                    uploadMode === 'bulk'
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                Bulk Import
                            </button>
                        </div>
                    )}
                </div>

                {/* Manual Entry - Bento Card */}
                {(uploadMode === 'single' || editingProspect) && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Edit className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">
                                    {editingProspect ? 'Edit Details' : 'Prospect Details'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {editingProspect ? 'Update prospect information below' : 'Enter prospect information below'}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={editingProspect ? handleUpdate : handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        name="company_name"
                                        placeholder="Acme Corporation"
                                        value={formData.company_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Domain <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            name="company_domain"
                                            placeholder="acme.com"
                                            value={formData.company_domain}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Scan Type</label>
                                    <div className="relative">
                                        <select
                                            name="webscan_type"
                                            value={formData.webscan_type}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none"
                                        >
                                            <option value="GTM AI Readiness">GTM AI Readiness</option>
                                            <option value="Partnership Readiness">Partnership Readiness</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Name</label>
                                    <input
                                        name="contact_name"
                                        placeholder="John Doe"
                                        value={formData.contact_name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">Contact Email</label>
                                    <input
                                        name="contact_email"
                                        type="email"
                                        placeholder="john@acme.com"
                                        value={formData.contact_email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">LinkedIn Profile</label>
                                    <input
                                        name="contact_linkedin"
                                        placeholder="linkedin.com/in/johndoe"
                                        value={formData.contact_linkedin}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateScreen(false)
                                        setEditingProspect(null)
                                    }}
                                    className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingProspect ? 'Update Prospect' : 'Create Prospect'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Bulk Upload - Bento Card */}
                {
                    (uploadMode === 'bulk' && !editingProspect) && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 rounded-lg bg-blue-50">
                                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Bulk Import</h2>
                                    <p className="text-sm text-gray-500">Upload CSV file to import prospects</p>
                                </div>
                            </div>

                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative border-2 border-dashed rounded-xl p-12 transition-all cursor-pointer flex flex-col items-center text-center space-y-4",
                                    dragActive
                                        ? "border-blue-500 bg-blue-50/50"
                                        : "border-gray-200 hover:border-blue-400 hover:bg-gray-50"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />

                                <div className="p-4 rounded-full bg-blue-50 ring-8 ring-blue-50/50">
                                    {isUploading ? (
                                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    ) : (
                                        <Upload className="w-8 h-8 text-blue-600" />
                                    )}
                                </div>

                                <div>
                                    <p className="text-base font-semibold text-gray-900 mb-1">
                                        {isUploading ? 'Uploading prospects...' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        CSV file with columns: company_name, domain, type, contact
                                    </p>
                                </div>

                                <div className="pt-2 text-xs text-gray-400">
                                    Maximum file size: 10MB
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        )
    }

    return (
        <>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{title}</h1>
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    </div>
                    {allowAdd && (
                        <button
                            onClick={() => setShowCreateScreen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            New Prospect
                        </button>
                    )}
                </div>

                {/* Bento Table Card */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Search className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {prospects.length} {prospects.length === 1 ? 'Prospect' : 'Prospects'}
                            </span>
                        </div>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={handleExecute}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                Execute ({selectedIds.size})
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left py-3 px-6 w-10">
                                        <button onClick={toggleSelectAll} className="hover:bg-gray-200 rounded p-1 transition-colors">
                                            {selectedIds.size === prospects.length && prospects.length > 0 ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="text-left py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="text-left py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Domain</th>
                                    <th className="text-left py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="text-left py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                    <th className="text-right py-3 px-6 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {prospects.map((prospect) => (
                                    <tr
                                        key={prospect.id}
                                        className={cn(
                                            "group cursor-pointer transition-all hover:bg-gray-50",
                                            selectedIds.has(prospect.id) && "bg-blue-50"
                                        )}
                                        onClick={() => toggleSelect(prospect.id)}
                                    >
                                        <td className="py-3 px-6" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleSelect(prospect.id)} className="hover:bg-gray-200 rounded p-1 transition-colors">
                                                {selectedIds.has(prospect.id) ? (
                                                    <CheckSquare className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-gray-400" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {prospect.company_name}
                                            </div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <a
                                                href={`https://${prospect.company_domain}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-blue-600 hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {prospect.company_domain}
                                            </a>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium">
                                                {prospect.webscan_type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
                                                prospect.status === 'completed'
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : prospect.status === 'processing'
                                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                                        : prospect.status === 'new_inquiry'
                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                            : "bg-gray-100 text-gray-600 border border-gray-200"
                                            )}>
                                                {prospect.status === 'completed' ? 'REPORT GENERATED' : prospect.status === 'new_inquiry' ? 'NEW INQUIRY' : prospect.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 max-w-[60px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 transition-all rounded-full"
                                                        style={{ width: `${prospect.confidence_score}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-700 tabular-nums">
                                                    {prospect.confidence_score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6">
                                            <div className="flex items-center justify-end gap-1 opacity-100">
                                                {prospect.status === 'completed' && (
                                                    <a
                                                        href={`/report/${prospect.id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 transition-all font-medium flex items-center gap-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                        title="Open Report"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                    </a>
                                                )}
                                                <button
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleView(prospect)
                                                    }}
                                                    title="View details"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleEdit(prospect)
                                                    }}
                                                    title="Edit prospect"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(prospect)
                                                    }}
                                                    title="Delete prospect"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {prospects.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-3 rounded-xl bg-accent">
                                                    <Database className="w-6 h-6 text-muted-foreground/30" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground mb-0.5">No prospects yet</p>
                                                    <p className="text-xs text-muted-foreground">Click "New Prospect" to get started</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>



            {/* Delete Confirmation Modal */}
            {deletingProspect && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setDeletingProspect(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-semibold text-gray-900">Delete Prospect?</h3>
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete <span className="font-medium text-gray-900">{deletingProspect.company_name}</span>? This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setDeletingProspect(null)}
                                    className="flex-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeDelete}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {/* View Modal */}
            {viewingProspect && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setViewingProspect(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{viewingProspect.company_name}</h2>
                                <p className="text-sm text-gray-500 mt-1">Prospect Details</p>
                            </div>
                            <button
                                onClick={() => setViewingProspect(null)}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto space-y-8">
                            {/* Main Info Grid */}
                            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Name</label>
                                    <p className="text-sm font-medium text-gray-900">{viewingProspect.company_name}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Domain</label>
                                    <a href={`https://${viewingProspect.company_domain}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                                        {viewingProspect.company_domain}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scan Type</label>
                                    <p className="text-sm font-medium text-gray-900">{viewingProspect.webscan_type}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</label>
                                    <div>
                                        <span className={cn(
                                            "inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border",
                                            viewingProspect.status === 'completed'
                                                ? "bg-green-50 text-green-700 border-green-200"
                                                : viewingProspect.status === 'processing'
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : viewingProspect.status === 'pending'
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-gray-50 text-gray-600 border-gray-200"
                                        )}>
                                            {viewingProspect.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Score Section */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confidence Score</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${viewingProspect.confidence_score}%` }}
                                        />
                                    </div>
                                    <span className="text-lg font-bold text-gray-900 tabular-nums">{viewingProspect.confidence_score}%</span>
                                </div>
                            </div>

                            {/* Contact Info (if available) */}
                            {(viewingProspect.contact_name || viewingProspect.contact_email || viewingProspect.contact_linkedin) && (
                                <div className="pt-8 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                                        Contact Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                        {viewingProspect.contact_name && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Name</label>
                                                <p className="text-sm font-medium text-gray-900">{viewingProspect.contact_name}</p>
                                            </div>
                                        )}
                                        {viewingProspect.contact_email && (
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                                                <a href={`mailto:${viewingProspect.contact_email}`} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                                                    {viewingProspect.contact_email}
                                                </a>
                                            </div>
                                        )}
                                        {viewingProspect.contact_linkedin && (
                                            <div className="space-y-1.5 col-span-2">
                                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">LinkedIn</label>
                                                <a href={viewingProspect.contact_linkedin} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline block truncate">
                                                    {viewingProspect.contact_linkedin}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 px-8 py-5 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                onClick={() => setViewingProspect(null)}
                                className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-semibold transition-all shadow-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setViewingProspect(null)
                                    handleEdit(viewingProspect)
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
