'use client'

import { useState } from 'react'
import {
    Search,
    Database,
    FileText,
    ExternalLink,
    Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'

type MQLead = {
    id: string
    company_name: string
    company_domain: string
    webscan_type: string
    contact_name?: string | null
    contact_email?: string | null
    status: string
    report_html?: string | null
    source?: string | null // 'inbound' | 'outbound'
}

export default function MQLeadsClient({ initialLeads }: { initialLeads: MQLead[] }) {
    const [leads, setLeads] = useState<MQLead[]>(initialLeads)
    const [searchQuery, setSearchQuery] = useState('')

    // Filter leads based on search
    const filteredLeads = leads.filter(lead => {
        const query = searchQuery.toLowerCase()
        return (
            lead.company_name.toLowerCase().includes(query) ||
            lead.company_domain.toLowerCase().includes(query) ||
            lead.contact_email?.toLowerCase().includes(query) ||
            lead.contact_name?.toLowerCase().includes(query)
        )
    })

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">MQLeads</h1>
                    <p className="text-xs text-muted-foreground">Marketing Qualified Leads (MQLs)</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
                {/* Table Toolbar */}
                <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between bg-accent/30 gap-4">
                    <div className="flex items-center gap-2 flex-1 max-w-sm">
                        <div className="relative w-full">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider bg-white/50 px-3 py-1.5 rounded-lg border border-border/50">
                            Total: {filteredLeads.length}
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border/50 bg-accent/20">
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Company</th>
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</th>
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Domain</th>
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                                <th className="text-left py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="text-right py-3 px-6 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="group hover:bg-accent/30 transition-colors">
                                    <td className="py-3 px-6">
                                        <div className="text-sm font-medium text-foreground">{lead.company_name}</div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <div className="text-sm text-foreground/80">{lead.contact_name || '-'}</div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <div className="text-sm text-muted-foreground">{lead.contact_email || '-'}</div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <a
                                            href={`https://${lead.company_domain}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                            {lead.company_domain}
                                            <ExternalLink className="w-3 h-3 opacity-50" />
                                        </a>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border",
                                            (lead.source || 'outbound') === 'inbound'
                                                ? "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400"
                                                : "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400"
                                        )}>
                                            {lead.source || 'OUTBOUND'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider",
                                            lead.status === 'completed'
                                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {lead.status === 'completed' ? 'REPORT READY' : lead.status}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        {(lead.status === 'completed' || lead.report_html) ? (
                                            <a
                                                href={`/report/${lead.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-xs font-medium transition-colors border border-primary/20"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                View Report
                                            </a>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-3 rounded-xl bg-accent">
                                                <Database className="w-6 h-6 text-muted-foreground/30" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-0.5">No leads found</p>
                                                <p className="text-xs text-muted-foreground">Try adjusting your search criteria</p>
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
    )
}
