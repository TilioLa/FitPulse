//
//  page.tsx
//  
//
//  Created by Tilio Lave on 18/01/2026.
//

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { parseJsonWithFallback } from '@/lib/safeStorage'
import type { PublicUser, WorkoutHistoryEntry, WorkoutStats } from '@/lib/types'
import { User, Calendar, Trophy, TrendingUp, Clock } from 'lucide-react'

const isPublicUser = (value: unknown): value is PublicUser => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.email === 'string' &&
    typeof record.name === 'string' &&
    typeof record.createdAt === 'string'
  )
}

const isWorkoutStats = (value: unknown): value is WorkoutStats => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return typeof record.streak === 'number' && typeof record.completedWorkouts === 'number'
}

const isWorkoutHistoryEntry = (value: unknown): value is WorkoutHistoryEntry => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.workoutId === 'string' &&
    typeof record.workoutName === 'string' &&
    typeof record.date === 'string' &&
    typeof record.duration === 'number'
  )
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [stats, setStats] = useState({ streak: 0, completedWorkouts: 0, totalMinutes: 0 })

  useEffect(() => {
    const userData = localStorage.getItem('fitpulse_user')
    if (!userData) {
      router.push('/connexion')
      return
    }
    const parsedUser = parseJsonWithFallback<PublicUser | null>(
      userData,
      null,
      isPublicUser
    )
    if (!parsedUser) {
      localStorage.removeItem('fitpulse_user')
      router.push('/connexion')
      return
    }
    setUser(parsedUser)

    // Charger les statistiques
    const storedStats = parseJsonWithFallback(localStorage.getItem('fitpulse_stats'), {
      streak: 0,
      completedWorkouts: 0,
    }, isWorkoutStats)
    const history = parseJsonWithFallback<WorkoutHistoryEntry[]>(
      localStorage.getItem('fitpulse_history'),
      [],
      (value): value is WorkoutHistoryEntry[] =>
        Array.isArray(value) && value.every(isWorkoutHistoryEntry)
    )
    const totalMinutes = history.reduce((sum, w) => sum + w.duration, 0)
    setStats({
      streak: storedStats.streak || 0,
      completedWorkouts: storedStats.completedWorkouts || 0,
      totalMinutes,
    })
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="bg-primary-100 rounded-full p-6">
                <User className="h-16 w-16 text-primary-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.name || 'Utilisateur FitPulse'}
                </h1>
                <p className="text-gray-600 mb-1">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date(user.createdAt || Date.now()).toLocaleDateString('fr-FR', {
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
            <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Streak actuel</div>
                  <div className="text-4xl font-bold text-primary-600">{stats.streak}</div>
                  <div className="text-sm text-gray-600 mt-1">jours consécutifs</div>
                </div>
                <TrendingUp className="h-12 w-12 text-primary-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Séances complétées</div>
                  <div className="text-4xl font-bold text-orange-600">{stats.completedWorkouts}</div>
                  <div className="text-sm text-gray-600 mt-1">séances au total</div>
                </div>
                <Trophy className="h-12 w-12 text-orange-600" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-green-100">
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
      <Footer />
    </div>
  )
}

function HistoryList() {
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([])

  useEffect(() => {
    const storedHistory = parseJsonWithFallback<WorkoutHistoryEntry[]>(
      localStorage.getItem('fitpulse_history'),
      [],
      (value): value is WorkoutHistoryEntry[] =>
        Array.isArray(value) && value.every(isWorkoutHistoryEntry)
    )
    setHistory(storedHistory.sort((a, b) =>
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
