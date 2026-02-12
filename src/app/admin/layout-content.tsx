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
    Moon,
    Sun,
    Zap,
    CheckSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { logoutAdmin } from '@/app/controlpanel/actions'

interface SidebarProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    adminName: string
}

function Sidebar({ isOpen, setIsOpen, adminName }: SidebarProps) {
    const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Prospects (Outbound)', href: '/admin/leads/prospects', icon: Database },
        { name: 'New Inquiries', href: '/admin/leads/inquiries', icon: Inbox },
        { name: 'Qualified Leads', href: '/admin/leads/qualified', icon: CheckSquare },
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
                    "fixed top-0 bottom-0 z-50 w-64 transition-transform duration-300 md:translate-x-0 md:static",
                    // Use Client Panel Sidebar Color
                    "bg-[hsl(var(--sidebar-background))] text-white border-r border-white/5",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col pt-0">
                    {/* Logo - Bento Card */}
                    <div className="h-16 flex items-center px-6 border-b border-white/10 mb-6">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-white tracking-tight">SUPASTACK</span>
                        </div>
                    </div>

                    {/* Navigation - Minimal Links */}
                    <nav className="flex-1 space-y-1 px-3">
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
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                        item.disabled
                                            ? "text-blue-100/20 cursor-not-allowed"
                                            : isActive
                                                ? "bg-white/10 text-white shadow-sm"
                                                : "text-blue-100/60 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4", isActive ? "text-blue-400" : "text-blue-100/40 group-hover:text-white")} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User Section - Minimal Card */}
                    <div className="pt-4 mt-auto border-t border-white/10 p-4 bg-black/20">
                        <div className="flex items-center gap-3 mb-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                                {adminName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{adminName}</div>
                                <div className="text-xs text-blue-200/50 uppercase tracking-wider">Admin</div>
                            </div>
                        </div>
                        <button
                            onClick={() => logoutAdmin()}
                            className="flex items-center gap-3 w-full px-3 py-2 text-xs font-medium text-red-300/70 hover:bg-white/5 hover:text-red-300 rounded-lg transition-all"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg hover:bg-accent transition-colors relative"
            title="Toggle Theme"
        >
            <Sun className="w-4 h-4 absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
            <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
        </button>
    )
}

export default function AdminLayoutContent({ children, adminName }: { children: React.ReactNode, adminName: string }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-[hsl(var(--main-background))] text-slate-900 font-sans">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} adminName={adminName} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header - Minimal, Thin Border */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <button
                            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <h1 className="text-sm font-medium text-gray-500">Welcome back, <span className="text-gray-900 font-semibold">{adminName}</span></h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Theme Toggle Removed for Consistency with Client Panel */}
                        <button
                            onClick={() => logoutAdmin()}
                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Main Content - Generous Spacing */}
                <main className="flex-1 overflow-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
