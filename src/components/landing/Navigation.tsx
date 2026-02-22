'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NavigationProps {
  activePage?: 'home' | 'how-it-works' | 'pricing' | 'about'
  transparent?: boolean
}

export default function Navigation({ activePage = 'home', transparent = false }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!transparent) return
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [transparent])

  const headerClass = transparent
    ? `fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-5 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-[0_1px_0_rgba(0,0,0,0.06)]' : ''}`
    : 'fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 py-5'

  const navLinks = [
    { href: '/how-it-works', label: 'How It Works', key: 'how-it-works' as const },
    { href: '/pricing', label: 'Pricing', key: 'pricing' as const },
    { href: '/about', label: 'About', key: 'about' as const },
  ]

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900">
          SupaStack
        </Link>
        <nav className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium text-slate-500">
            {navLinks.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  className={
                    activePage === link.key
                      ? 'text-slate-900 font-semibold'
                      : 'hover:text-slate-900 transition-colors duration-300'
                  }
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden md:inline-flex text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden md:inline-flex items-center h-9 px-5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-700/25 transition-all duration-300"
          >
            Get Free Scan
          </Link>
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 5h16M4 12h16M4 19h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className={`${mobileOpen ? '' : 'hidden'} md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3 text-sm font-medium`}>
        {navLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`block ${activePage === link.key ? 'text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/signup" className="block text-blue-700 font-semibold">
          Get Free Scan →
        </Link>
      </div>
    </header>
  )
}
