'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Clock, Play, Star, TrendingUp } from 'lucide-react'
import { computeHistoryStats, WorkoutHistoryItem } from '@/lib/history'
import { readLocalSettings } from '@/lib/user-state-store'

const quotes = [
  '“J’ai gardé ma streak et je me sens plus fort chaque semaine.”',
  '“3 séances par semaine, zéro prise de tête.”',
  '“Le plan a remplacé mon scroll sans fin.”',
  '“Ma motivation vient de voir mes progrès sur la chronologie.”',
]

export default function SuccessWall() {
  const [stats, setStats] = useState({ streak: 0, minutes: 0, workouts: 0 })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedHistory = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as WorkoutHistoryItem[]
      const { totalMinutes, totalWorkouts, streak } = computeHistoryStats(storedHistory)
      setStats({ streak, minutes: totalMinutes, workouts: totalWorkouts })
    } catch {
      setStats({ streak: 0, minutes: 0, workouts: 0 })
    } finally {
      setReady(true)
    }
  }, [])

  const goal = useMemo(() => {
    if (typeof window === 'undefined') return 'ton objectif'
    const settings = readLocalSettings()
    return settings?.goal || settings?.goals?.[0] || 'ton objectif'
  }, [])

  const quote = useMemo(() => {
    if (stats.streak >= 7) return quotes[0]
    if (stats.workouts >= 4) return quotes[1]
    if (stats.minutes >= 90) return quotes[2]
    return quotes[3]
  }, [stats])

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Succès</p>
            <h2 className="text-3xl font-bold text-gray-900">Une piste claire vers de vrais résultats</h2>
            <p className="text-gray-600 max-w-2xl">
              Reste sur la bonne voie : garde ta streak, mesure ton temps d&apos;entraînement et vois ce que cela donne sur ton {goal}.
            </p>
          </div>
          <Link href="/programmes" className="btn-secondary inline-flex items-center gap-2">
            Voir les programmes
            <TrendingUp className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">Streak actuel</div>
              <Star className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">{stats.streak}</div>
            <p className="text-sm text-gray-500">jours consécutifs</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">Temps total</div>
              <Clock className="h-5 w-5 text-primary-600" />
            </div>
            <div className="text-4xl font-bold text-gray-900">{stats.minutes}</div>
            <p className="text-sm text-gray-500">minutes</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs uppercase tracking-wider text-gray-500">Séances complétées</div>
              <Play className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-4xl font-bold text-gray-900">{stats.workouts}</div>
            <p className="text-sm text-gray-500">réalisées</p>
          </div>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-6">
          <p className="text-lg font-semibold text-primary-700">Réussites récentes</p>
          <p className="text-gray-700 italic mt-4">{ready ? quote : 'Chargement des progrès...'}</p>
          <p className="text-sm text-gray-500 mt-2">Tu peux exporter l&apos;historique depuis ton profil pour suivre ces chiffres semaine après semaine.</p>
        </div>
      </div>
    </section>
  )
}
