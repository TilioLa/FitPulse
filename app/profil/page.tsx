'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import { User } from 'lucide-react'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { computeHistoryStats, WorkoutHistoryItem } from '@/lib/history'
import WithSidebar from '@/components/layouts/WithSidebar'

const Progress = dynamic(() => import('@/components/dashboard/Progress'), {
  loading: () => <div className="py-10 text-center text-sm text-gray-500">Chargement des progrès...</div>,
  ssr: false,
})
const History = dynamic(() => import('@/components/dashboard/History'), {
  loading: () => (
    <div className="py-10 text-center text-sm text-gray-500">
      Chargement de l&apos;historique...
    </div>
  ),
  ssr: false,
})

export default function ProfilPage() {
  const router = useRouter()
  const { user, status } = useAuth()
  const [badges, setBadges] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
      return
    }

    queueMicrotask(() => {
      try {
        const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
        const { totalMinutes, totalWorkouts, streak } = computeHistoryStats(history as WorkoutHistoryItem[])
        const nextBadges = [
          totalWorkouts >= 1 ? 'Première séance' : null,
          streak >= 7 ? 'Streak 7 jours' : null,
          totalMinutes >= 100 ? '100 minutes' : null,
        ].filter(Boolean) as string[]
        setBadges(nextBadges)
      } catch {
        setBadges([])
      }
    })
  }, [router, status])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du profil...
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du profil...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Redirection vers la connexion...
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="card-soft mb-8">
            <div className="flex items-center space-x-6">
              <div className="bg-primary-100 rounded-full p-6">
                <User className="h-16 w-16 text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="section-title mb-2">
                  {user?.name || 'Utilisateur FitPulse'}
                </h1>
                <p className="text-gray-600 mb-1">{user?.email}</p>
                {user?.phone && (
                  <p className="text-gray-600 mb-1">{user.phone}</p>
                )}
                <p className="text-sm text-gray-500">
                  Membre depuis {(user?.createdAt ? new Date(user.createdAt) : new Date()).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
              <div className="text-right">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary"
                >
                  Accéder au Dashboard
                </button>
              </div>
            </div>
          </div>

          {badges.length > 0 && (
            <div className="card-soft mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Badges</h3>
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          )}

          <section className="space-y-6 mt-10">
            <div className="card-soft">
              <Progress />
            </div>
            <div className="card-soft">
              <History />
            </div>
          </section>
        </div>
      </main>
    </WithSidebar>
    <Footer />
  </div>
)
}
