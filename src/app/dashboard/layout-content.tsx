'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    FileText,
    ClipboardList,
    User,
    LogOut,
    Menu
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    userEmail: string
    userName: string
}

function Sidebar({ isOpen, setIsOpen, collapsed, setCollapsed, userEmail, userName }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Webscan GTM Report', href: '/dashboard/report', icon: FileText },
        { name: 'Requirements', href: '/dashboard/requirements', icon: ClipboardList },
    ]

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 z-50 transition-all duration-300 md:translate-x-0 md:static md:relative",
                    "bg-[hsl(var(--client-sidebar))] text-white border-r border-white/5",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    // Mobile always full width, desktop respects collapsed state
                    "w-64 md:w-64",
                    collapsed && "md:w-16"
                )}
            >
                {/* Drawer handle — edge toggle (desktop only) */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden md:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-50 w-7 h-12 flex-col items-center justify-center gap-[3px] bg-[hsl(var(--client-sidebar))] border border-white/10 border-l-0 rounded-r-lg cursor-pointer hover:bg-white/10 transition-colors group"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {/* Grip dots */}
                    <span className="w-1 h-1 rounded-full bg-blue-200/30 group-hover:bg-blue-200/60 transition-colors" />
                    {/* Arrow chevron */}
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-blue-200/40 group-hover:text-blue-200/80 transition-colors">
                        <path
                            d={collapsed ? "M2.5 1 L5.5 4 L2.5 7" : "M5.5 1 L2.5 4 L5.5 7"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    {/* Grip dots */}
                    <span className="w-1 h-1 rounded-full bg-blue-200/30 group-hover:bg-blue-200/60 transition-colors" />
                </button>

                <div className="h-full flex flex-col">
                    {/* Logo Area */}
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
                                    onClick={() => setIsOpen(false)}
                                    title={collapsed ? item.name : undefined}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                        isActive
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

                    {/* User Profile Section (Bottom) */}
                    <div className="p-3 border-t border-white/10 bg-black/20">
                        {/* Avatar + info */}
                        <div className={cn(
                            "flex items-center gap-3 mb-3 px-1",
                            collapsed && "md:justify-center md:mb-2"
                        )}>
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className={cn(
                                "flex-1 min-w-0 transition-all duration-300",
                                collapsed && "md:hidden"
                            )}>
                                <div className="text-sm font-medium text-white truncate">{userName}</div>
                                <div className="text-xs text-blue-200/50 truncate">{userEmail}</div>
                            </div>
                        </div>

                        {/* Profile + Logout links */}
                        <div className="space-y-1">
                            <Link
                                href="/dashboard/profile"
                                onClick={() => setIsOpen(false)}
                                title={collapsed ? 'My Profile' : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                    pathname === '/dashboard/profile'
                                        ? "bg-white/10 text-white"
                                        : "text-blue-100/60 hover:bg-white/5 hover:text-white",
                                    collapsed && "md:justify-center md:px-0"
                                )}
                            >
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span className={cn(
                                    "transition-all duration-300",
                                    collapsed && "md:hidden"
                                )}>
                                    My Profile
                                </span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                title={collapsed ? 'Sign Out' : undefined}
                                className={cn(
                                    "flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-300/70 hover:bg-white/5 hover:text-red-300 transition-all",
                                    collapsed && "md:justify-center md:px-0"
                                )}
                            >
                                <LogOut className="w-3.5 h-3.5 shrink-0" />
                                <span className={cn(
                                    "transition-all duration-300",
                                    collapsed && "md:hidden"
                                )}>
                                    Sign Out
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default function ClientLayoutContent({
    children,
    userEmail,
    userName
}: {
    children: React.ReactNode,
    userEmail: string,
    userName: string
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(true) // collapsed by default

    return (
        <div className="flex min-h-screen bg-[hsl(var(--client-background))]">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                userEmail={userEmail}
                userName={userName}
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
                    <div className="w-9" /> {/* Spacer for centering */}
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
