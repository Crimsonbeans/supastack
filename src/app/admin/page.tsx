import { createClient } from '@/lib/supabase/server'
import { Users, Building2, CheckCircle2, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch counts in parallel
    const [
        { count: inboundCount },
        { count: outboundCount },
        { count: qualifiedCount },
        { count: orgCount }
    ] = await Promise.all([
        supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('source', 'inbound'),
        supabase.from('prospects').select('*', { count: 'exact', head: true }).eq('source', 'outbound'),
        supabase.from('prospects')
            .select('*', { count: 'exact', head: true })
            .or('and(source.eq.inbound,status.neq.new_inquiry),and(source.eq.outbound,status.neq.pending)'),
        supabase.from('organizations').select('*', { count: 'exact', head: true })
    ])

    const stats = [
        {
            label: 'Total Inbound Leads',
            value: inboundCount || 0,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            trend: '+12%', // Placeholder trend
            description: 'From website signups'
        },
        {
            label: 'Total Outbound Leads',
            value: outboundCount || 0,
            icon: Activity,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            trend: '+5%',
            description: 'Manually added prospects'
        },
        {
            label: 'Total Qualified',
            value: qualifiedCount || 0,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            trend: '+8%',
            description: 'Engaged & processed leads'
        },
        {
            label: 'Total Organizations',
            value: orgCount || 0,
            icon: Building2,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
            trend: '+2%',
            description: 'Active companies'
        }
    ]

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Real-time overview of your pipeline performance</p>
                </div>
                <div className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Updates
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden"
                    >
                        {/* Hover Gradient Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        <div className="relative flex flex-col h-full justify-between space-y-4">
                            <div className="flex items-start justify-between">
                                <div className={cn("p-3 rounded-xl transition-colors duration-300", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.trend}
                                </div>
                            </div>

                            <div>
                                <div className="text-3xl font-bold text-gray-900 tracking-tight tabular-nums">
                                    {stat.value.toLocaleString()}
                                </div>
                                <h3 className="text-sm font-semibold text-gray-700 mt-1">
                                    {stat.label}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                    {stat.description}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State / Call to Action area could go here if needed, but removing graphs per request */}
        </div>
    )
}
