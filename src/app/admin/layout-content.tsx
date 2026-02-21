'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Database,
    Inbox,
    FileBarChart,
    PieChart,
    LogOut,
    Menu,
    CheckSquare,
    Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logoutAdmin } from '@/app/controlpanel/actions'

interface SidebarProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    adminName: string
}

function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed, adminName }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Prospects (Outbound)', href: '/admin/leads/prospects', icon: Database },
        { name: 'New Inquiries', href: '/admin/leads/inquiries', icon: Inbox },
        { name: 'Qualified Leads', href: '/admin/leads/qualified', icon: CheckSquare },
        { name: 'Customers', href: '/admin/customers', icon: Users },
        { name: 'Reports', href: '#', icon: FileBarChart, disabled: true },
        { name: 'Analytics', href: '#', icon: PieChart, disabled: true },
    ]

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar - Bento Style */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 transition-all duration-300 md:translate-x-0 md:static md:relative",
                    "bg-[hsl(var(--sidebar-background))] text-white border-r border-white/5",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    "w-64 md:w-64",
                    collapsed && "md:w-16"
                )}
            >
                {/* Drawer handle — edge toggle (desktop only) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-50 w-7 h-12 flex-col items-center justify-center gap-[3px] bg-[hsl(var(--sidebar-background))] border border-white/10 border-l-0 rounded-r-lg cursor-pointer hover:bg-white/10 transition-colors group"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <span className="w-1 h-1 rounded-full bg-blue-200/30 group-hover:bg-blue-200/60 transition-colors" />
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-blue-200/40 group-hover:text-blue-200/80 transition-colors">
                        <path
                            d={collapsed ? "M2.5 1 L5.5 4 L2.5 7" : "M5.5 1 L2.5 4 L5.5 7"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    <span className="w-1 h-1 rounded-full bg-blue-200/30 group-hover:bg-blue-200/60 transition-colors" />
                </button>

                <div className="h-full flex flex-col">
                    {/* Logo */}
                    <div className="h-16 flex items-center border-b border-white/10 px-4">
                        <div className={cn(
                            "flex items-center gap-3 transition-all duration-300 overflow-hidden",
                            collapsed ? "md:justify-center" : ""
                        )}>
                            <span className={cn(
                                "text-lg font-bold tracking-brand text-white whitespace-nowrap transition-all duration-300",
                                collapsed ? "md:hidden" : ""
                            )}>
                                SUPASTACK
                            </span>
                            <span className={cn(
                                "text-lg font-bold tracking-brand text-white hidden",
                                collapsed && "md:block"
                            )}>
                                SS
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-2 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={(e) => {
                                        if (item.disabled) e.preventDefault()
                                        setIsOpen(false)
                                    }}
                                    title={collapsed ? item.name : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                        item.disabled
                                            ? "text-blue-100/20 cursor-not-allowed"
                                            : isActive
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                                        collapsed && "md:justify-center md:px-0"
                                    )}
                                >
                                    <item.icon className={cn(
                                        "w-4 h-4 shrink-0",
                                        isActive ? "text-blue-400" : "text-blue-100/40 group-hover:text-white"
                                    )} />
                                    <span className={cn(
                                        "truncate transition-all duration-300",
                                        collapsed && "md:hidden"
                                    )}>
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="p-3 border-t border-white/10 bg-black/20">
                        <div className={cn(
                            "flex items-center gap-3 mb-3 px-1",
                            collapsed && "md:justify-center md:mb-2"
                        )}>
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                            <div className={cn(
                                "flex-1 min-w-0 transition-all duration-300",
                                collapsed && "md:hidden"
                            )}>
                                <div className="text-sm font-medium text-white truncate">{adminName}</div>
                                <div className="text-xs text-blue-200/50 uppercase tracking-wider">Admin</div>
                            </div>
                        </div>
                        <button
                            onClick={() => logoutAdmin()}
                            title={collapsed ? 'Logout' : undefined}
                            className={cn(
                                "flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-red-300/70 hover:bg-white/5 hover:text-red-300 rounded-lg transition-all",
                                collapsed && "md:justify-center md:px-0"
                            )}
                        >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span className={cn(
                                "transition-all duration-300",
                                collapsed && "md:hidden"
                            )}>
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default function AdminLayoutContent({ children, adminName }: { children: React.ReactNode, adminName: string }) {
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

    // Full-screen mode for report pages (no sidebar, no padding)
    const isFullScreen = pathname.includes('/report')

    if (isFullScreen) {
        return <>{children}</>
    }

    return (
        <div className="flex min-h-screen bg-[hsl(var(--main-background))] text-slate-900 font-sans">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                adminName={adminName}
            />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
                    <button
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="font-semibold text-gray-800">SUPASTACK</span>
                    <div className="w-9" />
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
