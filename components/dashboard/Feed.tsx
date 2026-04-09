'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Play, Trophy, Activity, Flame, Timer, Target, Sparkles, ChevronRight } from 'lucide-react'
import { computeHistoryStats, toLocalDateKey, WorkoutHistoryItem } from '@/lib/history'
import Link from 'next/link'
import { programsById, programs } from '@/data/programs'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { muscleLabel } from '@/lib/muscles'
import { recommendProgram } from '@/lib/recommendation'
import { shouldTrainToday, didWorkoutToday } from '@/lib/reminder-logic'
import { applyHistoryLimit, getEntitlement, hasProAccess, readBusinessSignals } from '@/lib/subscription'
import { readLocalHistory } from '@/lib/history-store'
import { readLocalCurrentWorkout, readLocalSettings } from '@/lib/user-state-store'
import { useToast } from '@/components/ui/ToastProvider'
import type { SharedSessionPayload } from '@/lib/session-share'
import { localizeExerciseNameFr } from '@/lib/exercise-name-fr'
import { trackEvent } from '@/lib/analytics-client'
import {
  applyOnboardingAnswers,
  getDefaultOnboardingAnswers,
  isOnboardingProfileComplete,
  readOnboardingState,
  writeOnboardingState,
  type OnboardingAnswers,
} from '@/lib/onboarding'

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

type NextAction = {
  title: string
  body: string
  cta: string
  href: string
}

type ReminderCard = {
  title: string
  body: string
  cta: string
  href: string
}

type Badge = {
  id: string
  label: string
  detail: string
  earned: boolean
}

type QuickStart = {
  title: string
  body: string
  cta: string
  href: string
}

type OnboardingStep = {
  id: 'profile' | 'first_session_started' | 'first_session_done'
  label: string
  done: boolean
  href: string
  cta: string
}

type ExerciseProgress = {
  name: string
  sessions: number
  volume: number
  bestOneRm: number
  oneRmTrend: number
  regularity30d: number
}

const toDayKey = (value: string) => value.slice(0, 10)

const computeBestStreak = (dates: string[]) => {
  if (dates.length === 0) return 0
  const ordered = Array.from(new Set(dates.map(toDayKey)))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  let best = 1
  let current = 1
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = new Date(ordered[index - 1]).getTime()
    const next = new Date(ordered[index]).getTime()
    const diffDays = Math.round((next - previous) / (24 * 60 * 60 * 1000))
    if (diffDays === 1) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
}

const estimateOneRm = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) return 0
  return Math.round(weight * (1 + reps / 30))
}

const suggestCatchUpDays = (remainingSessions: number, sessionsDoneToday: number) => {
  if (remainingSessions <= 0) return [] as string[]
  const startOffset = sessionsDoneToday > 0 ? 1 : 0
  const upcoming = Array.from({ length: Math.max(remainingSessions, 7 - startOffset) }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + startOffset + index)
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' }).replace('.', '')
  })
  const picks: string[] = []
  const step = Math.max(1, Math.floor(upcoming.length / remainingSessions))
  for (let cursor = 0; cursor < upcoming.length && picks.length < remainingSessions; cursor += step) {
    picks.push(upcoming[cursor])
  }
  while (picks.length < remainingSessions && picks.length < upcoming.length) {
    picks.push(upcoming[picks.length])
  }
  return picks.slice(0, remainingSessions)
}

const challengeProgress = (dates: string[], days: number) => {
  if (dates.length === 0) return { done: 0, target: days, percent: 0 }
  const since = Date.now() - days * 24 * 60 * 60 * 1000
  const done = new Set(
    dates
      .filter((date) => new Date(date).getTime() >= since)
      .map((date) => toDayKey(date))
  ).size
  const target = Math.max(1, Math.floor(days / 2))
  return { done, target, percent: Math.min(100, Math.round((done / target) * 100)) }
}

