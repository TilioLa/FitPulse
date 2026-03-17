'use client'

import Link from 'next/link'
import { ArrowRight, Mail, Settings, History, Target, Clock11 } from 'lucide-react'
import { useAuth } from '@/components/SupabaseAuthProvider'

export default function ProfileSidebar() {
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col min-h-[calc(100vh-64px)] w-64 border-r border-gray-100 px-4 py-6 bg-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-sm">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">{user?.name || 'Utilisateur FitPulse'}</span>
          <span className="text-xs text-gray-500 truncate">{user?.email}</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">Section</p>
        <ul className="mt-3 space-y-2">
          <li>
            <Link
              href="#progress"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700"
            >
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-400" />
                Progrès
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </li>
          <li>
            <Link
              href="#history"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700"
            >
              <span className="flex items-center gap-2">
                <History className="h-4 w-4 text-gray-400" />
                Historique
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </Link>
          </li>
        </ul>
      </div>

      <div className="flex-1 space-y-3">
        <Link
          href="/tickets"
          className="flex items-center gap-2 text-sm font-semibold text-primary-600"
        >
          <Mail className="h-4 w-4" />
          Contacter le support
        </Link>
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Clock11 className="h-4 w-4" />
          Retour au dashboard
        </Link>
        <Link href="/settings" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Settings className="h-4 w-4" />
          Paramètres
        </Link>
      </div>

      <button
        onClick={async () => {
          await signOut()
        }}
        className="mt-6 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      >
        Déconnexion
      </button>
    </aside>
  )
}
