'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Play, Trophy, Activity, Flame, Timer } from 'lucide-react'
import { WorkoutHistoryItem } from '@/lib/history'
import Link from 'next/link'
import { programsById, programs } from '@/data/programs'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { muscleLabel } from '@/lib/muscles'
import { recommendProgram } from '@/lib/recommendation'
import { applyHistoryLimit, getEntitlement, hasProAccess, readBusinessSignals } from '@/lib/subscription'
import { readLocalHistory } from '@/lib/history-store'
import { readLocalSettings } from '@/lib/user-state-store'

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

type BusinessNudge = {
  title: string
  body: string
  cta: string
  href: string
}

export default function Feed() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [monthly, setMonthly] = useState({
    headline: 'Mois en cours',
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
  const [weeklyLoad, setWeeklyLoad] = useState<{
    current: number
    previous: number
    delta: number
    suggestion: string
  }>({
    current: 0,
    previous: 0,
    delta: 0,
    suggestion: 'Commence avec une charge modérée et augmente progressivement.',
  })
  const [deloadAlert, setDeloadAlert] = useState<{
    active: boolean
    reason?: string
    action?: string
  }>({ active: false })
  const [monthlyCompare, setMonthlyCompare] = useState<{
    currentVolume: number
    previousVolume: number
    currentSessions: number
    previousSessions: number
    deltaVolume: number
  }>({
    currentVolume: 0,
    previousVolume: 0,
    currentSessions: 0,
    previousSessions: 0,
    deltaVolume: 0,
  })
  const [businessNudge, setBusinessNudge] = useState<BusinessNudge | null>(null)
  const [entitlement, setEntitlement] = useState(() => getEntitlement())

  useEffect(() => {
    const applyPlan = () => setEntitlement(getEntitlement())
    applyPlan()
    window.addEventListener('fitpulse-plan', applyPlan)
    window.addEventListener('storage', applyPlan)
    return () => {
      window.removeEventListener('fitpulse-plan', applyPlan)
      window.removeEventListener('storage', applyPlan)
    }
  }, [])

  useEffect(() => {
    const computeNudge = () => {
      const ent = getEntitlement()
      if (hasProAccess(ent)) {
        setBusinessNudge(null)
        return
      }

      const signals = readBusinessSignals()
      const history = applyHistoryLimit(readLocalHistory() as WorkoutHistoryItem[], ent)

      if (ent.isTrialActive && ent.trialDaysLeft <= 3) {
        setBusinessNudge({
          title: `Continue sur ta lancée: ${ent.trialDaysLeft} jour(s)`,
          body: 'Maintiens ton rythme avec 2 à 3 séances cette semaine.',
          cta: 'Voir le dashboard',
          href: '/dashboard',
        })
        return
      }

      if (signals.lockedProgramAttempts >= 2) {
        setBusinessNudge({
          title: 'Tu explores plusieurs programmes',
          body: 'Choisis un plan hebdo simple pour garder une progression régulière.',
          cta: 'Voir les programmes',
          href: '/programmes',
        })
        return
      }

      if (signals.freeRoutineLimitHits >= 1) {
        setBusinessNudge({
          title: 'Limite de routines atteinte',
          body: 'Fais le tri dans tes routines ou adapte ton planning sur 3 séances fixes.',
          cta: 'Voir les routines',
          href: '/dashboard?view=routines',
        })
        return
      }

      if (!ent.isTrialActive && history.length >= 6) {
        setBusinessNudge({
          title: 'Tu es régulier, optimise ta progression',
          body: 'Analyse tes volumes hebdo et ajuste une semaine allégée si nécessaire.',
          cta: 'Voir l’historique',
          href: '/dashboard?view=history',
        })
        return
      }

      setBusinessNudge(null)
    }

    computeNudge()
    window.addEventListener('fitpulse-business-signals', computeNudge)
    window.addEventListener('fitpulse-history', computeNudge)
    window.addEventListener('fitpulse-plan', computeNudge)
    window.addEventListener('storage', computeNudge)
    return () => {
      window.removeEventListener('fitpulse-business-signals', computeNudge)
      window.removeEventListener('fitpulse-history', computeNudge)
      window.removeEventListener('fitpulse-plan', computeNudge)
      window.removeEventListener('storage', computeNudge)
    }
  }, [])

  useEffect(() => {
    const computeFeed = () => {
      try {
        const rawHistory = readLocalHistory() as WorkoutHistoryItem[]
        const stored = applyHistoryLimit(rawHistory, getEntitlement())
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
        const recapWindowDays = 5
        const isRecapWindow = now.getDate() <= recapWindowDays
        const periodStart = isRecapWindow
          ? new Date(now.getFullYear(), now.getMonth() - 1, 1)
          : new Date(now.getFullYear(), now.getMonth(), 1)
        const periodEnd = isRecapWindow
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const monthlyItems = stored.filter((item) => {
          const d = new Date(item.date)
          return d >= periodStart && d < periodEnd
        })
        const sessions = monthlyItems.length
        const minutes = monthlyItems.reduce((sum, item) => sum + (Number(item.duration) || 0), 0)
        const volume = monthlyItems.reduce((sum, item) => sum + (Number((item as any).volume) || 0), 0)
        const calories = monthlyItems.reduce((sum, item) => sum + (Number((item as any).calories) || 0), 0)
        const monthLabel = periodStart.toLocaleDateString(navigator.language || 'fr-FR', {
          month: 'long',
          year: 'numeric',
        })
        setMonthly({
          headline: isRecapWindow ? 'Récap mensuel' : 'Mois en cours',
          monthLabel,
          sessions,
          minutes,
          volume,
          calories,
        })
        const previousMonthStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, 1)
        const previousMonthEnd = periodStart
        const previousMonthItems = stored.filter((item) => {
          const d = new Date(item.date)
          return d >= previousMonthStart && d < previousMonthEnd
        })
        const previousMonthVolume = previousMonthItems.reduce(
          (sum, item) => sum + (Number((item as any).volume) || 0),
          0
        )
        const deltaVolume =
          previousMonthVolume > 0
            ? Math.round(((volume - previousMonthVolume) / previousMonthVolume) * 100)
            : 0
        setMonthlyCompare({
          currentVolume: Math.round(volume),
          previousVolume: Math.round(previousMonthVolume),
          currentSessions: monthlyItems.length,
          previousSessions: previousMonthItems.length,
          deltaVolume,
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

        const nowTs = Date.now()
        const dayMs = 24 * 60 * 60 * 1000
        const currentWindowStart = nowTs - 7 * dayMs
        const previousWindowStart = nowTs - 14 * dayMs
        const previousWindowEnd = currentWindowStart

        const currentLoad = stored
          .filter((item: any) => {
            const ts = new Date(item.date).getTime()
            return ts >= currentWindowStart && ts <= nowTs
          })
          .reduce((sum: number, item: any) => sum + (Number(item.volume) || 0), 0)

        const previousLoad = stored
          .filter((item: any) => {
            const ts = new Date(item.date).getTime()
            return ts >= previousWindowStart && ts < previousWindowEnd
          })
          .reduce((sum: number, item: any) => sum + (Number(item.volume) || 0), 0)

        const delta =
          previousLoad > 0 ? Math.round(((currentLoad - previousLoad) / previousLoad) * 100) : 0
        const suggestion =
          delta >= 20
            ? 'Charge en hausse forte: prévois une semaine allégée (deload) si fatigue élevée.'
            : delta <= -20
            ? 'Charge en baisse: remonte progressivement de 5 à 10% cette semaine.'
            : 'Progression stable: garde la qualité des exécutions et le tempo.'
        setWeeklyLoad({
          current: Math.round(currentLoad),
          previous: Math.round(previousLoad),
          delta,
          suggestion,
        })
        const monthlySessionRate = sessions
        const highVolumeSpike = delta >= 20 && currentLoad > 0
        const highFrequency = monthlySessionRate >= 12
        const needsDeload = highVolumeSpike || (delta >= 12 && highFrequency)
        setDeloadAlert(
          needsDeload
            ? {
                active: true,
                reason:
                  delta >= 20
                    ? `Charge +${delta}% vs semaine précédente`
                    : `Fréquence élevée (${monthlySessionRate} séances ce mois-ci)`,
                action:
                  'Semaine prochaine: -30% de volume, garde la technique, puis reprise progressive.',
              }
            : { active: false }
        )

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
          const settings = readLocalSettings() as {
            level?: string
            goals?: string[]
            equipment?: string[]
            sessionsPerWeek?: number
          }
          const pick = recommendProgram(programs, {
            level: settings.level,
            goals: settings.goals,
            equipment: settings.equipment,
            sessionsPerWeek: settings.sessionsPerWeek,
          })?.program

          setFocus({
            programId: pick?.id,
            sessionId: pick?.sessions[0]?.id,
            title: pick?.name || 'Commencer un programme',
            subtitle: pick ? `Recommandé selon ton profil: ${pick.sessions[0]?.name || 'Séance 1'}` : 'Choisis un programme pour démarrer.',
            duration: pick?.sessions[0]?.duration,
          })
        }
      } catch {
        setItems([])
      }
    }

    computeFeed()
    window.addEventListener('fitpulse-history', computeFeed)
    window.addEventListener('fitpulse-settings', computeFeed)
    window.addEventListener('fitpulse-plan', computeFeed)
    window.addEventListener('storage', computeFeed)
    return () => {
      window.removeEventListener('fitpulse-history', computeFeed)
      window.removeEventListener('fitpulse-settings', computeFeed)
      window.removeEventListener('fitpulse-plan', computeFeed)
      window.removeEventListener('storage', computeFeed)
    }
  }, [entitlement.plan, entitlement.effectivePlan, entitlement.trialDaysLeft, entitlement.isTrialActive])

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
          <p className="text-sm text-gray-500 mt-1">{monthly.headline} · {monthly.monthLabel}</p>
        </div>
        <div className="text-xs text-gray-500">Dernière mise à jour automatique</div>
      </div>
      {!hasProAccess(entitlement) && (
        <div className="mb-8 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900">
          {entitlement.isTrialActive
            ? `Mode guidé actif: ${entitlement.trialDaysLeft} jour(s) restants.`
            : 'Toutes les fonctionnalités sont disponibles dans ta version actuelle.'}
          <Link href="/programmes" className="ml-2 font-semibold underline underline-offset-2">
            Voir les programmes
          </Link>
        </div>
      )}
      {businessNudge && (
        <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Suggestion FitPulse</div>
          <div className="mt-1 text-base font-semibold text-amber-900">{businessNudge.title}</div>
          <div className="mt-1 text-sm text-amber-800">{businessNudge.body}</div>
          <Link href={businessNudge.href} className="mt-3 inline-flex btn-secondary">
            {businessNudge.cta}
          </Link>
        </div>
      )}

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

      {deloadAlert.active && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Alerte récupération</div>
          <div className="mt-1 text-base font-semibold text-amber-900">Deload recommandé</div>
          <div className="mt-1 text-sm text-amber-800">
            {deloadAlert.reason}. {deloadAlert.action}
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
                  <span>{muscleLabel(muscle.id, 'fr')}</span>
                  <span>{muscle.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${muscle.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={`card-compact transition-all hover:-translate-y-0.5 hover:shadow-md ${!hasProAccess(entitlement) ? 'opacity-75' : ''}`}>
          <div className="text-xs text-gray-500">Meilleur PR ce mois-ci</div>
          {hasProAccess(entitlement) ? (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">{monthlyPr?.value ?? '—'} kg</div>
                <div className="text-xs text-gray-500">{monthlyPr?.label ?? 'Aucun PR enregistré'}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-600">
              Stat indisponible temporairement.
              <Link href="/dashboard?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
                Historique
              </Link>
            </div>
          )}
        </div>
        <div className={`card-compact transition-all hover:-translate-y-0.5 hover:shadow-md ${!hasProAccess(entitlement) ? 'opacity-75' : ''}`}>
          <div className="text-xs text-gray-500">Charge hebdo</div>
          {hasProAccess(entitlement) ? (
            <>
              <div className="mt-2 text-sm text-gray-700">
                Semaine actuelle: <span className="font-semibold text-gray-900">{weeklyLoad.current} kg</span>
              </div>
              <div className="text-sm text-gray-700">
                Semaine précédente: <span className="font-semibold text-gray-900">{weeklyLoad.previous} kg</span>
              </div>
              <div className={`mt-2 text-xs font-semibold ${weeklyLoad.delta >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                Variation: {weeklyLoad.delta >= 0 ? '+' : ''}{weeklyLoad.delta}%
              </div>
              <div className="mt-2 text-sm text-gray-700">
                {weeklyLoad.suggestion}
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm text-gray-600">
              Analyse de charge indisponible temporairement.
              <Link href="/dashboard?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
                Historique
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className={`card-compact mb-8 ${!hasProAccess(entitlement) ? 'opacity-75' : ''}`}>
        <div className="text-xs text-gray-500">Comparaison mensuelle</div>
        {hasProAccess(entitlement) ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              Ce mois: <span className="font-semibold text-gray-900">{monthlyCompare.currentVolume} kg</span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              Mois précédent: <span className="font-semibold text-gray-900">{monthlyCompare.previousVolume} kg</span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              Variation: <span className={`font-semibold ${monthlyCompare.deltaVolume >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {monthlyCompare.deltaVolume >= 0 ? '+' : ''}{monthlyCompare.deltaVolume}%
              </span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              Séances ce mois: <span className="font-semibold text-gray-900">{monthlyCompare.currentSessions}</span>
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              Séances mois précédent: <span className="font-semibold text-gray-900">{monthlyCompare.previousSessions}</span>
            </div>
          </div>
        ) : (
          <div className="mt-3 text-sm text-gray-600">
            Comparaison indisponible temporairement.
            <Link href="/dashboard?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
              Historique
            </Link>
          </div>
        )}
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
            const history = applyHistoryLimit(
              readLocalHistory() as any[],
              getEntitlement()
            )
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
