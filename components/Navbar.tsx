'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Activity } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { status } = useSession()
  const isLoggedIn = status === 'authenticated'

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FitPulse</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Accueil
            </Link>
            <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 transition-colors">
              Dashboard
            </Link>
            <Link href="/programmes" className="text-gray-700 hover:text-primary-600 transition-colors">
              Programmes
            </Link>
            <Link href="/profil" className="text-gray-700 hover:text-primary-600 transition-colors">
              Profil
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-primary-600 transition-colors">
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="btn-primary text-sm px-4 py-2"
              >
                Mon Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/connexion"
                  className="text-gray-700 hover:text-primary-600 transition-colors"
                >
                  Connexion
                </Link>
                <Link href="/inscription" className="btn-primary text-sm px-4 py-2">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Accueil
            </Link>
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/programmes"
              className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Programmes
            </Link>
            <Link
              href="/profil"
              className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Profil
            </Link>
            <Link
              href="/pricing"
              className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="block px-3 py-2 bg-primary-600 text-white rounded-md text-center"
                onClick={() => setIsOpen(false)}
              >
                Mon Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="block px-3 py-2 text-gray-700 hover:bg-primary-50 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  href="/inscription"
                  className="block px-3 py-2 bg-primary-600 text-white rounded-md text-center"
                  onClick={() => setIsOpen(false)}
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
