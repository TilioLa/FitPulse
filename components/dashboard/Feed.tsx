'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Play, Trophy, Activity, Flame, Timer } from 'lucide-react'
import { WorkoutHistoryItem } from '@/lib/history'
import Link from 'next/link'
import { programsById, programs } from '@/data/programs'
import StartProgramButton from '@/components/programmes/StartProgramButton'

type FeedItem = {
  id: string
  workoutName: string
  date: string
  duration: number
  workoutId?: string
  programId?: string
  calories?: number
  volume?: number
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [monthly, setMonthly] = useState({
    monthLabel: '',
    sessions: 0,
    minutes: 0,
    volume: 0,
    calories: 0,
  })
  const [monthlyMuscles, setMonthlyMuscles] = useState<{ id: string; percent: number }[]>([])
  const [monthlyPr, setMonthlyPr] = useState<{ value: number; label: string } | null>(null)
  const [focus, setFocus] = useState<{
    programId?: string
    sessionId?: string
    title: string
    subtitle: string
    duration?: number
  } | null>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as WorkoutHistoryItem[]
      const list = stored
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((item) => ({
          id: `${item.workoutId || item.programId || item.date}`,
          workoutName: item.workoutName,
          date: item.date,
          duration: item.duration,
          workoutId: (item as any).workoutId,
          programId: (item as any).programId,
          calories: (item as any).calories,
          volume: (item as any).volume,
        }))
      setItems(list)

      const now = new Date()
      const month = now.getMonth()
      const year = now.getFullYear()
      const monthlyItems = stored.filter((item) => {
        const d = new Date(item.date)
        return d.getMonth() === month && d.getFullYear() === year
      })
      const sessions = monthlyItems.length
      const minutes = monthlyItems.reduce((sum, item) => sum + (Number(item.duration) || 0), 0)
      const volume = monthlyItems.reduce((sum, item) => sum + (Number((item as any).volume) || 0), 0)
      const calories = monthlyItems.reduce((sum, item) => sum + (Number((item as any).calories) || 0), 0)
      const monthLabel = now.toLocaleDateString(navigator.language || 'fr-FR', {
        month: 'long',
        year: 'numeric',
      })
      setMonthly({
        monthLabel,
        sessions,
        minutes,
        volume,
        calories,
      })

      const muscleTotals = monthlyItems.reduce((acc: Record<string, number>, item: any) => {
        const muscles = item.muscleUsage || []
        muscles.forEach((muscle: any) => {
          acc[muscle.id] = (acc[muscle.id] || 0) + (Number(muscle.percent) || 0)
        })
        return acc
      }, {})
      const muscleTotalValue = Object.values(muscleTotals).reduce((sum, value) => sum + value, 0) || 1
      const muscleUsage = Object.entries(muscleTotals).map(([id, value]) => ({
        id,
        percent: Math.round((value / muscleTotalValue) * 100),
      }))
      setMonthlyMuscles(muscleUsage.sort((a, b) => b.percent - a.percent).slice(0, 3))

      const allRecords = monthlyItems.flatMap((item: any) => item.records || [])
      const bestRecord = allRecords.reduce((max: any, record: any) => {
        if (!record?.bestOneRm) return max
        if (!max || record.bestOneRm > max.value) {
          return { value: record.bestOneRm, label: record.name }
        }
        return max
      }, null)
      setMonthlyPr(bestRecord)

      const lastProgramEntry = stored.find((item) => (item as any).programId)
      if (lastProgramEntry) {
        const programId = (lastProgramEntry as any).programId as string
        const program = programsById[programId]
        if (program) {
          const completedIds = new Set(
            stored.filter((item) => (item as any).programId === programId).map((item) => (item as any).workoutId)
          )
          const nextSession = program.sessions.find((session) => !completedIds.has(session.id)) || program.sessions[0]
          setFocus({
            programId,
            sessionId: nextSession?.id,
            title: program.name,
            subtitle: nextSession?.name || 'Séance du jour',
            duration: nextSession?.duration,
          })
        }
      } else if (programs.length > 0) {
        setFocus({
          title: 'Commencer un programme',
          subtitle: 'Choisis un programme pour démarrer.',
        })
      }
    } catch {
      setItems([])
    }
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(navigator.language || 'fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page-wrap">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Home</h1>
          <p className="text-sm text-gray-500 mt-1">Récap mensuel · {monthly.monthLabel}</p>
        </div>
        <div className="text-xs text-gray-500">Dernière mise à jour automatique</div>
      </div>

      {focus && (
        <div className="mb-8 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-8 shadow-sm reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Focus du jour</div>
              <div className="text-2xl font-semibold text-gray-900 mt-2">{focus.title}</div>
              <div className="text-sm text-gray-600 mt-1">{focus.subtitle}</div>
              {focus.duration && (
                <div className="mt-2 text-sm text-gray-600">
                  Durée estimée : {focus.duration} min
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {focus.programId && focus.sessionId ? (
                <>
                  <Link
                    href={`/programmes/${programsById[focus.programId]?.slug}/seances/${focus.sessionId}`}
                    className="btn-secondary"
                  >
                    Voir la séance
                  </Link>
                   <StartProgramButton
                     program={programsById[focus.programId]}
                     label="Démarrer la prochaine séance"
                    className="btn-primary shadow-lg hover:shadow-xl"
                   />
                </>
              ) : (
                <Link href="/programmes" className="btn-primary flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Voir les programmes
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 reveal reveal-1">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Séances</div>
          <div className="text-2xl font-bold text-gray-900">{monthly.sessions}</div>
            </div>
            <Activity className="h-5 w-5 text-primary-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Minutes</div>
          <div className="text-2xl font-bold text-gray-900">{monthly.minutes}</div>
            </div>
            <Timer className="h-5 w-5 text-primary-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Poids total</div>
          <div className="text-2xl font-bold text-gray-900">{monthly.volume} kg</div>
            </div>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Calories</div>
          <div className="text-2xl font-bold text-gray-900">{monthly.calories} kcal</div>
            </div>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8 reveal reveal-2">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-gray-500">Muscles les plus sollicités</div>
          <div className="mt-3 space-y-2">
            {monthlyMuscles.length === 0 && (
              <div className="text-sm text-gray-500">Pas encore de données.</div>
            )}
            {monthlyMuscles.map((muscle) => (
              <div key={muscle.id}>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{muscle.id}</span>
                  <span>{muscle.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${muscle.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-gray-500">Meilleur PR ce mois-ci</div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{monthlyPr?.value ?? '—'} kg</div>
              <div className="text-xs text-gray-500">{monthlyPr?.label ?? 'Aucun PR enregistré'}</div>
            </div>
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="text-xs text-gray-500">Conseil du jour</div>
          <div className="mt-3 text-sm text-gray-700">
            Garde une exécution contrôlée. Qualité d’abord, progression ensuite.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Dernières séances</h2>
        <span className="text-xs text-gray-500">Clique pour ouvrir le détail</span>
      </div>
      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">Aucune séance enregistrée.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const program = item.programId ? programsById[item.programId] : undefined
            const href = program && item.workoutId
              ? `/programmes/${program.slug}/seances/${item.workoutId}`
              : '/dashboard?view=session'
            const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as any[]
            const current = history.find((entry) => entry.id === item.id)
            const previous = history.filter((entry) => new Date(entry.date) < new Date(item.date))
            const isPR =
              current?.records?.some((record: any) => {
                const previousBest = previous.flatMap((entry) => entry.records || [])
                  .filter((r: any) => r.id === record.id)
                  .reduce((max: number, r: any) => Math.max(max, r.bestOneRm || 0), 0)
                return (record.bestOneRm || 0) > previousBest
              }) || false
            return (
              <Link key={item.id} href={href} className="block group">
                <div className="card hover:shadow-xl transition-shadow border border-transparent group-hover:border-primary-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.workoutName}</h3>
                      <div className="flex items-center space-x-4 text-gray-600 text-sm mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{item.duration} min</span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {item.volume != null && <span>Poids total : {item.volume} kg</span>}
                        {item.calories != null && (
                          <span className="ml-2">· Calories : {item.calories} kcal</span>
                        )}
                      </div>
                      {isPR && (
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                          <Trophy className="h-3 w-3" />
                          PR battu
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                        Terminée
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
  )
}
