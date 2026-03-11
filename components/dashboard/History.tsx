'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, TrendingUp, Trophy, Download, FileText } from 'lucide-react'
import { computeHistoryStats, WorkoutHistoryItem } from '@/lib/history'
import DashboardCalendar from '@/components/dashboard/Calendar'
import { useI18n } from '@/components/I18nProvider'
import Link from 'next/link'
import { programsById } from '@/data/programs'
import { applyHistoryLimit, getEntitlement } from '@/lib/subscription'
import { readLocalCurrentWorkout } from '@/lib/user-state-store'

interface WorkoutHistory {
  id: string
  workoutId: string
  workoutName: string
  date: string
  duration: number
  calories?: number
  volume?: number
  muscleUsage?: { id: string; percent: number }[]
  exercises?: { sets?: { weight: number; reps: number }[] }[]
}

export default function History() {
  const [history, setHistory] = useState<WorkoutHistory[]>([])
  const [stats, setStats] = useState({ total: 0, streak: 0, totalMinutes: 0, totalWeight: 0 })
  const [locale, setLocale] = useState('fr')
  const [resumeSessionHref, setResumeSessionHref] = useState<string | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const { t } = useI18n()

  const loadHistory = () => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as WorkoutHistoryItem[]
      const visibleHistory = applyHistoryLimit(storedHistory, getEntitlement())
      const { streak } = computeHistoryStats(visibleHistory)
      const totalWorkouts = visibleHistory.length
      const totalMinutes = visibleHistory.reduce(
        (sum, item) => sum + (Number(item.duration) || 0),
        0
      )
      const totalWeight = visibleHistory.reduce((sum, workout) => {
        const workoutWeight = (workout.exercises || []).reduce((exerciseSum, exercise) => {
          const setsWeight = (exercise.sets || []).reduce((setSum, set) => {
            const weight = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            return setSum + weight * reps
          }, 0)
          return exerciseSum + setsWeight
        }, 0)
        return sum + workoutWeight
      }, 0)
      setHistory(visibleHistory.sort((a: WorkoutHistory, b: WorkoutHistory) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
      setStats({
        total: totalWorkouts,
        streak,
        totalMinutes,
        totalWeight: Math.round(totalWeight),
      })
      const currentWorkout = readLocalCurrentWorkout() as {
        status?: string
        programId?: string
        id?: string
      } | null
      if (currentWorkout?.status === 'in_progress') {
        const program = currentWorkout.programId ? programsById[currentWorkout.programId] : null
        const sessionId = typeof currentWorkout.id === 'string' ? currentWorkout.id : null
        setResumeSessionHref(
          program && sessionId ? `/programmes/${program.slug}/seances/${sessionId}` : '/dashboard?view=session'
        )
      } else {
        setResumeSessionHref(null)
      }
    } catch {
      setHistory([])
      setStats({ total: 0, streak: 0, totalMinutes: 0, totalWeight: 0 })
      setResumeSessionHref(null)
    }
  }

  useEffect(() => {
    loadHistory()
    if (typeof navigator !== 'undefined') {
      setLocale(navigator.language || 'fr')
    }
    window.addEventListener('storage', loadHistory)
    window.addEventListener('fitpulse-current-workout', loadHistory)
    return () => {
      window.removeEventListener('storage', loadHistory)
      window.removeEventListener('fitpulse-current-workout', loadHistory)
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const muscleLabel = (id: string) => {
    const labels: Record<string, { fr: string; en: string }> = {
      chest: { fr: 'Pectoraux', en: 'Chest' },
      shoulders: { fr: 'Epaules', en: 'Shoulders' },
      biceps: { fr: 'Biceps', en: 'Biceps' },
      triceps: { fr: 'Triceps', en: 'Triceps' },
      back: { fr: 'Dos', en: 'Back' },
      core: { fr: 'Abdominaux', en: 'Abdominals' },
      glutes: { fr: 'Fessiers', en: 'Glutes' },
      quads: { fr: 'Quadriceps', en: 'Quads' },
      hamstrings: { fr: 'Ischios', en: 'Hamstrings' },
      calves: { fr: 'Mollets', en: 'Calves' },
    }
    const lang = locale.startsWith('fr') ? 'fr' : 'en'
    return labels[id]?.[lang] || id
  }

  const normalizeMuscles = (items: { id: string; percent: number }[]) => {
    const total = items.reduce((sum, item) => sum + (Number(item.percent) || 0), 0) || 1
    const normalized = items.map((item) => ({
      id: item.id,
      raw: (item.percent / total) * 100,
    }))
    const floors = normalized.map((item) => Math.floor(item.raw))
    let remainder = 100 - floors.reduce((sum, value) => sum + value, 0)
    const sorted = normalized
      .map((item, idx) => ({ ...item, idx, frac: item.raw - Math.floor(item.raw) }))
      .sort((a, b) => b.frac - a.frac)
    const withRemainder = floors.map((value, idx) => value)
    sorted.forEach((item, order) => {
      if (order < remainder) withRemainder[item.idx] += 1
    })
    return items.map((item, idx) => ({ id: item.id, percent: withRemainder[idx] }))
  }

  const filteredHistory = useMemo(() => {
    if (!fromDate && !toDate) return history
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
    const toTs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null
    return history.filter((workout) => {
      const ts = new Date(workout.date).getTime()
      if (fromTs != null && ts < fromTs) return false
      if (toTs != null && ts > toTs) return false
      return true
    })
  }, [fromDate, toDate, history])

  const filteredStats = useMemo(() => {
    const { streak, totalMinutes, totalWorkouts } = computeHistoryStats(filteredHistory as WorkoutHistoryItem[])
    const totalWeight = filteredHistory.reduce((sum, workout) => {
      const workoutWeight = (workout.exercises || []).reduce((exerciseSum, exercise) => {
        const setsWeight = (exercise.sets || []).reduce((setSum, set) => {
          const weight = Number(set.weight) || 0
          const reps = Number(set.reps) || 0
          return setSum + weight * reps
        }, 0)
        return exerciseSum + setsWeight
      }, 0)
      return sum + workoutWeight
    }, 0)
    return {
      total: totalWorkouts,
      streak,
      totalMinutes,
      totalWeight: Math.round(totalWeight),
    }
  }, [filteredHistory])

  const exportCsv = () => {
    const rows = [
      ['date', 'workout', 'duration_min', 'volume_kg', 'calories'],
      ...filteredHistory.map((workout) => [
        workout.date,
        workout.workoutName,
        String(workout.duration || 0),
        String(workout.volume || 0),
        String(workout.calories || 0),
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fitpulse-history-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const popup = window.open('', '_blank', 'width=900,height=700')
    if (!popup) return
    const rows = filteredHistory
      .map(
        (workout) => `
          <tr>
            <td>${new Date(workout.date).toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US')}</td>
            <td>${workout.workoutName}</td>
            <td>${workout.duration} min</td>
            <td>${workout.volume || 0} kg</td>
            <td>${workout.calories || 0} kcal</td>
          </tr>
        `
      )
      .join('')
    popup.document.write(`
      <html>
        <head>
          <title>FitPulse - Historique</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 4px; }
            p { color: #6b7280; margin-top: 0; }
            table { border-collapse: collapse; width: 100%; margin-top: 16px; }
            th, td { border: 1px solid #e5e7eb; text-align: left; padding: 8px; font-size: 12px; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>FitPulse - Historique des séances</h1>
          <p>Export du ${new Date().toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US')}</p>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Séance</th>
                <th>Durée</th>
                <th>Poids total</th>
                <th>Calories</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    popup.document.close()
    popup.focus()
    popup.print()
  }

  const applyPreset = (days: number | 'all') => {
    if (days === 'all') {
      setFromDate('')
      setToDate('')
      return
    }
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))
    setFromDate(start.toISOString().slice(0, 10))
    setToDate(end.toISOString().slice(0, 10))
  }

  return (
    <div className="page-wrap">
      <h1 className="section-title mb-8 reveal">{t('sessionHistory')}</h1>
      {resumeSessionHref && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="font-semibold">Séance en cours détectée</div>
          <div className="mt-1">
            Reprends ton entraînement avant d’en démarrer un nouveau.
            <Link href={resumeSessionHref} className="ml-2 font-semibold underline underline-offset-2">
              Reprendre la séance
            </Link>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-gray-500">Période</div>
          <button onClick={() => applyPreset(7)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            7 jours
          </button>
          <button onClick={() => applyPreset(30)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            30 jours
          </button>
          <button onClick={() => applyPreset(90)} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            90 jours
          </button>
          <button onClick={() => applyPreset('all')} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            Tout
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
            aria-label="Date de début"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
            aria-label="Date de fin"
          />
        </div>
        <button onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button onClick={exportPdf} className="btn-secondary inline-flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-compact bg-gradient-to-br from-primary-50 to-primary-100 reveal reveal-1 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('totalSessions')}</div>
              <div className="text-3xl font-bold text-primary-600">{filteredStats.total}</div>
            </div>
            <Calendar className="h-10 w-10 text-primary-600" />
          </div>
        </div>

        <div className="card-compact bg-gradient-to-br from-orange-50 to-orange-100 reveal reveal-2 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('currentStreak')}</div>
              <div className="text-3xl font-bold text-orange-600">{filteredStats.streak}</div>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-600" />
          </div>
        </div>

        <div className="card-compact bg-gradient-to-br from-green-50 to-green-100 reveal reveal-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('totalMinutes')}</div>
              <div className="text-3xl font-bold text-green-600">{filteredStats.totalMinutes}</div>
            </div>
            <Trophy className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="card-compact bg-gradient-to-br from-slate-50 to-slate-100 reveal reveal-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t('totalWeight')}</div>
              <div className="text-3xl font-bold text-slate-700">
                {filteredStats.totalWeight} kg
              </div>
            </div>
            <Trophy className="h-10 w-10 text-slate-700" />
          </div>
        </div>
      </div>

      {/* Historique */}
      <div>
        <div className="mb-8">
          <DashboardCalendar />
        </div>
        <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">{t('recentSessionsTitle')}</h2>
        {filteredHistory.length === 0 ? (
          <div className="card text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">{t('noSessions')}</p>
            <p className="text-gray-500">{t('startFirstSession')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((workout) => {
              const program = (workout as any).programId ? programsById[(workout as any).programId] : undefined
              const href =
                program && (workout as any).workoutId
                  ? `/programmes/${program.slug}/seances/${(workout as any).workoutId}`
                  : '/dashboard?view=session'
              return (
                <Link key={workout.id} href={href} className="block">
                <div className="card-soft hover:shadow-md transition-shadow">
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
                        <div className="mt-2 text-sm text-gray-600">
                          {workout.volume != null && (
                            <span className="mr-4">Poids total : {workout.volume} kg</span>
                          )}
                          {workout.calories != null && <span>Calories : {workout.calories} kcal</span>}
                        </div>
                        {workout.muscleUsage && workout.muscleUsage.length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            Muscles :{' '}
                            {normalizeMuscles(workout.muscleUsage)
                              .sort((a, b) => b.percent - a.percent)
                              .slice(0, 3)
                              .map((item) => `${muscleLabel(item.id)} ${item.percent}%`)
                              .join(' · ')}
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                          {t('completed')}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
