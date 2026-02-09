'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, TrendingUp, Trophy } from 'lucide-react'

interface WorkoutHistory {
  id: string
  workoutId: string
  workoutName: string
  date: string
  duration: number
}

export default function History() {
  const [history, setHistory] = useState<WorkoutHistory[]>([])
  const [stats, setStats] = useState({ total: 0, streak: 0, totalMinutes: 0 })

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const storedHistory = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    setHistory(storedHistory.sort((a: WorkoutHistory, b: WorkoutHistory) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ))

    const storedStats = JSON.parse(localStorage.getItem('fitpulse_stats') || '{"streak": 0, "completedWorkouts": 0}')
    const totalMinutes = storedHistory.reduce((sum: number, w: WorkoutHistory) => sum + w.duration, 0)
    setStats({
      total: storedHistory.length,
      streak: storedStats.streak || 0,
      totalMinutes,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Historique des séances</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Total séances</div>
              <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
            </div>
            <Calendar className="h-10 w-10 text-primary-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Streak actuel</div>
              <div className="text-3xl font-bold text-orange-600">{stats.streak} jours</div>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-600" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Minutes totales</div>
              <div className="text-3xl font-bold text-green-600">{stats.totalMinutes}</div>
            </div>
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
        </div>
      </div>

      {/* Historique */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Séances récentes</h2>
        {history.length === 0 ? (
          <div className="card text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">Aucune séance enregistrée</p>
            <p className="text-gray-500">Commencez votre première séance pour voir votre historique ici !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((workout) => (
              <div key={workout.id} className="card hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {workout.workoutName}
                    </h3>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(workout.date)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{workout.duration} minutes</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Terminée
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
