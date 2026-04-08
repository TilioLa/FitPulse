import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">FitPulse</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/connexion" className="btn-secondary hidden sm:inline-flex px-4 py-2 text-sm">
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
