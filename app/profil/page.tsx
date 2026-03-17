'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import { Star, User } from 'lucide-react'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { computeHistoryStats, WorkoutHistoryItem } from '@/lib/history'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import { computeXp, getLevelInfo } from '@/lib/levels'

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
  const [stats, setStats] = useState({ streak: 0, completedWorkouts: 0, totalMinutes: 0 })
  const [level, setLevel] = useState({ name: 'Bronze', level: 1, progress: 0 })
  const [badges, setBadges] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [activeView, setActiveView] = useState<'progress' | 'history'>('progress')

  const navigateToView = (view: 'progress' | 'history') => {
    setActiveView(view)
    router.push(`/profil?view=${view}`, { scroll: false })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const applyView = () => {
      const params = new URLSearchParams(window.location.search)
      setActiveView(params.get('view') === 'history' ? 'history' : 'progress')
    }
    applyView()
    window.addEventListener('popstate', applyView)
    return () => {
      window.removeEventListener('popstate', applyView)
    }
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
        setStats({
          streak,
          completedWorkouts: totalWorkouts,
          totalMinutes,
        })
        const xp = computeXp(totalMinutes, totalWorkouts)
        const levelInfo = getLevelInfo(xp)
        setLevel({ name: levelInfo.current.name, level: levelInfo.current.level, progress: levelInfo.progress })
        const nextBadges = [
          totalWorkouts >= 1 ? 'Première séance' : null,
          streak >= 7 ? 'Streak 7 jours' : null,
          totalMinutes >= 100 ? '100 minutes' : null,
        ].filter(Boolean) as string[]
        setBadges(nextBadges)
      } catch {
        setStats({ streak: 0, completedWorkouts: 0, totalMinutes: 0 })
        setLevel({ name: 'Bronze', level: 1, progress: 0 })
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
      <div className="flex flex-1 flex-col lg:flex-row">
        <ProfileSidebar activeView={activeView} onSelectView={setActiveView} />
        <main className="flex-1 overflow-y-auto py-6 pb-24 lg:py-12 lg:pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
              <button
                onClick={() => navigateToView('progress')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  activeView === 'progress'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                Progrès
              </button>
              <button
                onClick={() => navigateToView('history')}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  activeView === 'history'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                Historique
              </button>
            </div>
            <div className="card-soft mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                <div className="bg-primary-100 rounded-full p-4 sm:p-6 w-fit">
                  <User className="h-12 w-12 sm:h-16 sm:w-16 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h1 className="section-title mb-2">{user?.name || 'Utilisateur FitPulse'}</h1>
                  <p className="text-gray-600 mb-1">{user?.email}</p>
                  {user?.phone && <p className="text-gray-600 mb-1">{user.phone}</p>}
                  <p className="text-sm text-gray-500">
                    Membre depuis{' '}
                    {(user?.createdAt ? new Date(user.createdAt) : new Date()).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {badges.length > 0 && (
              <div className="card-soft mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <section className="space-y-10 mt-12">
              {activeView === 'progress' ? (
                <div className="card-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Profil</p>
                      <h3 className="text-2xl font-semibold text-gray-900">Progrès</h3>
                    </div>
                  </div>
                  <Progress />
                </div>
              ) : (
                <div className="card-soft">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Profil</p>
                      <h3 className="text-2xl font-semibold text-gray-900">Historique</h3>
                    </div>
                  </div>
                  <History />
                </div>
              )}
            </section>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Retour au dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
