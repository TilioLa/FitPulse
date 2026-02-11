import Link from 'next/link'
import { Activity } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Activity className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">FitPulse</span>
            </Link>
            <p className="text-sm text-gray-400">
              Votre coach sportif personnel. Des programmes adaptés à votre niveau et à vos objectifs.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-primary-400 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/programmes" className="hover:text-primary-400 transition-colors">
                  Programmes
                </Link>
              </li>
              <li>
                <span className="text-gray-500">Pricing</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mentions-legales" className="hover:text-primary-400 transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-primary-400 transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="hover:text-primary-400 transition-colors">
                  CGV
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-primary-400 transition-colors">
                  Nous contacter
                </Link>
              </li>
              <li className="text-sm text-gray-400">
                fitpulset@gmail.com
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} FitPulse. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
