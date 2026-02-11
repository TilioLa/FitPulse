'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import { User, Calendar, Trophy, TrendingUp, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { computeHistoryStats, WorkoutHistoryItem } from '@/lib/history'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ProfilPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [stats, setStats] = useState({ streak: 0, completedWorkouts: 0, totalMinutes: 0 })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
      return
    }

    // Charger les statistiques locales
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const { totalMinutes, totalWorkouts, streak } = computeHistoryStats(history as WorkoutHistoryItem[])
    setStats({
      streak,
      completedWorkouts: totalWorkouts,
      totalMinutes,
    })
  }, [router, status])

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
      <WithSidebar active="settings">
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
                  {session?.user?.name || 'Utilisateur FitPulse'}
                </h1>
                <p className="text-gray-600 mb-1">{session?.user?.email}</p>
                {session?.user?.phone && (
                  <p className="text-gray-600 mb-1">{session.user.phone}</p>
                )}
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date().toLocaleDateString('fr-FR', {
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

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card-soft bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Streak actuel</div>
                  <div className="text-4xl font-bold text-primary-600">{stats.streak}</div>
                  <div className="text-sm text-gray-600 mt-1">jours consécutifs</div>
                </div>
                <TrendingUp className="h-12 w-12 text-primary-600" />
              </div>
            </div>

            <div className="card-soft bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Séances complétées</div>
                  <div className="text-4xl font-bold text-orange-600">{stats.completedWorkouts}</div>
                  <div className="text-sm text-gray-600 mt-1">séances au total</div>
                </div>
                <Trophy className="h-12 w-12 text-orange-600" />
              </div>
            </div>

            <div className="card-soft bg-gradient-to-br from-green-50 to-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Temps total</div>
                  <div className="text-4xl font-bold text-green-600">{stats.totalMinutes}</div>
                  <div className="text-sm text-gray-600 mt-1">minutes d&apos;entraînement</div>
                </div>
                <Clock className="h-12 w-12 text-green-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Objectif de la semaine</h3>
              <p className="text-gray-600 mb-4">3 séances pour garder le rythme.</p>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600"
                  style={{ width: `${Math.min((stats.completedWorkouts / 3) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {Math.min(stats.completedWorkouts, 3)} / 3 séances
              </p>
            </div>
            <div className="card bg-gradient-to-br from-accent-50 to-primary-50">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Prochaine étape</h3>
              <p className="text-gray-600">Planifie ta prochaine séance pour garder ta streak.</p>
            </div>
          </div>

          {/* Historique récent */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-2 text-primary-600" />
              Historique récent
            </h2>
            <HistoryList />
          </div>

          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}

function HistoryList() {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const storedHistory = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const { deduped } = computeHistoryStats(storedHistory as WorkoutHistoryItem[])
    setHistory(deduped.sort((a: any, b: any) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ).slice(0, 5))
  }, [])

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-2">Aucune séance enregistrée</p>
        <p className="text-gray-500">Commencez votre première séance pour voir votre historique ici !</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((workout) => (
        <div key={workout.id} className="border-l-4 border-primary-600 pl-4 py-2">
          <h3 className="font-semibold text-gray-900">{workout.workoutName}</h3>
          <p className="text-sm text-gray-600">
            {new Date(workout.date).toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} • {workout.duration} minutes
          </p>
        </div>
      ))}
    </div>
  )
}
