import Link from 'next/link'

interface FooterProps {
  activePage?: 'home' | 'how-it-works' | 'pricing' | 'about'
}

export default function Footer({ activePage }: FooterProps) {
  const navLinks = [
    { href: '/how-it-works', label: 'How It Works', key: 'how-it-works' as const },
    { href: '/pricing', label: 'Pricing', key: 'pricing' as const },
    { href: '/about', label: 'About', key: 'about' as const },
  ]

  return (
    <footer className="bg-[#0a0a0f] border-t border-white/5 py-16">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
        <strong className="text-white text-base font-bold">SupaStack Ltd</strong>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={
                activePage === link.key
                  ? 'text-slate-300 font-semibold'
                  : 'hover:text-slate-300 transition-colors'
              }
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span>Company number 16869878 · Registered in England and Wales</span>
        <span>© 2026 SupaStack. All rights reserved.</span>
      </div>
    </footer>
  )
}
