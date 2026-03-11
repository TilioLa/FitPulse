'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Clock, Flame, Trophy, Dumbbell, ChevronDown, ChevronUp, Info } from 'lucide-react'
import TrainingModeView from '@/components/dashboard/TrainingModeView'
import { useToast } from '@/components/ui/ToastProvider'
import DashboardCalendar from '@/components/dashboard/Calendar'
import EquipmentBadge from '@/components/exercises/EquipmentBadge'
import SupersetToggle from '@/components/exercises/SupersetToggle'
import { computeHistoryStats, WorkoutHistoryItem, toLocalDateKey } from '@/lib/history'
import { programs as allPrograms } from '@/data/programs'
import { inferMuscles, muscleLabel } from '@/lib/muscles'
import { useRouter } from 'next/navigation'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { persistHistoryForUser, readLocalHistory, writeLocalHistory } from '@/lib/history-store'
import {
  markProgressDirty,
  persistCurrentWorkoutForUser,
  readLocalCurrentWorkout,
  readLocalSettings,
  writeLocalCurrentWorkout,
} from '@/lib/user-state-store'
import { applyHistoryLimit, getEntitlement, hasProAccess } from '@/lib/subscription'
import { encodeSharedSession } from '@/lib/session-share'
import { slugify } from '@/lib/slug'

const playBeep = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.value = 0.08
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    setTimeout(() => {
      osc.stop()
      ctx.close().catch(() => {})
    }, 180)
  } catch {
    // ignore
  }
}

const speak = (text: string) => {
  try {
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = navigator.language || 'fr-FR'
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore
  }
}

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  rest: number // en secondes
}

type SetInput = { weight: number; reps: number; completed?: boolean }
type ExerciseInputs = Record<string, SetInput[]>

interface Workout {
  id: string
  name: string
  duration: number // en minutes
  exercises: Exercise[]
  programId?: string
  programName?: string
  equipment?: string
  status?: 'default' | 'in_progress' | 'completed'
  startedAt?: string
  completedAt?: string
  draft?: {
    exerciseInputs?: ExerciseInputs
    exerciseNotes?: Record<string, string>
    currentExerciseIndex?: number
    timeRemaining?: number
    timerKind?: 'set' | 'exercise' | null
    sessionPaused?: boolean
    checkIn?: SessionCheckIn
    savedAt?: string
  }
}

type SessionHint = {
  tone: 'amber' | 'blue' | 'emerald'
  title: string
  body: string
}

type SessionCheckIn = {
  fatigue: number
  sleep: number
  pain: number
  completed: boolean
  adjusted: boolean
  recommendation: string
}

type LastCompletedSet = {
  exerciseId: string
  exerciseName: string
  setIndex: number
}

type CheckInRecommendation = {
  title: string
  body: string
  tone: 'amber' | 'blue' | 'emerald'
  setDelta: -1 | 0 | 1
  restDelta: number
}

const lastExerciseKey = (workoutId: string) => `fitpulse_last_exercise_index_${workoutId}`

const clampPositiveInt = (value: number, fallback = 1) => {
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.round(value))
}

const buildInputsForExercises = (exercises: Exercise[], source?: ExerciseInputs): ExerciseInputs => {
  const inputs: ExerciseInputs = {}
  exercises.forEach((exercise) => {
    const existingRows = source?.[exercise.id] || []
    const targetSets = clampPositiveInt(exercise.sets, 1)
    const targetReps = clampPositiveInt(exercise.reps, 1)
    inputs[exercise.id] = Array.from({ length: targetSets }).map((_, idx) => {
      const row = existingRows[idx]
      const rowReps = Number(row?.reps)
      return {
        weight: row?.weight ?? 0,
        reps: Number.isFinite(rowReps) && rowReps > 0 ? rowReps : targetReps,
        completed: row?.completed ?? false,
      }
    })
  })
  return inputs
}

const getRepsLabel = (sets: SetInput[] | undefined, fallback: number) => {
  const safeFallback = clampPositiveInt(fallback, 1)
  const repsValues = (sets || [])
    .map((set) => Number(set.reps))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (repsValues.length === 0) return `${safeFallback}`
  const min = Math.min(...repsValues)
  const max = Math.max(...repsValues)
  if (min === max) return `${min}`
  return `${min}-${max}`
}

const defaultSessionCheckIn = (): SessionCheckIn => ({
  fatigue: 3,
  sleep: 3,
  pain: 2,
  completed: false,
  adjusted: false,
  recommendation: '',
})

const getCheckInRecommendation = (checkIn: SessionCheckIn): CheckInRecommendation => {
  const needsRecovery = checkIn.fatigue >= 4 || checkIn.pain >= 4 || checkIn.sleep <= 2
  if (needsRecovery) {
    return {
      title: 'Séance allégée recommandée',
      body: 'Réduis d’1 série par exercice et allonge le repos de 15s pour maintenir la qualité.',
      tone: 'amber',
      setDelta: -1,
      restDelta: 15,
    }
  }
  const canPush = checkIn.fatigue <= 2 && checkIn.pain <= 2 && checkIn.sleep >= 4
  if (canPush) {
    return {
      title: 'Journée forte: progression possible',
      body: 'Ajoute 1 série sur les 2 premiers exercices et raccourcis le repos de 10s.',
      tone: 'emerald',
      setDelta: 1,
      restDelta: -10,
    }
  }
  return {
    title: 'Charge standard conseillée',
    body: 'Garde la structure prévue et concentre-toi sur la technique propre.',
    tone: 'blue',
    setDelta: 0,
    restDelta: 0,
  }
}

