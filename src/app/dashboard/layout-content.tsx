'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    FileText,
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
    userEmail: string
    userName: string
}

function Sidebar({ isOpen, setIsOpen, userEmail, userName }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Webscan GTM Report', href: '/dashboard/report', icon: FileText },
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
                    "fixed top-0 bottom-0 z-50 w-64 transition-transform duration-300 md:translate-x-0 md:static",
                    "bg-[hsl(var(--client-sidebar))] text-white border-r border-white/5",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-full flex flex-col">
                    {/* Logo Area */}
                    <div className="h-16 flex items-center px-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-bold tracking-brand text-white">SUPASTACK</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 py-6 px-3 space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                        isActive
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

                    {/* User Profile Section (Bottom) */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="flex items-center gap-3 mb-4 px-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold text-white">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">{userName}</div>
                                <div className="text-xs text-blue-200/50 truncate">{userEmail}</div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Link
                                href="/dashboard/profile"
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                    pathname === '/dashboard/profile'
                                        ? "bg-white/10 text-white"
                                        : "text-blue-100/60 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <User className="w-3.5 h-3.5" />
                                My Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-300/70 hover:bg-white/5 hover:text-red-300 transition-all"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                Sign Out
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

    return (
        <div className="flex min-h-screen bg-[hsl(var(--client-background))]">
            <Sidebar
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
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