export default function Feed() {
  const { push } = useToast()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers>(() => getDefaultOnboardingAnswers())
  const [items, setItems] = useState<FeedItem[]>([])
  const [globalStats, setGlobalStats] = useState({
    streak: 0,
    bestStreak: 0,
    totalWorkouts: 0,
    totalMinutes: 0,
    weeklySessions: 0,
    avgDuration: 0,
  })
  const [weeklyGoal, setWeeklyGoal] = useState({ target: 3, completed: 0 })
  const [weekTrend, setWeekTrend] = useState<{ day: string; sessions: number; minutes: number }[]>([])
  const [consistency, setConsistency] = useState({
    score: 0,
    last28Sessions: 0,
    targetSessions: 12,
    weeks: [0, 0, 0, 0] as number[],
  })
  const [recovery, setRecovery] = useState({
    score: 80,
    status: 'Equilibre',
    hint: 'Rythme stable, continue sur ce volume.',
  })
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
  const [nextAction, setNextAction] = useState<NextAction | null>(null)
  const [reminderCard, setReminderCard] = useState<ReminderCard | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [nextBadge, setNextBadge] = useState<Badge | null>(null)
  const [quickStart, setQuickStart] = useState<QuickStart | null>(null)
  const [resumeSessionHref, setResumeSessionHref] = useState<string | null>(null)
  const [weeklyCatchUpDays, setWeeklyCatchUpDays] = useState<string[]>([])
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>([])
  const [entitlement, setEntitlement] = useState(() => getEntitlement())
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([])

  useEffect(() => {
    const syncOnboarding = () => {
      const e2eBypassEnabled =
        process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'e2e-anon-key' ||
        (typeof window !== 'undefined' && window.localStorage.getItem('fitpulse_e2e_bypass') === 'true')
      if (e2eBypassEnabled) {
        setOnboardingOpen(false)
        return
      }
      const state = readOnboardingState()
      if (!isOnboardingProfileComplete() && !state.dismissed && !state.completed) {
        setOnboardingAnswers(state.answers || getDefaultOnboardingAnswers())
        setOnboardingOpen(true)
      } else {
        setOnboardingOpen(false)
      }
    }
    syncOnboarding()
    window.addEventListener('fitpulse-onboarding', syncOnboarding)
    window.addEventListener('fitpulse-settings', syncOnboarding)
    return () => {
      window.removeEventListener('fitpulse-onboarding', syncOnboarding)
      window.removeEventListener('fitpulse-settings', syncOnboarding)
    }
  }, [])

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
          href: '/profil?view=history',
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
        const { deduped, streak, totalWorkouts, totalMinutes } = computeHistoryStats(stored)
        const weekAgoTs = Date.now() - 7 * 24 * 60 * 60 * 1000
        const weeklySessions = deduped.filter((item) => new Date(item.date).getTime() >= weekAgoTs).length
        const avgDuration = totalWorkouts > 0 ? Math.round(totalMinutes / totalWorkouts) : 0
        setGlobalStats({
          streak,
          bestStreak: computeBestStreak(deduped.map((item) => item.date)),
          totalWorkouts,
          totalMinutes,
          weeklySessions,
          avgDuration,
        })
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

        const settings = readLocalSettings() as {
          level?: string
          goals?: string[]
          equipment?: string[]
          sessionsPerWeek?: number
        }
        const targetSessionsPerWeek = Math.max(1, Math.min(7, Number(settings.sessionsPerWeek) || 3))
        const sevenDaySeries = Array.from({ length: 7 }, (_, index) => {
          const date = new Date()
          date.setDate(date.getDate() - (6 - index))
          const dayKey = toLocalDateKey(date)
          const dayEntries = stored.filter((item) => toLocalDateKey(item.date) === dayKey)
          return {
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            sessions: dayEntries.length,
            minutes: dayEntries.reduce((sum, item) => sum + (Number(item.duration) || 0), 0),
          }
        })
        setWeekTrend(sevenDaySeries)
        setWeeklyGoal({
          target: targetSessionsPerWeek,
          completed: sevenDaySeries.reduce((sum, day) => sum + day.sessions, 0),
        })
        const sessionsDoneToday = sevenDaySeries[6]?.sessions || 0
        const remainingSessions = Math.max(
          0,
          targetSessionsPerWeek - sevenDaySeries.reduce((sum, day) => sum + day.sessions, 0)
        )
        setWeeklyCatchUpDays(suggestCatchUpDays(remainingSessions, sessionsDoneToday))
        const weekBuckets = Array.from({ length: 4 }, (_, index) => {
          const end = new Date()
          end.setHours(23, 59, 59, 999)
          end.setDate(end.getDate() - (3 - index) * 7)
          const start = new Date(end)
          start.setHours(0, 0, 0, 0)
          start.setDate(start.getDate() - 6)
          return stored.filter((item) => {
            const ts = new Date(item.date).getTime()
            return ts >= start.getTime() && ts <= end.getTime()
          }).length
        })
        const last28Sessions = weekBuckets.reduce((sum, value) => sum + value, 0)
        const targetSessions = targetSessionsPerWeek * 4
        const consistencyScore = Math.min(100, Math.round((last28Sessions / Math.max(1, targetSessions)) * 100))
        setConsistency({
          score: consistencyScore,
          last28Sessions,
          targetSessions,
          weeks: weekBuckets,
        })

        const currentWorkout = readLocalCurrentWorkout() as {
          status?: string
          programId?: string
          id?: string
        } | null
        const hasInProgressWorkout = currentWorkout?.status === 'in_progress'
        const workoutProgram = currentWorkout?.programId ? programsById[currentWorkout.programId] : null
        const workoutSessionId = typeof currentWorkout?.id === 'string' ? currentWorkout.id : null
        const resumeHref =
          workoutProgram && workoutSessionId
            ? `/programmes/${workoutProgram.slug}/seances/${workoutSessionId}`
            : '/dashboard?view=session'
        setResumeSessionHref(hasInProgressWorkout ? resumeHref : null)
        const historyProgramIds = stored
          .map((item) => item.programId)
          .filter(Boolean) as string[]
        const recommendedPick = recommendProgram(programs, {
          level: settings.level,
          goals: settings.goals,
          equipment: settings.equipment,
          sessionsPerWeek: settings.sessionsPerWeek,
          historyProgramIds,
          recentProgramId: historyProgramIds[0] || null,
        })?.program
        const quickStartHref =
          hasInProgressWorkout ? resumeHref :
          recommendedPick?.slug && recommendedPick.sessions?.[0]?.id
            ? `/programmes/${recommendedPick.slug}/seances/${recommendedPick.sessions[0].id}`
            : '/dashboard?view=session'
        const quickStartTitle = hasInProgressWorkout ? 'Reprendre rapidement' : 'Démarrage rapide'
        const quickStartBody = hasInProgressWorkout
          ? 'Ta séance est en pause. Reprends en un clic.'
          : recommendedPick
          ? `Séance recommandée: ${recommendedPick.name}.`
          : 'Lance une séance en un clic.'
        const quickStartCta = hasInProgressWorkout ? 'Reprendre' : 'Démarrer'
        setQuickStart({
          title: quickStartTitle,
          body: quickStartBody,
          cta: quickStartCta,
          href: quickStartHref,
        })
        const hasProfile =
          Boolean(settings.level) &&
          Array.isArray(settings.goals) &&
          settings.goals.length > 0 &&
          Array.isArray(settings.equipment) &&
          settings.equipment.length > 0
        const hasStartedWorkout = Boolean(hasInProgressWorkout || stored.length > 0)
        const hasCompletedWorkout = stored.length > 0
        setOnboardingSteps([
          {
            id: 'profile',
            label: 'Compléter ton profil fitness',
            done: hasProfile,
            href: '/settings',
            cta: 'Configurer',
          },
          {
            id: 'first_session_started',
            label: 'Lancer ta première séance',
            done: hasStartedWorkout,
            href: '/dashboard?view=session',
            cta: 'Démarrer',
          },
          {
            id: 'first_session_done',
            label: 'Terminer ta première séance',
            done: hasCompletedWorkout,
            href: '/dashboard?view=session',
            cta: 'Continuer',
          },
        ])

        const lastSessionDate = stored.length > 0 ? new Date(stored[0].date).getTime() : null
        const daysSinceLastSession =
          lastSessionDate != null
            ? Math.floor((Date.now() - lastSessionDate) / (24 * 60 * 60 * 1000))
            : null

        if (!hasProfile) {
          setNextAction({
            title: 'Complète ton profil',
            body: 'Ajoute tes objectifs, ton niveau et ton matériel pour une recommandation plus précise.',
            cta: 'Ouvrir les paramètres',
            href: '/settings',
          })
        } else if (hasInProgressWorkout) {
          setNextAction({
            title: 'Séance interrompue détectée',
            body: 'Reprends là où tu t’es arrêté pour garder ton rythme.',
            cta: 'Reprendre la séance',
            href: resumeHref,
          })
        } else if (daysSinceLastSession != null && daysSinceLastSession >= 4) {
          setNextAction({
            title: 'Reprendre l’entraînement',
            body: `Dernière séance il y a ${daysSinceLastSession} jour(s). Relance un bloc court aujourd’hui.`,
            cta: 'Lancer une séance',
            href: '/dashboard?view=session',
          })
        } else {
          const recommendedHref =
            recommendedPick?.slug && recommendedPick.sessions?.[0]?.id
              ? `/programmes/${recommendedPick.slug}/seances/${recommendedPick.sessions[0].id}`
              : '/dashboard?view=programs'
          setNextAction({
            title: 'Planifier la prochaine séance',
            body: 'Choisis ton prochain entraînement pour rester régulier cette semaine.',
            cta: recommendedPick ? 'Lancer la séance recommandée' : 'Voir les programmes',
            href: recommendedHref,
          })
        }

        const shouldTrain = shouldTrainToday(settings)
        const didTrain = didWorkoutToday(stored)
        if (shouldTrain && !didTrain && !hasInProgressWorkout) {
          setReminderCard({
            title: 'Séance prévue aujourd’hui',
            body: 'Une séance est planifiée pour aujourd’hui. Lance une session pour garder ta streak.',
            cta: 'Démarrer une séance',
            href: '/dashboard?view=session',
          })
        } else {
          setReminderCard(null)
        }

        const weeklyGoalDone = weeklySessions >= targetSessionsPerWeek
        const weekKey = (() => {
          const now = new Date()
          const start = new Date(now.getFullYear(), 0, 1)
          const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
          const week = Math.floor((days + start.getDay()) / 7) + 1
          return `${now.getFullYear()}-W${week}`
        })()
        const goalToastKey = `fitpulse_week_goal_done_${weekKey}`
        if (weeklyGoalDone && localStorage.getItem(goalToastKey) !== 'true') {
          push('Objectif hebdo atteint. Bravo !', 'success')
          localStorage.setItem(goalToastKey, 'true')
        }

        const badgeList: Badge[] = [
          {
            id: 'first-session',
            label: 'Première séance',
            detail: 'Terminer 1 séance',
            earned: totalWorkouts >= 1,
          },
          {
            id: 'weekly-goal',
            label: 'Objectif hebdo',
            detail: `${targetSessionsPerWeek} séances / semaine`,
            earned: weeklyGoalDone,
          },
          {
            id: 'streak-7',
            label: 'Streak 7 jours',
            detail: '7 jours consécutifs',
            earned: streak >= 7,
          },
          {
            id: 'minutes-100',
            label: '100 minutes',
            detail: '100 minutes totales',
            earned: totalMinutes >= 100,
          },
        ]
        setBadges(badgeList)
        setNextBadge(badgeList.find((badge) => !badge.earned) || null)

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

        const progressByExercise = new Map<
          string,
          {
            sessions: number
            volume: number
            oneRmSeries: { date: string; oneRm: number }[]
            activeDays30: Set<string>
          }
        >()
        const threshold30d = Date.now() - 30 * 24 * 60 * 60 * 1000
        stored.forEach((item) => {
          const itemTs = new Date(item.date).getTime()
          const itemDayKey = toLocalDateKey(item.date)
          const exercises = (item as any).exercises || []
          exercises.forEach((exercise: any) => {
            const name = String(exercise?.name || '').trim()
            if (!name) return
            const sets = (exercise?.sets || []) as { weight: number; reps: number }[]
            const volume = sets.reduce(
              (sum, set) => sum + (Number(set?.weight) || 0) * (Number(set?.reps) || 0),
              0
            )
            const oneRm = sets.reduce(
              (max, set) => Math.max(max, estimateOneRm(Number(set?.weight) || 0, Number(set?.reps) || 0)),
              0
            )
            const existing = progressByExercise.get(name) || {
              sessions: 0,
              volume: 0,
              oneRmSeries: [],
              activeDays30: new Set<string>(),
            }
            existing.sessions += 1
            existing.volume += volume
            if (oneRm > 0) {
              existing.oneRmSeries.push({ date: item.date, oneRm })
            }
            if (itemTs >= threshold30d) {
              existing.activeDays30.add(itemDayKey)
            }
            progressByExercise.set(name, existing)
          })
        })
        const progressRows = Array.from(progressByExercise.entries())
          .map(([name, data]) => {
            const sortedOneRm = data.oneRmSeries
              .slice()
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            const latest = sortedOneRm[sortedOneRm.length - 1]?.oneRm || 0
            const previous = sortedOneRm[sortedOneRm.length - 2]?.oneRm || 0
            const trend = previous > 0 ? Math.round(((latest - previous) / previous) * 100) : 0
            const bestOneRm = sortedOneRm.reduce((max, point) => Math.max(max, point.oneRm), 0)
            return {
              name,
              sessions: data.sessions,
              volume: Math.round(data.volume),
              bestOneRm,
              oneRmTrend: trend,
              regularity30d: data.activeDays30.size,
            } as ExerciseProgress
          })
          .sort((a, b) => b.sessions - a.sessions || b.volume - a.volume)
          .slice(0, 4)
        setExerciseProgress(progressRows)

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
        const sortedByDate = stored
          .slice()
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const latestSession = sortedByDate[0]
        const recoveryDaysSinceLastSession = latestSession
          ? Math.floor((Date.now() - new Date(latestSession.date).getTime()) / (24 * 60 * 60 * 1000))
          : null
        let recoveryScore = 85
        let recoveryStatus = 'Equilibre'
        let recoveryHint = 'Rythme stable, continue sur ce volume.'
        if (recoveryDaysSinceLastSession == null) {
          recoveryScore = 100
          recoveryStatus = 'Prêt'
          recoveryHint = 'Aucune fatigue détectée. Démarre une première séance progressive.'
        } else if (recoveryDaysSinceLastSession >= 4) {
          recoveryScore = 50
          recoveryStatus = 'Reprise'
          recoveryHint = 'Dernière séance ancienne: fais une reprise progressive sur 1 à 2 séances.'
        } else if (weeklySessions > targetSessionsPerWeek + 2 || delta >= 20) {
          recoveryScore = 58
          recoveryStatus = 'Charge haute'
          recoveryHint = 'Volume élevé: prévois une séance légère ou un jour de récupération active.'
        } else if (weeklySessions < Math.max(1, targetSessionsPerWeek - 2)) {
          recoveryScore = 75
          recoveryStatus = 'Sous-charge'
          recoveryHint = 'Tu peux augmenter légèrement le volume pour maintenir la progression.'
        }
        setRecovery({
          score: recoveryScore,
          status: recoveryStatus,
          hint: recoveryHint,
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
          const pick = recommendedPick

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
        setGlobalStats({
          streak: 0,
          bestStreak: 0,
          totalWorkouts: 0,
          totalMinutes: 0,
          weeklySessions: 0,
          avgDuration: 0,
        })
        setWeekTrend([])
        setWeeklyGoal({ target: 3, completed: 0 })
        setConsistency({
          score: 0,
          last28Sessions: 0,
          targetSessions: 12,
          weeks: [0, 0, 0, 0],
        })
        setRecovery({
          score: 80,
          status: 'Equilibre',
          hint: 'Rythme stable, continue sur ce volume.',
        })
        setMonthly({
          headline: 'Mois en cours',
          monthLabel: '',
          sessions: 0,
          minutes: 0,
          volume: 0,
          calories: 0,
        })
        setMonthlyMuscles([])
        setMonthlyPr(null)
        setFocus(null)
        setWeeklyLoad({
          current: 0,
          previous: 0,
          delta: 0,
          suggestion: 'Commence avec une charge modérée et augmente progressivement.',
        })
        setDeloadAlert({ active: false })
        setMonthlyCompare({
          currentVolume: 0,
          previousVolume: 0,
          currentSessions: 0,
          previousSessions: 0,
          deltaVolume: 0,
        })
        setBusinessNudge(null)
        setExerciseProgress([])
        setWeeklyCatchUpDays([])
        setResumeSessionHref(null)
        setNextAction({
          title: 'Complète ton profil',
          body: 'Ajoute tes objectifs, ton niveau et ton matériel pour une recommandation plus précise.',
          cta: 'Ouvrir les paramètres',
          href: '/settings',
        })
        setOnboardingSteps([
          {
            id: 'profile',
            label: 'Compléter ton profil fitness',
            done: false,
            href: '/settings',
            cta: 'Configurer',
          },
          {
            id: 'first_session_started',
            label: 'Lancer ta première séance',
            done: false,
            href: '/dashboard?view=session',
            cta: 'Démarrer',
          },
          {
            id: 'first_session_done',
            label: 'Terminer ta première séance',
            done: false,
            href: '/dashboard?view=session',
            cta: 'Continuer',
          },
        ])
      }
    }

    computeFeed()
    window.addEventListener('fitpulse-history', computeFeed)
    window.addEventListener('fitpulse-settings', computeFeed)
    window.addEventListener('fitpulse-current-workout', computeFeed)
    window.addEventListener('fitpulse-plan', computeFeed)
    window.addEventListener('storage', computeFeed)
    return () => {
      window.removeEventListener('fitpulse-history', computeFeed)
      window.removeEventListener('fitpulse-settings', computeFeed)
      window.removeEventListener('fitpulse-current-workout', computeFeed)
      window.removeEventListener('fitpulse-plan', computeFeed)
      window.removeEventListener('storage', computeFeed)
    }
  }, [entitlement.plan, entitlement.effectivePlan, entitlement.trialDaysLeft, entitlement.isTrialActive, push])

  useEffect(() => {
    if (onboardingSteps.length === 0) return
    const allDone = onboardingSteps.every((step) => step.done)
    if (!allDone) return
    const key = 'fitpulse_onboarding_complete_toast_v1'
    if (localStorage.getItem(key) === 'true') return
    push('Bravo, onboarding terminé. Tu es prêt pour progresser.', 'success')
    localStorage.setItem(key, 'true')
  }, [onboardingSteps, push])

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

  const maxWeeklySessions = Math.max(1, ...weekTrend.map((item) => item.sessions))
  const weeklyGoalPercent = Math.min(
    100,
    Math.round((weeklyGoal.completed / Math.max(1, weeklyGoal.target)) * 100)
  )
  const remainingWeeklySessions = Math.max(0, weeklyGoal.target - weeklyGoal.completed)
  const maxConsistencyWeek = Math.max(1, ...consistency.weeks)
  const recoveryBadgeClass =
    recovery.score >= 80
      ? 'bg-emerald-100 text-emerald-700'
      : recovery.score >= 60
      ? 'bg-amber-100 text-amber-700'
      : 'bg-rose-100 text-rose-700'
  const quickSummary =
    remainingWeeklySessions === 0
      ? 'Objectif hebdo atteint. Tu peux consolider avec une séance légère ou mobilité.'
      : consistency.score >= 80 && recovery.score >= 80
      ? 'Très bonne dynamique: garde ce rythme et priorise la qualité d’exécution.'
      : recovery.score < 60
      ? 'Charge élevée détectée: privilégie une reprise progressive et une récupération active.'
      : `Il reste ${remainingWeeklySessions} séance(s) pour atteindre ton objectif hebdomadaire.`
  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })

  const primarySessionHref = resumeSessionHref || '/dashboard?view=session'
  const primarySessionLabel = resumeSessionHref ? 'Reprendre la séance' : 'Démarrer une séance'
  const todayActionTitle = resumeSessionHref
    ? 'Séance active'
    : focus
    ? `${focus.title} · ${focus.subtitle}`
    : 'Ton prochain entraînement'
  const todayActionBody = resumeSessionHref
    ? 'Continue exactement là où tu t’es arrêté.'
    : focus
    ? `${focus.duration || 30} min prévues. ${quickSummary}`
    : quickSummary
  const onboardingStepLabels = ['Objectif', 'Niveau', 'Matériel', 'Fréquence']
  const historyDates = items.map((item) => item.date)
  const challenge7 = challengeProgress(historyDates, 7)
  const challenge14 = challengeProgress(historyDates, 14)
  const challenge30 = challengeProgress(historyDates, 30)

  const handleShareProgress = async () => {
    const text = `FitPulse: ${globalStats.streak}j de streak, ${globalStats.totalWorkouts} séances, ${globalStats.totalMinutes} min. Je garde le rythme cette semaine 💪`
    trackEvent('social_share_progress_click', {
      streak: globalStats.streak,
      workouts: globalStats.totalWorkouts,
      minutes: globalStats.totalMinutes,
    })
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma progression FitPulse',
          text,
        })
        return
      } catch {
        // fallback below
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      push('Texte social copié.', 'success')
    } catch {
      push(text, 'info')
    }
  }

  return (
    <div className="page-wrap">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">{todayLabel} · {monthly.headline} · {monthly.monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {resumeSessionHref && (
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">En cours</span>
          )}
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1">
            <span className="text-gray-700 font-semibold">Objectif</span>
            <span className="text-gray-600">{Math.min(weeklyGoal.completed, weeklyGoal.target)}/{weeklyGoal.target}</span>
            <div className="h-1.5 w-16 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full bg-emerald-600" style={{ width: `${weeklyGoalPercent}%` }} />
            </div>
          </div>
          <span>Dernière mise à jour automatique</span>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <a href="#resume-jour" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Résumé
        </a>
        <a href="#kpis" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Indicateurs
        </a>
        <a href="#tendance" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Tendance
        </a>
        <a href="#progression-exos" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Progression
        </a>
        <a href="#seances-recentes" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Dernières séances
        </a>
        <Link href="/notifications" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Notifications
        </Link>
        <Link href="/ops/health" className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50">
          Santé produit
        </Link>
        <a
          href={`/api/calendar/plan?sessions=${weeklyGoal.target}`}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Export calendrier
        </a>
        <button
          type="button"
          onClick={handleShareProgress}
          className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
        >
          Partager progression
        </button>
      </div>
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Défis actifs</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: 'Challenge 7 jours', data: challenge7 },
            { label: 'Challenge 14 jours', data: challenge14 },
            { label: 'Challenge 30 jours', data: challenge30 },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-100 p-3">
              <div className="text-sm font-semibold text-gray-900">{item.label}</div>
              <div className="mt-1 text-xs text-gray-500">{item.data.done}/{item.data.target} séances</div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-primary-600" style={{ width: `${item.data.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div id="resume-jour" className="mb-8 grid gap-4 lg:grid-cols-[1.45fr_0.95fr] scroll-mt-6">
        <div className="rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-white to-emerald-50 px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-700">
                <Sparkles className="h-3.5 w-3.5" />
                Aujourd&apos;hui
              </div>
              <div className="mt-3 text-2xl font-semibold text-gray-900">{todayActionTitle}</div>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">{todayActionBody}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${recoveryBadgeClass}`}>
              Récupération: {recovery.status}
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white bg-white/80 p-4">
              <div className="text-xs text-gray-500">Objectif hebdo</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{weeklyGoal.completed}/{weeklyGoal.target}</div>
            </div>
            <div className="rounded-2xl border border-white bg-white/80 p-4">
              <div className="text-xs text-gray-500">Durée estimée</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{focus?.duration || 30} min</div>
            </div>
            <div className="rounded-2xl border border-white bg-white/80 p-4">
              <div className="text-xs text-gray-500">Streak actuel</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">{globalStats.streak} jour(s)</div>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href={primarySessionHref} className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
              <Play className="h-4 w-4" />
              {primarySessionLabel}
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/programmes" className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
              <Activity className="h-4 w-4" />
              Voir le parcours conseillé
            </Link>
            <Link href="/profil?view=history" className="btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm">
              <Calendar className="h-4 w-4" />
              Voir l’historique
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white px-5 py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Priorités</div>
          <div className="mt-4 space-y-3">
            {onboardingSteps.slice(0, 3).map((step) => (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                  step.done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <span>{step.label}</span>
                <span className="font-semibold">{step.done ? 'OK' : step.cta}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {quickSummary}
          </div>
        </div>
      </div>
      {quickStart && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick start</div>
          <div className="mt-1 text-base font-semibold text-gray-900">{quickStart.title}</div>
          <div className="mt-1 text-sm text-gray-600">{quickStart.body}</div>
          <Link href={quickStart.href} className="mt-3 inline-flex btn-primary">
            {quickStart.cta}
          </Link>
        </div>
      )}
      {reminderCard && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Rappel</div>
          <div className="mt-1 text-base font-semibold text-emerald-900">{reminderCard.title}</div>
          <div className="mt-1 text-sm text-emerald-800">{reminderCard.body}</div>
          <Link href={reminderCard.href} className="mt-3 inline-flex btn-secondary">
            {reminderCard.cta}
          </Link>
        </div>
      )}
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

      {nextAction && (
        <div className="mb-8 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Prochaine action</div>
          <div className="mt-1 text-base font-semibold text-primary-900">{nextAction.title}</div>
          <div className="mt-1 text-sm text-primary-800">{nextAction.body}</div>
          <Link href={nextAction.href} className="mt-3 inline-flex btn-secondary">
            {nextAction.cta}
          </Link>
        </div>
      )}

      {onboardingSteps.some((step) => !step.done) && (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Onboarding</div>
          <div className="mt-1 text-base font-semibold text-emerald-900">
            Progression: {onboardingSteps.filter((step) => step.done).length}/{onboardingSteps.length}
          </div>
          <div className="mt-3 space-y-2">
            {onboardingSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/80 px-3 py-2 border border-emerald-100">
                <div className={`text-sm ${step.done ? 'text-emerald-800' : 'text-gray-700'}`}>
                  {step.done ? '✓ ' : ''}{step.label}
                </div>
                {!step.done && (
                  <Link href={step.href} className="text-xs font-semibold text-emerald-700 underline underline-offset-2">
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {focus && (
        <div className="mb-8 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white p-5 sm:p-8 shadow-sm reveal">
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

      <div id="kpis" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 reveal reveal-1 scroll-mt-6">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Streak actuel</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.streak} j</div>
            </div>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Séances totales</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.totalWorkouts}</div>
            </div>
            <Activity className="h-5 w-5 text-primary-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Minutes totales</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.totalMinutes}</div>
            </div>
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 reveal reveal-1">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Meilleure streak</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.bestStreak} j</div>
            </div>
            <Trophy className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Moyenne / séance</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.avgDuration} min</div>
            </div>
            <Timer className="h-5 w-5 text-primary-500" />
          </div>
        </div>
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Séances (7j)</div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.weeklySessions}</div>
            </div>
            <Calendar className="h-5 w-5 text-indigo-500" />
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="card-compact mb-8">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Badges</div>
            {nextBadge && (
              <div className="text-xs text-gray-500">
                Prochain : <span className="font-semibold text-gray-700">{nextBadge.label}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span
                key={badge.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  badge.earned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}
                title={badge.detail}
              >
                {badge.label}
              </span>
            ))}
          </div>
          {nextBadge && (
            <div className="mt-3 text-xs text-gray-500">
              {nextBadge.detail}
            </div>
          )}
        </div>
      )}

      <div id="tendance" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 reveal reveal-2 scroll-mt-6">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Tendance 7 jours</div>
            <Activity className="h-5 w-5 text-primary-500" />
          </div>
          <div className="scroll-x-touch">
            <div className="grid min-w-[320px] grid-cols-7 gap-2 items-end h-24">
              {weekTrend.map((day, index) => {
                const barHeight = Math.max(8, Math.round((day.sessions / maxWeeklySessions) * 100))
                return (
                  <div key={`${day.day}-${index}`} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">{day.sessions}</span>
                    <div className="h-20 w-full rounded bg-primary-100 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-primary-600 rounded-t"
                        style={{ height: `${barHeight}%` }}
                        title={`${day.sessions} séance(s), ${day.minutes} min`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase">{day.day.replace('.', '')}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Barres basées sur le nombre de séances par jour.</p>
        </div>

        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Objectif hebdo</div>
            <Target className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {Math.min(weeklyGoal.completed, weeklyGoal.target)} / {weeklyGoal.target} séances
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-emerald-600" style={{ width: `${weeklyGoalPercent}%` }} />
          </div>
          <p className="mt-3 text-sm text-gray-600">
            {remainingWeeklySessions === 0
              ? 'Objectif atteint cette semaine.'
              : `Il reste ${remainingWeeklySessions} séance(s) pour atteindre ton objectif.`}
          </p>
          {remainingWeeklySessions > 0 && weeklyCatchUpDays.length > 0 && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Rattrapage suggéré
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {weeklyCatchUpDays.map((day) => (
                  <span key={day} className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-emerald-800 border border-emerald-100">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div id="progression-exos" className="card-compact mb-8 scroll-mt-6">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Progression par exercice</div>
          <Link href="/dashboard?view=session" className="text-xs font-semibold text-primary-700 underline underline-offset-2">
            Voir en séance
          </Link>
        </div>
        {exerciseProgress.length === 0 ? (
          <div className="mt-3 text-sm text-gray-500">
            Pas assez de données pour analyser la progression.
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={primarySessionHref} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs">
                <Play className="h-4 w-4" />
                {primarySessionLabel}
              </Link>
              <Link href="/programmes" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-xs">
                <Activity className="h-4 w-4" />
                Explorer les programmes
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {exerciseProgress.map((exercise) => (
              <div key={exercise.name} className="rounded-lg border border-gray-200 bg-white px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">{localizeExerciseNameFr(exercise.name)}</div>
                  <div className={`text-xs font-semibold ${exercise.oneRmTrend >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {exercise.oneRmTrend >= 0 ? '+' : ''}{exercise.oneRmTrend}% 1RM
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {exercise.sessions} séance(s) · {exercise.volume} kg volume · régularité 30j: {exercise.regularity30d} j
                </div>
                <div className="mt-1 text-xs text-primary-700 font-semibold">
                  Best 1RM: {exercise.bestOneRm > 0 ? `${exercise.bestOneRm} kg` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 reveal reveal-2">
        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Consistance 4 semaines</div>
            <Calendar className="h-5 w-5 text-primary-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{consistency.score}%</div>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-primary-600" style={{ width: `${consistency.score}%` }} />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {consistency.last28Sessions} séance(s) sur {consistency.targetSessions} prévues (4 semaines)
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 items-end h-20">
            {consistency.weeks.map((value, index) => {
              const height = Math.max(8, Math.round((value / maxConsistencyWeek) * 100))
              return (
                <div key={`c-week-${index}`} className="flex flex-col items-center gap-1">
                  <div className="h-14 w-full rounded bg-primary-100 flex items-end overflow-hidden">
                    <div className="w-full bg-primary-600 rounded-t" style={{ height: `${height}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500">S-{3 - index}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card-compact transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Score récupération</div>
            <Flame className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-gray-900">{recovery.score}/100</div>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${recoveryBadgeClass}`}>
              {recovery.status}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${recovery.score}%` }} />
          </div>
          <p className="mt-3 text-sm text-gray-600">{recovery.hint}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 reveal reveal-1">
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
              <Link href="/profil?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
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
              <Link href="/profil?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
                Historique
              </Link>
            </div>
          )}
        </div>
      </div>
      <div className={`card-compact mb-8 ${!hasProAccess(entitlement) ? 'opacity-75' : ''}`}>
        <div className="text-xs text-gray-500">Comparaison mensuelle</div>
        {hasProAccess(entitlement) ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
            <Link href="/profil?view=history" className="ml-2 font-semibold text-primary-700 underline underline-offset-2">
              Historique
            </Link>
          </div>
        )}
      </div>

      <div id="seances-recentes" className="flex items-center justify-between mb-4 scroll-mt-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Dernières séances</h2>
        <span className="text-xs text-gray-500">Clique pour ouvrir le détail</span>
      </div>
      {items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600">Aucune séance enregistrée.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href={primarySessionHref} className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Play className="h-4 w-4" />
              {primarySessionLabel}
            </Link>
            <Link href="/programmes" className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Activity className="h-4 w-4" />
              Explorer les programmes
            </Link>
          </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.workoutName}</h3>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 sm:gap-0 text-gray-600 text-sm mt-1">
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
                    <div className="sm:ml-4">
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
      {onboardingOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 lg:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Parcours guidé</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  Configure ton plan de départ
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  writeOnboardingState({ dismissed: true, answers: onboardingAnswers })
                  setOnboardingOpen(false)
                }}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
              >
                Plus tard
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {onboardingStepLabels.map((label, index) => (
                <div key={label} className="flex-1">
                  <div className={`h-2 rounded-full ${index <= onboardingStep ? 'bg-primary-600' : 'bg-gray-200'}`} />
                  <div className="mt-1 text-[11px] text-gray-500">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              {onboardingStep === 0 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Quel est ton objectif principal ?</div>
                  {['Perte de poids', 'Prise de masse', 'Force', 'Remise en forme'].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setOnboardingAnswers((prev) => ({ ...prev, goal }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                        onboardingAnswers.goal === goal ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Quel est ton niveau actuel ?</div>
                  {[
                    ['debutant', 'Débutant'],
                    ['intermediaire', 'Intermédiaire'],
                    ['avance', 'Avancé'],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setOnboardingAnswers((prev) => ({ ...prev, level: value }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                        onboardingAnswers.level === value ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Quel matériel as-tu vraiment ?</div>
                  {['Poids du corps', 'Haltères', 'Barres', 'Machines'].map((value) => {
                    const active = onboardingAnswers.equipment.includes(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setOnboardingAnswers((prev) => ({
                            ...prev,
                            equipment: active
                              ? prev.equipment.filter((item) => item !== value)
                              : [...prev.equipment, value],
                          }))
                        }
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                          active ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-gray-200 text-gray-700'
                        }`}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
              )}
              {onboardingStep === 3 && (
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Combien de séances peux-tu tenir chaque semaine ?</div>
                  {[2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setOnboardingAnswers((prev) => ({ ...prev, sessionsPerWeek: count }))}
                      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm ${
                        onboardingAnswers.sessionsPerWeek === count ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      {count} séance(s) par semaine
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={onboardingStep === 0}
                onClick={() => setOnboardingStep((prev) => Math.max(prev - 1, 0))}
                className="btn-secondary disabled:opacity-50"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onboardingStep < 3) {
                    writeOnboardingState({ answers: onboardingAnswers, dismissed: false })
                    setOnboardingStep((prev) => prev + 1)
                    return
                  }
                  applyOnboardingAnswers({
                    ...onboardingAnswers,
                    equipment: onboardingAnswers.equipment.length > 0 ? onboardingAnswers.equipment : ['Poids du corps'],
                  })
                  setOnboardingOpen(false)
                  setOnboardingStep(0)
                  push('Profil configuré. Recommandation mise à jour.', 'success')
                }}
                className="btn-primary"
              >
                {onboardingStep === 3 ? 'Créer mon plan' : 'Continuer'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="md:hidden">
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
          <Link
            href={quickStart?.href || primarySessionHref}
            className="btn-primary w-full justify-center"
          >
            <Play className="h-4 w-4" />
            {quickStart?.cta || primarySessionLabel}
          </Link>
          <Link href="/dashboard" className="btn-secondary w-full text-center">
            Accéder au dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