export default function MySessions() {
  const { push } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [equipment, setEquipment] = useState<string>('Poids du corps')
  const [isRunning, setIsRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // en secondes
  const [streak, setStreak] = useState(0)
  const [completedWorkouts, setCompletedWorkouts] = useState(0)
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number | null>(null)
  const [programTotalSessions, setProgramTotalSessions] = useState<number | null>(null)
  const [programCompletedSessions, setProgramCompletedSessions] = useState<number | null>(null)
  const [restOverride, setRestOverride] = useState<number | null>(null)
  const [exerciseRestOverride, setExerciseRestOverride] = useState<number | null>(null)
  const [autoRestAfterSet, setAutoRestAfterSet] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [timerKind, setTimerKind] = useState<'set' | 'exercise' | null>(null)
  const [sessionPaused, setSessionPaused] = useState(false)
  const [supersetMap, setSupersetMap] = useState<Record<string, string>>({})
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInputs>({})
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [savedNoteExerciseId, setSavedNoteExerciseId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [hasPendingCloudSync, setHasPendingCloudSync] = useState(false)
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [setPulse, setSetPulse] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [lastSummary, setLastSummary] = useState<{
    calories: number
    volume: number
    duration: number
    muscleUsage: { id: string; percent: number }[]
    bestPrKg: number
  } | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(true)
  const [editWorkout, setEditWorkout] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [trainingMode, setTrainingMode] = useState(false)
  const [sessionHint, setSessionHint] = useState<SessionHint | null>(null)
  const [sessionCheckIn, setSessionCheckIn] = useState<SessionCheckIn>(() => defaultSessionCheckIn())
  const [lastCompletedSet, setLastCompletedSet] = useState<LastCompletedSet | null>(null)
  const timerRef = useRef<HTMLDivElement | null>(null)
  const exerciseTopRef = useRef<HTMLDivElement | null>(null)
  const lastCloudPersistRef = useRef(0)
  const wasOnlineRef = useRef(true)
  const reconnectSyncInFlightRef = useRef(false)

  const buildWorkoutSnapshot = (base: Workout, pausedOverride?: boolean) => ({
    ...base,
    draft: {
      exerciseInputs,
      exerciseNotes,
      currentExerciseIndex,
      timeRemaining,
      timerKind,
      sessionPaused: pausedOverride ?? sessionPaused,
      checkIn: sessionCheckIn,
      savedAt: new Date().toISOString(),
    },
  })

  const saveSnapshotNow = (base?: Workout | null, pausedOverride?: boolean) => {
    const source = base || workout
    if (!source) return
    setSaveState('saving')
    const snapshot = buildWorkoutSnapshot(source, pausedOverride)
    writeLocalCurrentWorkout(snapshot as unknown as Record<string, unknown>)
    if (!isOnline) {
      setHasPendingCloudSync(true)
    } else if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, snapshot as unknown as Record<string, unknown>)
      setHasPendingCloudSync(false)
    }
    setSaveState('saved')
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    setTimeout(() => setSaveState((prev) => (prev === 'saved' ? 'idle' : prev)), 1200)
  }

  const syncNow = () => {
    if (!isOnline) return
    saveSnapshotNow()
    setHasPendingCloudSync(false)
    push('Synchronisation lancée.', 'success')
  }

  useEffect(() => {
    // Charger la séance du jour
    const storedWorkout = readLocalCurrentWorkout()
    if (storedWorkout) {
      const parsed = storedWorkout as unknown as Workout
      setWorkout(parsed)
      const parsedDraft = parsed?.draft
      if (parsed?.exercises?.length) {
        const inputs = buildInputsForExercises(parsed.exercises, parsedDraft?.exerciseInputs)
        setExerciseInputs(inputs)
      }
      if (parsedDraft?.exerciseNotes) {
        setExerciseNotes(parsedDraft.exerciseNotes)
      }
      setSessionCheckIn(parsedDraft?.checkIn || defaultSessionCheckIn())
      const draftIndex = Number(parsedDraft?.currentExerciseIndex)
      if (Number.isInteger(draftIndex)) {
        const nextIndex = Math.max(0, Math.min(draftIndex, Math.max((parsed.exercises?.length || 1) - 1, 0)))
        setCurrentExerciseIndex(nextIndex)
      } else if (parsed?.id) {
        const savedIndex = Number(localStorage.getItem(lastExerciseKey(parsed.id)) || 0)
        if (Number.isInteger(savedIndex)) {
          const nextIndex = Math.max(0, Math.min(savedIndex, Math.max((parsed.exercises?.length || 1) - 1, 0)))
          setCurrentExerciseIndex(nextIndex)
        }
      }
      const draftTimeRemaining = Number(parsedDraft?.timeRemaining)
      if (Number.isFinite(draftTimeRemaining) && draftTimeRemaining > 0) {
        setTimeRemaining(draftTimeRemaining)
      }
      if (parsedDraft?.timerKind === 'set' || parsedDraft?.timerKind === 'exercise') {
        setTimerKind(parsedDraft.timerKind)
      }
      setSessionPaused(!!parsedDraft?.sessionPaused)
      if (parsed?.equipment) setEquipment(parsed.equipment)
      if (parsed?.programId) {
        const program = allPrograms.find((item) => item.id === parsed.programId)
        if (program) {
          setProgramTotalSessions(program.sessions.length)
          const scheduleKey = `fitpulse_sessions_per_week_${program.id}`
          const savedSchedule = localStorage.getItem(scheduleKey)
          const scheduleValue = Number(savedSchedule)
          setSessionsPerWeek(
            Number.isFinite(scheduleValue) && scheduleValue >= 1 && scheduleValue <= 7
              ? scheduleValue
              : program.sessionsPerWeek
          )
        }
      }
    } else {
      // Séance par défaut
      const defaultWorkout: Workout & { equipment?: string } = {
        id: '1',
        name: 'Séance du jour - Poids du corps',
        duration: 35,
        equipment: 'Poids du corps',
        status: 'default',
        exercises: [
          { id: '1', name: 'Pompes', sets: 3, reps: 10, rest: 60 },
          { id: '2', name: 'Squats', sets: 3, reps: 12, rest: 60 },
          { id: '3', name: 'Fentes', sets: 3, reps: 10, rest: 60 },
          { id: '4', name: 'Planche', sets: 3, reps: 30, rest: 45 },
          { id: '5', name: 'Planche', sets: 3, reps: 45, rest: 45 },
        ],
      }
      setWorkout(defaultWorkout)
      writeLocalCurrentWorkout(defaultWorkout as unknown as Record<string, unknown>)
      setExerciseInputs(buildInputsForExercises(defaultWorkout.exercises))
      setSessionCheckIn(defaultSessionCheckIn())
    }

    // Charger les statistiques depuis l'historique
    const history = readLocalHistory()
    const { streak, totalWorkouts } = computeHistoryStats(history as WorkoutHistoryItem[])
    setStreak(streak)
    setCompletedWorkouts(totalWorkouts)
    try {
      const sortedHistory = [...(history as WorkoutHistoryItem[])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      const lastSessionTs = sortedHistory[0] ? new Date(sortedHistory[0].date).getTime() : null
      const daysSinceLast =
        lastSessionTs != null
          ? Math.floor((Date.now() - lastSessionTs) / (24 * 60 * 60 * 1000))
          : null

      const nowTs = Date.now()
      const dayMs = 24 * 60 * 60 * 1000
      const currentWindowStart = nowTs - 7 * dayMs
      const previousWindowStart = nowTs - 14 * dayMs
      const previousWindowEnd = currentWindowStart
      const currentLoad = (history as any[])
        .filter((item) => {
          const ts = new Date(item.date).getTime()
          return ts >= currentWindowStart && ts <= nowTs
        })
        .reduce((sum, item) => sum + (Number(item.volume) || 0), 0)
      const previousLoad = (history as any[])
        .filter((item) => {
          const ts = new Date(item.date).getTime()
          return ts >= previousWindowStart && ts < previousWindowEnd
        })
        .reduce((sum, item) => sum + (Number(item.volume) || 0), 0)
      const loadDelta = previousLoad > 0 ? Math.round(((currentLoad - previousLoad) / previousLoad) * 100) : 0

      if (daysSinceLast != null && daysSinceLast >= 5) {
        setSessionHint({
          tone: 'amber',
          title: 'Reprise progressive recommandée',
          body: `Dernière séance il y a ${daysSinceLast} jour(s). Commence à 70-80% de ton intensité habituelle.`,
        })
      } else if (loadDelta >= 20) {
        setSessionHint({
          tone: 'blue',
          title: 'Charge en forte hausse',
          body: `+${loadDelta}% cette semaine. Réduis le volume de 20-30% aujourd’hui pour mieux récupérer.`,
        })
      } else if (streak >= 3) {
        setSessionHint({
          tone: 'emerald',
          title: 'Rythme solide',
          body: 'Tu es régulier. Garde la technique propre et monte la charge progressivement.',
        })
      } else {
        setSessionHint(null)
      }
    } catch {
      setSessionHint(null)
    }
    if (storedWorkout) {
      const parsed = storedWorkout as unknown as Workout
      if (parsed?.programId) {
        const completedForProgram = (history as WorkoutHistoryItem[]).filter(
          (item: any) => item.programId === parsed.programId
        ).length
        setProgramCompletedSessions(completedForProgram)
      }
    }
  }, [])

  useEffect(() => {
    if (pickerOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [pickerOpen])


  useEffect(() => {
    const syncOnlineStatus = () => setIsOnline(navigator.onLine)
    syncOnlineStatus()
    window.addEventListener('online', syncOnlineStatus)
    window.addEventListener('offline', syncOnlineStatus)
    return () => {
      window.removeEventListener('online', syncOnlineStatus)
      window.removeEventListener('offline', syncOnlineStatus)
    }
  }, [])

  useEffect(() => {
    const justReconnected = wasOnlineRef.current === false && isOnline
    wasOnlineRef.current = isOnline
    if (!justReconnected) return
    if (!hasPendingCloudSync) return
    if (!workout) return
    if (!user?.id) return
    if (reconnectSyncInFlightRef.current) return
    reconnectSyncInFlightRef.current = true
    saveSnapshotNow(workout)
    setHasPendingCloudSync(false)
    setTimeout(() => {
      reconnectSyncInFlightRef.current = false
    }, 500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, hasPendingCloudSync, workout, user?.id])

  useEffect(() => {
    const settings = readLocalSettings()
    const override = Number(settings?.restTime)
    if (Number.isFinite(override) && override > 0) {
      setRestOverride(override)
    }
    const between = Number(settings?.restBetweenExercises)
    if (Number.isFinite(between) && between > 0) {
      setExerciseRestOverride(between)
    }
    setAutoRestAfterSet(settings?.autoRestAfterSet !== false)
    setSoundEnabled(settings?.soundEnabled !== false)
    setVoiceEnabled(settings?.voiceEnabled === true)
    setWeightUnit(settings?.weightUnit === 'lbs' ? 'lbs' : 'kg')
  }, [])

  useEffect(() => {
    const convert = (value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs') => {
      if (!Number.isFinite(value)) return value
      if (from === to) return value
      return from === 'kg' ? value * 2.20462 : value / 2.20462
    }

    const handleSettingsChange = () => {
      const settings = readLocalSettings()
      const nextUnit: 'kg' | 'lbs' = settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'
      const between = Number(settings?.restBetweenExercises)
      if (Number.isFinite(between) && between > 0) {
        setExerciseRestOverride(between)
      }
      setAutoRestAfterSet(settings?.autoRestAfterSet !== false)
      setSoundEnabled(settings?.soundEnabled !== false)
      setVoiceEnabled(settings?.voiceEnabled === true)
      if (nextUnit === weightUnit) return
      setExerciseInputs((prev) => {
        const updated: ExerciseInputs = {}
        Object.entries(prev).forEach(([exerciseId, sets]) => {
          updated[exerciseId] = sets.map((set) => ({
            ...set,
            weight: Number(convert(set.weight, weightUnit, nextUnit).toFixed(2)),
          }))
        })
        return updated
      })
      setWeightUnit(nextUnit)
    }

    window.addEventListener('fitpulse-settings', handleSettingsChange)
    window.addEventListener('storage', handleSettingsChange)
    return () => {
      window.removeEventListener('fitpulse-settings', handleSettingsChange)
      window.removeEventListener('storage', handleSettingsChange)
    }
  }, [weightUnit])

  const workoutId = workout?.id
  useEffect(() => {
    if (!workoutId) return
    try {
      const stored = JSON.parse(localStorage.getItem(`fitpulse_superset_${workoutId}`) || '{}')
      setSupersetMap(stored)
    } catch {
      setSupersetMap({})
    }
  }, [workoutId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (soundEnabled) {
              playBeep()
            }
            if (voiceEnabled) {
              speak(timerKind === 'exercise' ? 'Exercice suivant' : 'Repos terminé')
            }
            if (timerKind === 'exercise') {
              handleNextExercise()
            }
            setTimerKind(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, timeRemaining, timerKind, soundEnabled, voiceEnabled])

  useEffect(() => {
    if (!workout) return

    const timeout = setTimeout(() => {
      setSaveState('saving')
      const snapshot = buildWorkoutSnapshot(workout)
      writeLocalCurrentWorkout(snapshot as unknown as Record<string, unknown>)
      const now = Date.now()
      if (!isOnline) {
        setHasPendingCloudSync(true)
      } else if (user?.id && now - lastCloudPersistRef.current > 10_000) {
        lastCloudPersistRef.current = now
        void persistCurrentWorkoutForUser(user.id, snapshot as unknown as Record<string, unknown>)
        setHasPendingCloudSync(false)
      }
      setSaveState('saved')
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setTimeout(() => setSaveState((prev) => (prev === 'saved' ? 'idle' : prev)), 1200)
    }, 500)

    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, exerciseInputs, exerciseNotes, currentExerciseIndex, timeRemaining, timerKind, sessionPaused, sessionCheckIn, user?.id, isOnline])

  useEffect(() => {
    if (!workout?.id) return
    localStorage.setItem(lastExerciseKey(workout.id), String(currentExerciseIndex))
    markProgressDirty()
  }, [workout?.id, currentExerciseIndex])

  useEffect(() => {
    if (!workout) return
    requestAnimationFrame(() => {
      exerciseTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [currentExerciseIndex, workout])

  useEffect(() => {
    const saveNow = () => {
      saveSnapshotNow(workout)
    }

    const onBeforeUnload = () => saveNow()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveNow()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, exerciseInputs, exerciseNotes, currentExerciseIndex, timeRemaining, timerKind, sessionPaused, sessionCheckIn, user?.id])

  function handleStartTimer(restTime: number, kind: 'set' | 'exercise') {
    if (sessionPaused) return
    setTimerKind(kind)
    setTimeRemaining(restTime)
    setIsRunning(true)
    requestAnimationFrame(() => {
      timerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function handlePauseTimer() {
    setIsRunning(false)
  }

  function handleResetTimer() {
    setTimeRemaining(0)
    setIsRunning(false)
    setTimerKind(null)
  }

  function handleSkipTimer() {
    handleResetTimer()
  }

  function handleNextExercise() {
    if (sessionPaused) return
    if (workout && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setTimeRemaining(0)
      setIsRunning(false)
      setTimerKind(null)
    }
  }

  function handleCompleteWorkout() {
    if (!workout) return
    if (sessionPaused) {
      push('Reprenez la séance avant de la terminer.', 'info')
      return
    }

    // Ajouter à l'historique (éviter doublons même jour + même séance)
    const history = readLocalHistory()
    const todayKey = toLocalDateKey(new Date())
    const existsSameSessionToday = history.some((item: any) =>
      typeof item.date === 'string' &&
      toLocalDateKey(item.date) === todayKey &&
      (item.workoutId === workout.id || item.workoutName === workout.name)
    )

    const settings = readLocalSettings()
    const weightUnitSetting: 'kg' | 'lbs' = settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'
    const weightKgRaw = Number(settings?.weight || 70)
    const weightKg = weightUnitSetting === 'lbs' ? weightKgRaw / 2.20462 : weightKgRaw
    const met = 6
    const caloriesBurned = Math.round((met * weightKg * (workout.duration / 60)) || 0)

    const sessionVolume = workout.exercises.reduce((sum, exercise) => {
      const sets = exerciseInputs[exercise.id] || []
      const total = sets.reduce((setSum, set) => setSum + (set.weight || 0) * (set.reps || 0), 0)
      return sum + total
    }, 0)

    const exerciseRecords = workout.exercises.map((exercise) => {
      const sets = exerciseInputs[exercise.id] || []
      const bestOneRm = sets.reduce((max, set) => Math.max(max, estimateOneRm(set.weight, set.reps)), 0)
      const bestWeight = sets.reduce((max, set) => Math.max(max, set.weight || 0), 0)
      return {
        id: exercise.id,
        name: exercise.name,
        bestOneRm,
        bestWeight,
      }
    })

    const muscleTotals = workout.exercises.reduce((acc, exercise) => {
      const muscles = inferMuscles(exercise.name)
      muscles.forEach((muscle) => {
        acc[muscle.id] = (acc[muscle.id] || 0) + muscle.intensity * exercise.sets
      })
      return acc
    }, {} as Record<string, number>)
    const muscleTotalValue = Object.values(muscleTotals).reduce((sum, value) => sum + value, 0) || 1
    const muscleUsage = (() => {
      const entries = Object.entries(muscleTotals).map(([id, value]) => {
        const raw = (value / muscleTotalValue) * 100
        return { id, raw, floor: Math.floor(raw), frac: raw - Math.floor(raw) }
      })
      let remainder = 100 - entries.reduce((sum, item) => sum + item.floor, 0)
      entries.sort((a, b) => b.frac - a.frac)
      const withRemainder = entries.map((item, idx) => ({
        id: item.id,
        percent: item.floor + (idx < remainder ? 1 : 0),
      }))
      return withRemainder
    })()

    if (!existsSameSessionToday) {
      history.push({
        id: `${workout.id}-${todayKey}-${history.length + 1}`,
        workoutId: workout.id,
        workoutName: workout.name,
        programId: workout.programId,
        programName: workout.programName,
        date: new Date().toISOString(),
        duration: workout.duration,
        calories: caloriesBurned,
        volume: Math.round(sessionVolume),
        records: exerciseRecords,
        muscleUsage,
        exercises: workout.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          notes: exerciseNotes[exercise.id] || '',
          sets: exerciseInputs[exercise.id] || [],
        })),
      })
      const cappedHistory = applyHistoryLimit(history as WorkoutHistoryItem[], getEntitlement())
      writeLocalHistory(cappedHistory)
      if (user?.id) {
        void persistHistoryForUser(user.id, cappedHistory as WorkoutHistoryItem[])
      }
      if (!hasProAccess(getEntitlement()) && history.length > cappedHistory.length) {
        push('Plan gratuit: historique limité aux 10 dernières séances.', 'info')
      }
    }

    // Réinitialiser
    const finalHistory = applyHistoryLimit(history as WorkoutHistoryItem[], getEntitlement())
    const { streak, totalWorkouts } = computeHistoryStats(finalHistory)
    setStreak(streak)
    setCompletedWorkouts(totalWorkouts)
    if (workout.programId) {
      const completedForProgram = finalHistory.filter(
        (item: any) => item.programId === workout.programId
      ).length
      setProgramCompletedSessions(completedForProgram)
    }
    setCurrentExerciseIndex(0)
    setTimeRemaining(0)
    setIsRunning(false)
    setSessionPaused(false)
    setLastCompletedSet(null)
    if (workout) {
      writeLocalCurrentWorkout(null)
      if (user?.id) {
        void persistCurrentWorkoutForUser(user.id, null)
      }
    }
    setLastSummary({
      calories: caloriesBurned,
      volume: Math.round(sessionVolume),
      duration: workout.duration,
      muscleUsage,
      bestPrKg: Math.round(Math.max(...exerciseRecords.map((item) => item.bestOneRm || 0), 0)),
    })
    setShowSummary(true)
    push(`Séance terminée !`, 'success')
  }

  const handlePauseSession = () => {
    if (sessionPaused) return
    setSessionPaused(true)
    setIsRunning(false)
    saveSnapshotNow(undefined, true)
    push('Séance mise en pause.', 'info')
  }

  const handleResumeSession = () => {
    if (!sessionPaused) return
    setSessionPaused(false)
    saveSnapshotNow(undefined, false)
    push('Séance reprise.', 'success')
  }

  const handleCancelWorkout = () => {
    if (!workout) return
    const confirmed = window.confirm('Annuler la séance en cours ? La progression non terminée sera perdue.')
    if (!confirmed) return
    setIsRunning(false)
    setTimeRemaining(0)
    setTimerKind(null)
    setSessionPaused(false)
    setCurrentExerciseIndex(0)
    setLastCompletedSet(null)
    writeLocalCurrentWorkout(null)
    if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, null)
    }
    push('Séance annulée.', 'info')
    router.push('/dashboard?view=feed')
  }

  const updateWorkoutExercises = (
    nextExercises: Exercise[],
    options?: {
      resetRepsForExerciseId?: string
    }
  ) => {
    if (!workout) return
    const updated = { ...workout, exercises: nextExercises }
    setWorkout(updated)
    writeLocalCurrentWorkout(updated as unknown as Record<string, unknown>)
    if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, updated as unknown as Record<string, unknown>)
    }
    setExerciseInputs((prev) => {
      const next = buildInputsForExercises(nextExercises, prev)
      const exerciseId = options?.resetRepsForExerciseId
      if (!exerciseId) return next
      const matchingExercise = nextExercises.find((exercise) => exercise.id === exerciseId)
      if (!matchingExercise) return next
      return {
        ...next,
        [exerciseId]: (next[exerciseId] || []).map((row) => ({
          ...row,
          reps: clampPositiveInt(matchingExercise.reps, 1),
        })),
      }
    })
  }

  const updateCurrentExerciseSetCount = (nextSetCount: number) => {
    if (!workout) return
    const current = workout.exercises[currentExerciseIndex]
    if (!current) return
    const safeSetCount = clampPositiveInt(nextSetCount, 1)
    const nextExercises = [...workout.exercises]
    nextExercises[currentExerciseIndex] = {
      ...current,
      sets: safeSetCount,
    }
    updateWorkoutExercises(nextExercises)
  }

  const applyCheckInAdjustments = () => {
    if (!workout) return
    const recommendation = getCheckInRecommendation(sessionCheckIn)
    const nextExercises = workout.exercises.map((exercise, index) => {
      const nextSets =
        recommendation.setDelta === 0
          ? exercise.sets
          : recommendation.setDelta > 0
          ? index < 2
            ? Math.min(6, exercise.sets + 1)
            : exercise.sets
          : Math.max(1, exercise.sets - 1)
      return {
        ...exercise,
        sets: nextSets,
        rest: Math.max(20, exercise.rest + recommendation.restDelta),
      }
    })
    if (recommendation.setDelta !== 0 || recommendation.restDelta !== 0) {
      updateWorkoutExercises(nextExercises)
    }
    setSessionCheckIn((prev) => ({
      ...prev,
      completed: true,
      adjusted: recommendation.setDelta !== 0 || recommendation.restDelta !== 0,
      recommendation: recommendation.title,
    }))
    push(`Check-in appliqué: ${recommendation.title}`, 'success')
  }

  const skipCheckIn = () => {
    setSessionCheckIn((prev) => ({
      ...prev,
      completed: true,
      adjusted: false,
      recommendation: 'Ajustement ignoré',
    }))
    push('Check-in enregistré sans ajustement.', 'info')
  }

  const undoLastCompletedSet = () => {
    if (!lastCompletedSet) return
    let reverted = false
    setExerciseInputs((prev) => {
      const rows = prev[lastCompletedSet.exerciseId] || []
      const nextRows = rows.map((row, idx) => {
        if (idx !== lastCompletedSet.setIndex || !row.completed) return row
        reverted = true
        return { ...row, completed: false }
      })
      return {
        ...prev,
        [lastCompletedSet.exerciseId]: nextRows,
      }
    })
    if (reverted) {
      push(
        `Série ${lastCompletedSet.setIndex + 1} annulée (${lastCompletedSet.exerciseName}).`,
        'info'
      )
    }
    setLastCompletedSet(null)
  }

  const replaceExerciseAt = (index: number, name: string) => {
    if (!workout) return
    const next = [...workout.exercises]
    const existing = next[index]
    if (!existing) return
    next[index] = {
      ...existing,
      name,
      sets: existing.sets || 3,
      reps: existing.reps || 10,
      rest: existing.rest || 60,
    }
    updateWorkoutExercises(next)
  }

  const addExercise = (name: string) => {
    if (!workout) return
    const next = [
      ...workout.exercises,
      {
        id: `${workout.id}-${Date.now()}`,
        name,
        sets: 3,
        reps: 10,
        rest: 60,
      },
    ]
    updateWorkoutExercises(next)
  }

  const removeExerciseAt = (index: number) => {
    if (!workout) return
    const next = workout.exercises.filter((_, idx) => idx !== index)
    updateWorkoutExercises(next)
    if (currentExerciseIndex >= next.length) {
      setCurrentExerciseIndex(Math.max(next.length - 1, 0))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const estimateOneRm = (weight: number, reps: number) => {
    if (weight <= 0 || reps <= 0) return 0
    return Math.round(weight * (1 + reps / 30))
  }

  const formatWeight = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '—'
    return `${value} ${weightUnit}`
  }

  const buildShareUrl = () => {
    if (!workout || !lastSummary) return null
    const authorName = user?.name || 'Utilisateur FitPulse'
    const authorSlug = user?.id
      ? `${slugify(authorName) || 'athlete'}-${user.id.slice(0, 6)}`
      : slugify(authorName) || 'athlete'
    const token = encodeSharedSession({
      workoutName: workout.name,
      author: authorName,
      authorSlug,
      date: new Date().toISOString(),
      duration: lastSummary.duration,
      volume: lastSummary.volume,
      calories: lastSummary.calories,
      muscleUsage: lastSummary.muscleUsage,
      bestPrKg: lastSummary.bestPrKg,
    })
    const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    return `${base}/share?s=${token}`
  }

  useEffect(() => {
    if (!showSummary || !lastSummary) {
      setShareUrl(null)
      return
    }
    setShareUrl(buildShareUrl())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSummary, lastSummary, workout, user])

  const handleShareSession = async () => {
    if (!workout || !lastSummary) {
      push('Impossible de générer le lien pour le moment.', 'error')
      return
    }

    const authorName = user?.name || 'Utilisateur FitPulse'
    const authorSlug = user?.id
      ? `${slugify(authorName) || 'athlete'}-${user.id.slice(0, 6)}`
      : slugify(authorName) || 'athlete'
    const payload = {
      workoutName: workout.name,
      author: authorName,
      authorSlug,
      date: new Date().toISOString(),
      duration: lastSummary.duration,
      volume: lastSummary.volume,
      calories: lastSummary.calories,
      muscleUsage: lastSummary.muscleUsage,
      bestPrKg: lastSummary.bestPrKg,
    }

    let url: string | null = null
    try {
      const response = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: payload }),
      })
      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as { id?: string }
        if (data?.id) {
          const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
          url = `${base}/share?id=${encodeURIComponent(data.id)}`
        }
      }
    } catch {
      // fallback to encoded share link below
    }
    if (!url) {
      url = buildShareUrl()
    }
    if (!url) {
      push('Impossible de générer le lien pour le moment.', 'error')
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ma séance FitPulse',
          text: 'Regarde ma séance FitPulse',
          url,
        })
        return
      } catch {
        // fallback copy below
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      push('Lien de partage copié.', 'success')
    } catch {
      push(url, 'info')
    }
  }

  const downloadSessionShareCard = async () => {
    if (!workout || !lastSummary) {
      push('Aucun résumé disponible pour exporter la carte.', 'error')
      return
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1350
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas-unavailable')

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, '#eff6ff')
      gradient.addColorStop(1, '#ffffff')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = '#1d4ed8'
      ctx.fillRect(64, 64, 952, 80)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 38px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText('FitPulse • Carte de séance', 96, 116)

      ctx.fillStyle = '#111827'
      ctx.font = '700 44px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText(workout.name.slice(0, 34), 64, 220)
      ctx.fillStyle = '#4b5563'
      ctx.font = '500 28px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText(new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }), 64, 264)

      const cards = [
        { label: 'Durée', value: `${lastSummary.duration} min` },
        { label: 'Poids total', value: `${lastSummary.volume} ${weightUnit}` },
        { label: 'Calories', value: `${lastSummary.calories} kcal` },
        { label: 'Best PR', value: `${lastSummary.bestPrKg || 0} ${weightUnit}` },
      ]
      cards.forEach((item, index) => {
        const x = 64 + (index % 2) * 476
        const y = 320 + Math.floor(index / 2) * 150
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(x, y, 440, 120)
        ctx.strokeStyle = '#dbeafe'
        ctx.lineWidth = 2
        ctx.strokeRect(x, y, 440, 120)
        ctx.fillStyle = '#6b7280'
        ctx.font = '600 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
        ctx.fillText(item.label, x + 24, y + 44)
        ctx.fillStyle = '#111827'
        ctx.font = '700 34px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
        ctx.fillText(item.value, x + 24, y + 92)
      })

      ctx.fillStyle = '#111827'
      ctx.font = '700 30px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText('Muscles les plus sollicités', 64, 670)
      const topMuscles = lastSummary.muscleUsage
        .slice()
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3)
      topMuscles.forEach((muscle, index) => {
        const y = 720 + index * 60
        ctx.fillStyle = '#374151'
        ctx.font = '600 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
        ctx.fillText(`${muscleLabel(muscle.id, 'fr')}`, 64, y)
        ctx.fillStyle = '#1d4ed8'
        ctx.fillRect(420, y - 24, Math.max(20, Math.round((muscle.percent / 100) * 520)), 20)
        ctx.fillStyle = '#111827'
        ctx.fillText(`${muscle.percent}%`, 960, y)
      })

      ctx.fillStyle = '#111827'
      ctx.font = '700 30px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText('Exercices clés', 64, 960)
      workout.exercises.slice(0, 5).forEach((exercise, index) => {
        const y = 1010 + index * 56
        const sets = exerciseInputs[exercise.id] || []
        const bestWeight = Math.max(...sets.map((set) => set.weight || 0), 0)
        ctx.fillStyle = '#374151'
        ctx.font = '600 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
        ctx.fillText(`• ${exercise.name}`, 64, y)
        ctx.fillStyle = '#1d4ed8'
        ctx.fillText(`${exercise.sets}x${exercise.reps} • max ${bestWeight}${weightUnit}`, 620, y)
      })

      ctx.fillStyle = '#6b7280'
      ctx.font = '500 22px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
      ctx.fillText('Généré avec FitPulse', 64, 1288)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('blob-failed')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fitpulse-share-${new Date().toISOString().slice(0, 10)}.png`
      link.click()
      URL.revokeObjectURL(url)
      push('Carte de partage exportée en image.', 'success')
    } catch {
      push('Impossible de générer la carte image pour le moment.', 'error')
    }
  }

  const supersetKey = workout ? `fitpulse_superset_${workout.id}` : 'fitpulse_superset'
  const currentExercise = workout ? workout.exercises[currentExerciseIndex] : null
  const currentSupersetGroup = workout
    ? supersetMap[workout.exercises[currentExerciseIndex]?.id]
    : undefined
  const nextExerciseId = workout?.exercises[currentExerciseIndex + 1]?.id
  const isSupersetWithNext =
    !!currentSupersetGroup && nextExerciseId && supersetMap[nextExerciseId] === currentSupersetGroup

  const effectiveRest = useMemo(() => {
    if (!currentExercise) return 0
    const base = restOverride && restOverride > 0 ? restOverride : currentExercise.rest
    return isSupersetWithNext ? 0 : base
  }, [currentExercise, isSupersetWithNext, restOverride])

  const effectiveExerciseRest = useMemo(() => {
    if (isSupersetWithNext) return 0
    return exerciseRestOverride && exerciseRestOverride > 0 ? exerciseRestOverride : 180
  }, [exerciseRestOverride, isSupersetWithNext])

  const currentInputs = currentExercise ? (exerciseInputs[currentExercise.id] || []) : []
  const currentSetCount = currentExercise ? currentInputs.length || clampPositiveInt(currentExercise.sets, 1) : 0
  const currentRepsLabel = currentExercise ? getRepsLabel(currentInputs, currentExercise.reps) : '0'
  const currentVolume = currentInputs.reduce((sum, set) => sum + set.weight * set.reps, 0)
  const currentBestOneRm = currentInputs.reduce((max, set) => Math.max(max, estimateOneRm(set.weight, set.reps)), 0)
  const isLastExercise = workout ? currentExerciseIndex === workout.exercises.length - 1 : false

  function toggleSetCompleted(setIndex: number, checked: boolean) {
    if (!currentExercise) return
    if (sessionPaused) return
    if (!checked) {
      setLastCompletedSet((prev) => {
        if (!prev) return prev
        if (prev.exerciseId !== currentExercise.id || prev.setIndex !== setIndex) return prev
        return null
      })
    }
    setExerciseInputs((prev) => {
      const previousRows = prev[currentExercise.id] || []
      const wasCompleted = !!previousRows[setIndex]?.completed
      const updated = {
        ...prev,
        [currentExercise.id]: (prev[currentExercise.id] || []).map((row, idx) =>
          idx === setIndex ? { ...row, completed: checked } : row
        ),
      }
      if (checked && !wasCompleted) {
        setLastCompletedSet({
          exerciseId: currentExercise.id,
          exerciseName: currentExercise.name,
          setIndex,
        })
      }
      if (!checked) return updated
      const allDone = (updated[currentExercise.id] || []).every((row) => row.completed)
      if (allDone) {
        if (autoRestAfterSet && effectiveExerciseRest > 0) {
          handleStartTimer(effectiveExerciseRest, 'exercise')
        } else if (autoRestAfterSet) {
          setTimeout(() => {
            handleNextExercise()
          }, 100)
        }
      } else if (autoRestAfterSet && effectiveRest > 0) {
        handleStartTimer(effectiveRest, 'set')
      }
      return updated
    })
  }

  function markNextSetCompleted() {
    if (sessionPaused) return
    const nextIndex = currentInputs.findIndex((set) => !set.completed)
    if (nextIndex === -1) {
      if (autoRestAfterSet && effectiveExerciseRest > 0) {
        handleStartTimer(effectiveExerciseRest, 'exercise')
      } else if (autoRestAfterSet) {
        handleNextExercise()
      }
      return
    }
    toggleSetCompleted(nextIndex, true)
    setSetPulse(true)
    setTimeout(() => setSetPulse(false), 180)
    push(`Série ${nextIndex + 1} validée`, 'success')
  }

  useEffect(() => {
    if (!workout || !currentExercise) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key === 'Enter') {
        event.preventDefault()
        markNextSetCompleted()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        if (isLastExercise) {
          handleCompleteWorkout()
        } else {
          handleNextExercise()
        }
      } else if (event.code === 'Space') {
        event.preventDefault()
        if (sessionPaused) return
        if (isRunning) handlePauseTimer()
        else handleStartTimer(effectiveRest, timerKind ?? 'set')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workout, currentExercise, currentInputs, isLastExercise, isRunning, effectiveRest, timerKind, effectiveExerciseRest, sessionPaused])

  if (!workout || !currentExercise) {
    return <div className="text-center text-gray-600">Chargement de la séance...</div>
  }

  if (showSummary && lastSummary) {
    const displayName = user?.name || 'Utilisateur'
    return (
      <div className="page-wrap panel-stack">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div className="card-soft">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowSummary(false)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                ← Retour
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">{workout.name}</h1>
            </div>

            <div className="space-y-3">
              {workout.exercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-gray-200 bg-white flex items-center justify-center">
                      <Dumbbell className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{exercise.name}</div>
                      <div className="text-xs text-gray-500">
                        {exercise.sets} sets · {exercise.reps} reps · Rest {exercise.rest}s
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold">
                    {(displayName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Créé par</div>
                    <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                  </div>
                </div>
                <button className="text-gray-500 hover:text-gray-700" aria-label="More">
                  ⋮
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <button className="btn-primary w-full" onClick={() => setShowSummary(false)}>
                  Retour à la séance
                </button>
                <button className="btn-secondary w-full" onClick={handleShareSession}>
                  Copier le lien
                </button>
                <button className="btn-secondary w-full" onClick={downloadSessionShareCard}>
                  Télécharger la carte image
                </button>
                <button className="btn-secondary w-full" onClick={() => router.push('/dashboard?view=feed')}>
                  Retour au dashboard
                </button>
              </div>
              {shareUrl && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <div className="font-semibold text-gray-700">Lien prêt à partager</div>
                  <div className="mt-1 truncate">{shareUrl}</div>
                  <button
                    className="mt-2 text-xs font-semibold text-primary-700"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl)
                        push('Lien copié.', 'success')
                      } catch {
                        push(shareUrl, 'info')
                      }
                    }}
                  >
                    Copier le lien
                  </button>
                </div>
              )}
            </div>

            <div className="card-soft">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Résumé de la séance</h3>
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-400">Exercices</div>
                  <div className="text-lg font-semibold text-gray-900">{workout.exercises.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Séries totales</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Durée estimée</div>
                  <div className="text-lg font-semibold text-gray-900">{lastSummary.duration} min</div>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                <div>Poids total : <span className="font-semibold text-gray-900">{lastSummary.volume} {weightUnit}</span></div>
                <div>Calories : <span className="font-semibold text-gray-900">{lastSummary.calories} kcal</span></div>
              </div>
            </div>

            <div className="card-soft">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Groupes musculaires</h3>
              <div className="space-y-3">
                {lastSummary.muscleUsage
                  .slice()
                  .sort((a, b) => b.percent - a.percent)
                  .map((muscle) => (
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
          </div>
        </div>
      </div>
    )
  }

  const history = readLocalHistory() as any[]
  const exerciseHistory = history.flatMap((item) =>
    (item.exercises || []).map((ex: any) => ({
      date: item.date,
      ...ex,
    }))
  )
  const selectedExercise =
    workout.exercises.find((exercise) => exercise.id === (selectedExerciseId || '')) || null
  const selectedHistory = selectedExercise
    ? exerciseHistory.filter((ex) => ex.id === selectedExercise.id || ex.name === selectedExercise.name)
    : []
  const historySeries = selectedHistory
    .map((ex) => {
      const best = (ex.sets || []).reduce((max: number, set: SetInput) => {
        return Math.max(max, estimateOneRm(set.weight, set.reps))
      }, 0)
      return { date: ex.date, oneRm: best }
    })
    .filter((point) => point.oneRm > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const volumeSeries = selectedHistory
    .map((ex) => {
      const volume = (ex.sets || []).reduce((sum: number, set: SetInput) => sum + set.weight * set.reps, 0)
      return { date: ex.date, volume }
    })
    .filter((point) => point.volume > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000
  const exerciseRegularity30d = selectedHistory.filter(
    (entry) => new Date(entry.date).getTime() >= thirtyDaysAgo
  ).length

  const previousBestOneRm = selectedExercise
    ? selectedHistory.reduce((max, ex) => {
        const best = (ex.sets || []).reduce((setMax: number, set: SetInput) => {
          return Math.max(setMax, estimateOneRm(set.weight, set.reps))
        }, 0)
        return Math.max(max, best)
      }, 0)
    : 0
  const isPR = currentBestOneRm > 0 && currentBestOneRm > previousBestOneRm

  const remainingSessions =
    programTotalSessions != null && programCompletedSessions != null
      ? Math.max(programTotalSessions - programCompletedSessions, 0)
      : null
  const remainingWeeks =
    remainingSessions != null && sessionsPerWeek
      ? Math.max(1, Math.ceil(remainingSessions / sessionsPerWeek))
      : null
  const checkInRecommendation = getCheckInRecommendation(sessionCheckIn)
  const checkInToneClass =
    checkInRecommendation.tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : checkInRecommendation.tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-blue-200 bg-blue-50 text-blue-900'

  return (
    <div className="page-wrap panel-stack" data-testid="session-root">
      {!showSummary && !trainingMode && (
        <div className="sticky top-0 z-20 -mx-4 px-4 py-2 bg-gray-50/95 backdrop-blur border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
            <span className="truncate pr-2">{currentExercise.name}</span>
            <span>{currentExerciseIndex + 1}/{workout.exercises.length}</span>
          </div>
          <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mb-8 reveal">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">{workout.name}</h1>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
                {currentExerciseIndex + 1}/{workout.exercises.length} exercices
              </div>
              {saveState === 'saving' && (
                <div className="text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                  Sauvegarde...
                </div>
              )}
              {saveState === 'saved' && (
                <div className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  {isOnline ? 'Sauvegardé' : 'Sauvegardé localement'}
                </div>
              )}
            </div>
            {lastSavedAt && (
              <div className="text-[11px] text-gray-500">
                Dernière sauvegarde: {lastSavedAt}
              </div>
            )}
            {!isOnline && (
              <div className="text-[11px] font-semibold text-amber-700">
                Hors ligne: les changements seront synchronisés au retour du réseau.
              </div>
            )}
            {isOnline && hasPendingCloudSync && user?.id && (
              <button
                onClick={syncNow}
                className="text-[11px] font-semibold text-primary-700 underline underline-offset-2"
              >
                Synchroniser maintenant
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span>Durée : {workout.duration} min</span>
          </div>
          <EquipmentBadge equipment={equipment} />
        </div>
          <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800">
            Matériel requis : <span className="font-semibold">{equipment}</span>
          </div>
        {sessionHint && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              sessionHint.tone === 'amber'
                ? 'border border-amber-200 bg-amber-50 text-amber-900'
                : sessionHint.tone === 'blue'
                ? 'border border-blue-200 bg-blue-50 text-blue-900'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            <div className="font-semibold">{sessionHint.title}</div>
            <div className="mt-1">{sessionHint.body}</div>
          </div>
        )}
        <div className={`mt-4 rounded-lg border px-4 py-3 ${checkInToneClass}`} data-testid="session-checkin">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Check-in pré-séance</div>
              <div className="mt-1 text-xs">
                Fatigue, sommeil et douleurs pour adapter automatiquement séries et repos.
              </div>
            </div>
            {sessionCheckIn.completed && (
              <button
                type="button"
                onClick={() => setSessionCheckIn((prev) => ({ ...prev, completed: false }))}
                className="text-xs font-semibold underline underline-offset-2"
              >
                Modifier
              </button>
            )}
          </div>
          {!sessionCheckIn.completed ? (
            <>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {([
                  ['fatigue', 'Fatigue', sessionCheckIn.fatigue],
                  ['sleep', 'Sommeil', sessionCheckIn.sleep],
                  ['pain', 'Douleurs', sessionCheckIn.pain],
                ] as const).map(([field, label, value]) => (
                  <label key={field} className="rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-xs">
                    <div className="mb-1 font-semibold text-gray-700">{label}: {value}/5</div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={value}
                      onChange={(event) => {
                        const nextValue = clampPositiveInt(Number(event.target.value), 1)
                        setSessionCheckIn((prev) => ({
                          ...prev,
                          [field]: Math.min(5, Math.max(1, nextValue)),
                        }))
                      }}
                      className="w-full accent-primary-600"
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-white/60 bg-white/60 px-3 py-2 text-xs">
                <div className="font-semibold">{checkInRecommendation.title}</div>
                <div className="mt-1">{checkInRecommendation.body}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyCheckInAdjustments}
                  className="btn-primary px-4 py-2 text-xs"
                  data-testid="checkin-apply"
                >
                  Appliquer automatiquement
                </button>
                <button
                  type="button"
                  onClick={skipCheckIn}
                  className="btn-secondary px-4 py-2 text-xs"
                  data-testid="checkin-skip"
                >
                  Garder le plan actuel
                </button>
              </div>
            </>
          ) : (
            <div className="mt-2 text-xs">
              {sessionCheckIn.adjusted ? 'Ajustement appliqué' : 'Ajustement ignoré'} · {sessionCheckIn.recommendation || checkInRecommendation.title}
            </div>
          )}
        </div>
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 transition-all"
              style={{ width: `${((currentExerciseIndex + 1) / workout.exercises.length) * 100}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 mt-2">
            Exercice {currentExerciseIndex + 1} sur {workout.exercises.length}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setEditWorkout((prev) => !prev)}
            className="btn-secondary hover:shadow-sm"
          >
            {editWorkout ? 'Fermer la modification' : 'Modifier la séance'}
          </button>
          {editWorkout && (
            <button
              onClick={() => {
                setPickerIndex(workout.exercises.length)
                setPickerOpen(true)
              }}
              className="btn-secondary hover:shadow-sm"
            >
              Ajouter un exercice
            </button>
          )}
          <button
            onClick={() => {
              setTrainingMode((prev) => !prev)
              if (!trainingMode) {
                speak(`Mode entraînement activé pour ${currentExercise.name}`)
              }
            }}
            className="btn-primary px-4 py-2 text-sm"
          >
            {trainingMode ? 'Quitter le mode entraînement' : 'Mode entraînement'}
          </button>
        </div>
        {editWorkout && (
          <div className="mt-4 card-soft border-dashed border-primary-200 bg-primary-50/40 space-y-3">
            {workout.exercises.map((exercise, index) => (
              <div key={exercise.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{exercise.name}</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPickerIndex(index)
                        setPickerOpen(true)
                      }}
                      className="min-h-10 px-3 rounded-lg border border-primary-200 text-xs font-semibold text-primary-700 hover:bg-primary-50"
                    >
                      Remplacer
                    </button>
                    <button
                      onClick={() => removeExerciseAt(index)}
                      className="min-h-10 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                  <label className="flex flex-col gap-1">
                    Séries
                    <input
                      type="number"
                      min={1}
                      value={exercise.sets}
                      onChange={(e) => {
                        const next = [...workout.exercises]
                        next[index] = { ...next[index], sets: Number(e.target.value) || 1 }
                        updateWorkoutExercises(next)
                      }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Répétitions
                    <input
                      type="number"
                      min={1}
                      value={exercise.reps}
                      onChange={(e) => {
                        const next = [...workout.exercises]
                        next[index] = { ...next[index], reps: Number(e.target.value) || 1 }
                        updateWorkoutExercises(next, { resetRepsForExerciseId: exercise.id })
                      }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    Repos (s)
                    <input
                      type="number"
                      min={10}
                      step={5}
                      value={exercise.rest}
                      onChange={(e) => {
                        const next = [...workout.exercises]
                        next[index] = { ...next[index], rest: Number(e.target.value) || 30 }
                        updateWorkoutExercises(next)
                      }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!autoRestAfterSet && !showSummary && !trainingMode && (
        <div className="fixed bottom-20 inset-x-0 z-30 px-4 lg:hidden">
          <button
            onClick={markNextSetCompleted}
            disabled={sessionPaused}
            className={`w-full btn-primary min-h-12 shadow-lg transition-transform ${setPulse ? 'scale-[1.02]' : ''}`}
            data-testid="mobile-mark-next-set-sticky"
          >
            Set suivant
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 reveal reveal-2">
        {/* Exercice actuel */}
        <div className="lg:col-span-2">
          <div className="card bg-gradient-to-br from-primary-50 to-accent-50 shadow-sm">
          <div ref={exerciseTopRef} className="mb-6">
            <span className="text-sm text-gray-600">
              Exercice {currentExerciseIndex + 1} sur {workout.exercises.length}
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              {currentExercise.name}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SupersetToggle
                storageKey={supersetKey}
                exerciseId={currentExercise.id}
                nextExerciseId={workout.exercises[currentExerciseIndex + 1]?.id}
                onChange={(map) => setSupersetMap(map)}
              />
              {isSupersetWithNext && (
                <span className="text-xs text-red-600 font-semibold">
                  Superset avec l’exercice suivant
                </span>
              )}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={() => setGuideOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary-600" />
                <span className="text-sm font-semibold text-gray-900">Guide express</span>
              </div>
              {guideOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {guideOpen && (
              <div className="mt-3 text-sm text-gray-600 space-y-2">
                <div>1. Règle tes séries et répétitions avant de démarrer.</div>
                <div>2. Lance le repos pour garder un rythme régulier.</div>
                <div>3. Note tes sensations pour suivre ta progression.</div>
                <div className="text-xs text-gray-500">
                  Astuce: reste concentré sur la technique de {currentExercise.name}.
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-soft text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl font-bold text-primary-600">{currentSetCount}</div>
              <div className="text-sm text-gray-600">Séries</div>
            </div>
            <div className="card-soft text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl font-bold text-primary-600">{currentRepsLabel}</div>
              <div className="text-sm text-gray-600">Répétitions</div>
            </div>
          </div>

          <div className="mb-4 text-xs text-gray-500">
            Auto‑passage actif après le repos entre exercices.
          </div>

          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-700 mb-2">Charge par série</div>
            <div className="grid grid-cols-3 gap-3 text-[11px] uppercase tracking-wide text-gray-500 mb-2">
              <span></span>
              <span>Poids ({weightUnit})</span>
              <span>Répétitions</span>
            </div>
            <div className="space-y-2">
              {currentInputs.map((set, index) => (
                <div key={index} className="grid grid-cols-3 gap-3 items-center">
                  <label className="flex items-center gap-2 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={set.completed || false}
                      disabled={sessionPaused}
                      onChange={(event) => {
                        const checked = event.target.checked
                        toggleSetCompleted(index, checked)
                      }}
                      className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Série {index + 1}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={set.weight}
                    disabled={sessionPaused}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setExerciseInputs((prev) => ({
                        ...prev,
                        [currentExercise.id]: prev[currentExercise.id].map((row, idx) =>
                          idx === index ? { ...row, weight: value } : row
                        ),
                      }))
                    }}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder={weightUnit}
                  />
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={set.reps}
                    disabled={sessionPaused}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setExerciseInputs((prev) => ({
                        ...prev,
                        [currentExercise.id]: prev[currentExercise.id].map((row, idx) =>
                          idx === index ? { ...row, reps: value } : row
                        ),
                      }))
                    }}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="reps"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markNextSetCompleted}
                data-testid="mark-next-set"
                disabled={sessionPaused}
                className={`min-h-11 text-xs font-semibold px-4 py-2 rounded-full border border-primary-200 text-primary-700 hover:border-primary-300 transition-transform ${
                  setPulse ? 'scale-[1.02]' : ''
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Valider la prochaine série (Entrée)
              </button>
              <button
                type="button"
                onClick={undoLastCompletedSet}
                disabled={sessionPaused || !lastCompletedSet}
                className="min-h-11 text-xs font-semibold px-4 py-2 rounded-full border border-amber-200 text-amber-700 hover:border-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="undo-last-set"
              >
                Annuler la dernière série
              </button>
              <button
                type="button"
                onClick={() => updateCurrentExerciseSetCount(currentInputs.length + 1)}
                disabled={sessionPaused}
                className="min-h-11 text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Ajouter une série
              </button>
              <button
                type="button"
                onClick={() => updateCurrentExerciseSetCount(currentInputs.length - 1)}
                disabled={sessionPaused || (currentInputs?.length || 0) <= 1}
                className="min-h-11 text-xs font-semibold px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                − Supprimer une série
              </button>
            </div>
            <div className="mt-3 text-xs text-gray-600">
              Total soulevé : <span className="font-semibold">{currentVolume} kg</span> · 1RM estimé :{' '}
              <span className="font-semibold">{formatWeight(currentBestOneRm)}</span>
              {isPR && <span className="ml-2 text-emerald-600 font-semibold">PR</span>}
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">Notes</label>
              {savedNoteExerciseId === currentExercise.id && (
                <span className="text-xs font-semibold text-emerald-700">Enregistré</span>
              )}
            </div>
            <textarea
              value={exerciseNotes[currentExercise.id] || ''}
              onChange={(event) =>
                setExerciseNotes((prev) => ({ ...prev, [currentExercise.id]: event.target.value }))
              }
              onBlur={() => {
                saveSnapshotNow()
                setSavedNoteExerciseId(currentExercise.id)
                setTimeout(() => {
                  setSavedNoteExerciseId((prev) => (prev === currentExercise.id ? null : prev))
                }, 2000)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              disabled={sessionPaused}
              placeholder="Sensations, conseils..."
            />
          </div>

            {sessionPaused && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                Séance en pause. Reprenez pour continuer.
              </div>
            )}

            {/* Timer */}
            <div ref={timerRef} className="mb-6">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-primary-600 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-600">Temps de repos</div>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {!isRunning && timeRemaining === 0 && (
                  <button
                    onClick={() => handleStartTimer(effectiveRest, 'set')}
                    disabled={sessionPaused}
                    className="btn-primary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-5 w-5" />
                    <span>{effectiveRest === 0 ? 'Passer au superset' : 'Démarrer le repos'}</span>
                  </button>
                )}
                {isRunning && (
                  <button
                    onClick={handlePauseTimer}
                    disabled={sessionPaused}
                    className="btn-secondary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </button>
                )}
                {timeRemaining > 0 && (
                  <button
                    onClick={handleResetTimer}
                    disabled={sessionPaused}
                    className="btn-secondary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className="h-5 w-5" />
                    <span>Reset</span>
                  </button>
                )}
                {timeRemaining > 0 && (
                  <button
                    onClick={handleSkipTimer}
                    disabled={sessionPaused}
                    className="btn-secondary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward className="h-5 w-5" />
                    <span>Passer</span>
                  </button>
                )}
              </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              {!sessionPaused ? (
                <button
                  onClick={handlePauseSession}
                  className="btn-secondary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2"
                >
                  <Pause className="h-5 w-5" />
                  <span>Mettre la séance en pause</span>
                </button>
              ) : (
                <button
                  onClick={handleResumeSession}
                  className="btn-primary min-h-11 w-full sm:w-auto flex items-center justify-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Reprendre la séance</span>
                </button>
              )}
              <button
                onClick={handleCancelWorkout}
                className="min-h-11 w-full sm:w-auto rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Annuler la séance
              </button>
            </div>

            {/* Navigation */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:justify-between">
              <button
                onClick={() => {
                  if (sessionPaused) return
                  if (currentExerciseIndex > 0) {
                    setCurrentExerciseIndex(currentExerciseIndex - 1)
                    setTimeRemaining(0)
                    setIsRunning(false)
                  }
                }}
                disabled={sessionPaused || currentExerciseIndex === 0}
                className="min-h-14 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 text-base font-semibold hover:text-primary-700 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed w-full"
              >
                ← Précédent
              </button>
              {isLastExercise ? (
                <button
                  onClick={handleCompleteWorkout}
                  data-testid="complete-workout"
                  disabled={sessionPaused}
                  className="btn-primary min-h-14 text-base font-semibold rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Terminer la séance
                </button>
              ) : (
                <button
                  onClick={handleNextExercise}
                  disabled={sessionPaused}
                  className="btn-primary min-h-14 text-base font-semibold rounded-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Liste des exercices */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Exercices</h3>
          <div className="space-y-3">
            {workout.exercises.map((exercise, index) => {
              const exerciseRows = exerciseInputs[exercise.id] || []
              const displaySets = exerciseRows.length || clampPositiveInt(exercise.sets, 1)
              const displayReps = getRepsLabel(exerciseRows, exercise.reps)
              return (
                <div
                  key={exercise.id}
                  className={`card cursor-pointer transition-all ${
                    index === currentExerciseIndex
                      ? 'border-2 border-primary-600 bg-primary-50'
                      : index < currentExerciseIndex
                      ? 'bg-gray-100 opacity-75'
                      : ''
                  }`}
                  onClick={() => {
                    if (sessionPaused) return
                    setCurrentExerciseIndex(index)
                    setTimeRemaining(0)
                    setIsRunning(false)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{exercise.name}</div>
                      <div className="text-sm text-gray-600">
                        {displaySets} séries × {displayReps} reps
                      </div>
                      <div className="mt-2">
                        <SupersetToggle
                          storageKey={supersetKey}
                          exerciseId={exercise.id}
                          nextExerciseId={workout.exercises[index + 1]?.id}
                          onChange={(map) => setSupersetMap(map)}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setSelectedExerciseId(exercise.id)
                        }}
                        className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        Voir stats 1RM
                      </button>
                    </div>
                    {index === currentExerciseIndex && (
                      <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                    )}
                    {index < currentExerciseIndex && (
                      <div className="text-green-600 text-2xl">✓</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedExercise.name}</h3>
                <p className="text-sm text-gray-500">1RM estimé et progression</p>
              </div>
              <button
                onClick={() => setSelectedExerciseId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Meilleur 1RM</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatWeight(
                    Math.max(
                      ...selectedHistory.map((ex) =>
                        (ex.sets || []).reduce(
                          (max: number, set: SetInput) => Math.max(max, estimateOneRm(set.weight, set.reps)),
                          0
                        )
                      ),
                      0
                    )
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Total soulevé</div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedHistory.reduce((sum, ex) => {
                    return (
                      sum +
                      (ex.sets || []).reduce((setSum: number, set: SetInput) => setSum + set.weight * set.reps, 0)
                    )
                  }, 0)}{' '}
                  kg
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Séances avec cet exo</div>
                <div className="text-lg font-semibold text-gray-900">{selectedHistory.length}</div>
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="text-xs text-gray-500">Régularité (30j)</div>
                <div className="text-lg font-semibold text-gray-900">{exerciseRegularity30d} séance(s)</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Progression 1RM</div>
              <div className="h-40 w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                {historySeries.length < 2 ? (
                  <div className="text-xs text-gray-500">Pas assez de données pour afficher un graphique.</div>
                ) : (
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    {historySeries.map((point, idx) => {
                      const min = Math.min(...historySeries.map((p) => p.oneRm))
                      const max = Math.max(...historySeries.map((p) => p.oneRm))
                      const x = (idx / (historySeries.length - 1)) * 100
                      const y = max === min ? 20 : 35 - ((point.oneRm - min) / (max - min)) * 30
                      return (
                        <circle key={point.date} cx={x} cy={y} r="1.5" fill="#ef4444" />
                      )
                    })}
                    <polyline
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      points={historySeries
                        .map((point, idx) => {
                          const min = Math.min(...historySeries.map((p) => p.oneRm))
                          const max = Math.max(...historySeries.map((p) => p.oneRm))
                          const x = (idx / (historySeries.length - 1)) * 100
                          const y = max === min ? 20 : 35 - ((point.oneRm - min) / (max - min)) * 30
                          return `${x},${y}`
                        })
                        .join(' ')}
                    />
                  </svg>
                )}
              </div>
              </div>
              <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Progression volume</div>
              <div className="h-40 w-full rounded-lg border border-gray-200 bg-gray-50 p-3">
                {volumeSeries.length < 2 ? (
                  <div className="text-xs text-gray-500">Pas assez de données pour afficher un graphique.</div>
                ) : (
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    {volumeSeries.map((point, idx) => {
                      const min = Math.min(...volumeSeries.map((p) => p.volume))
                      const max = Math.max(...volumeSeries.map((p) => p.volume))
                      const x = (idx / (volumeSeries.length - 1)) * 100
                      const y = max === min ? 20 : 35 - ((point.volume - min) / (max - min)) * 30
                      return (
                        <circle key={point.date} cx={x} cy={y} r="1.5" fill="#16a34a" />
                      )
                    })}
                    <polyline
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="1.5"
                      points={volumeSeries
                        .map((point, idx) => {
                          const min = Math.min(...volumeSeries.map((p) => p.volume))
                          const max = Math.max(...volumeSeries.map((p) => p.volume))
                          const x = (idx / (volumeSeries.length - 1)) * 100
                          const y = max === min ? 20 : 35 - ((point.volume - min) / (max - min)) * 30
                          return `${x},${y}`
                        })
                        .join(' ')}
                    />
                  </svg>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-hidden flex flex-col">
            <button
              onClick={() => {
                setPickerOpen(false)
                setPickerIndex(null)
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pickerIndex != null && pickerIndex < workout.exercises.length ? 'Remplacer un exercice' : 'Ajouter un exercice'}
            </h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <ExerciseCatalog
                onSelect={(exercise) => {
                  if (pickerIndex != null && pickerIndex < workout.exercises.length) {
                    replaceExerciseAt(pickerIndex, exercise.name)
                  } else {
                    addExercise(exercise.name)
                  }
                  setPickerOpen(false)
                  setPickerIndex(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
      {trainingMode && workout && (
        <TrainingModeView
          exerciseName={currentExercise.name}
          currentSet={currentExerciseIndex + 1}
          totalSets={workout.exercises.length}
          reps={currentExercise.reps}
          weightUnit={weightUnit}
          timeRemaining={timeRemaining}
          isResting={timerKind === 'exercise'}
          onExit={() => setTrainingMode(false)}
          onToggleTimer={() => {
            if (sessionPaused) return
            if (isRunning) handlePauseTimer()
            else handleStartTimer(effectiveRest, timerKind ?? 'set')
          }}
          isTimerRunning={isRunning}
          restSeconds={effectiveRest}
        />
      )}
    </div>
  )
}
