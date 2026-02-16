'use client'

import Link from 'next/link'
import { Activity } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/programmes', label: 'Programmes' },
    { href: '/exercices', label: 'Exercices' },
    { href: '/pricing', label: 'Tarifs' },
  ]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">FitPulse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/connexion" className="btn-secondary px-4 py-2 text-sm">
            Connexion
          </Link>
          <Link href="/inscription" className="btn-primary px-4 py-2 text-sm">
            Inscription
          </Link>
        </div>
      </div>
    </header>
  )
}
