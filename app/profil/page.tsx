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
      <div className="flex flex-1">
        <ProfileSidebar />
        <main className="flex-1 overflow-y-auto py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card-soft mb-8">
              <div className="flex items-center space-x-6">
                <div className="bg-primary-100 rounded-full p-6">
                  <User className="h-16 w-16 text-primary-600" />
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

            <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-10">
              <div className="card-soft bg-gradient-to-br from-primary-50 to-primary-100">
                <div className="text-xs uppercase tracking-wide text-gray-500">Streak</div>
                <p className="text-3xl font-bold text-primary-600">{stats.streak} jours</p>
              </div>
              <div className="card-soft bg-gradient-to-br from-orange-50 to-orange-100">
                <div className="text-xs uppercase tracking-wide text-gray-500">Séances</div>
                <p className="text-3xl font-bold text-orange-600">{stats.completedWorkouts}</p>
              </div>
              <div className="card-soft bg-gradient-to-br from-green-50 to-green-100">
                <div className="text-xs uppercase tracking-wide text-gray-500">Minutes</div>
                <p className="text-3xl font-bold text-green-600">{stats.totalMinutes}</p>
              </div>
              <div className="card-soft bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="text-xs uppercase tracking-wide text-gray-500">Niveau</div>
                <div className="flex items-center justify-between">
                  <p className="text-3xl font-bold text-amber-600">{level.level}</p>
                  <Star className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm text-gray-600">{level.name}</p>
                <div className="mt-3 h-2 w-full bg-white/70 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${level.progress}%` }} />
                </div>
              </div>
            </section>

            <section className="space-y-10 mt-12">
              <div className="card-soft">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Profil</p>
                    <h3 className="text-2xl font-semibold text-gray-900">Progrès</h3>
                  </div>
                </div>
                <Progress />
              </div>
              <div className="card-soft">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Profil</p>
                    <h3 className="text-2xl font-semibold text-gray-900">Historique</h3>
                  </div>
                </div>
                <History />
              </div>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
