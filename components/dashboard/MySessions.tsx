'use client'

import { useState, useEffect, useMemo } from 'react'
import { Play, Pause, RotateCcw, Clock, Flame, Trophy, Dumbbell } from 'lucide-react'
import TrainingModeView from '@/components/dashboard/TrainingModeView'
import { useToast } from '@/components/ui/ToastProvider'
import DashboardCalendar from '@/components/dashboard/Calendar'
import ExerciseMedia from '@/components/exercises/ExerciseMedia'
import EquipmentBadge from '@/components/exercises/EquipmentBadge'
import SupersetToggle from '@/components/exercises/SupersetToggle'
import { computeHistoryStats, WorkoutHistoryItem, toLocalDateKey } from '@/lib/history'
import { programs as allPrograms } from '@/data/programs'
import { inferMuscles, muscleLabel } from '@/lib/muscles'
import { useRouter } from 'next/navigation'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { persistHistoryForUser } from '@/lib/history-store'
import { persistCurrentWorkoutForUser } from '@/lib/user-state-store'

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
  videoUrl?: string
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
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [timerKind, setTimerKind] = useState<'set' | 'exercise' | null>(null)
  const [supersetMap, setSupersetMap] = useState<Record<string, string>>({})
  const [exerciseInputs, setExerciseInputs] = useState<ExerciseInputs>({})
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({})
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg')
  const [showSummary, setShowSummary] = useState(false)
  const [lastSummary, setLastSummary] = useState<{
    calories: number
    volume: number
    duration: number
    muscleUsage: { id: string; percent: number }[]
  } | null>(null)
  const [editWorkout, setEditWorkout] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [trainingMode, setTrainingMode] = useState(false)

  useEffect(() => {
    // Charger la séance du jour
    const storedWorkout = localStorage.getItem('fitpulse_current_workout')
    if (storedWorkout) {
      const parsed = JSON.parse(storedWorkout)
      setWorkout(parsed)
      if (parsed?.exercises?.length) {
        const inputs: ExerciseInputs = {}
        parsed.exercises.forEach((exercise: Exercise) => {
          inputs[exercise.id] = Array.from({ length: exercise.sets }).map(() => ({
            weight: 0,
            reps: exercise.reps,
          }))
        })
        setExerciseInputs(inputs)
      }
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
          { id: '1', name: 'Pompes', sets: 3, reps: 10, rest: 60, videoUrl: 'https://www.youtube.com/embed/IODxDxX7oi4' },
          { id: '2', name: 'Squats', sets: 3, reps: 12, rest: 60, videoUrl: 'https://www.youtube.com/embed/aclHkVaku9U' },
          { id: '3', name: 'Fentes', sets: 3, reps: 10, rest: 60, videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U' },
          { id: '4', name: 'Planche', sets: 3, reps: 30, rest: 45, videoUrl: 'https://www.youtube.com/embed/pSHjTRCQxIw' },
          { id: '5', name: 'Gainage', sets: 3, reps: 45, rest: 45, videoUrl: 'https://www.youtube.com/embed/ASdvN_XEl_c' },
        ],
      }
      setWorkout(defaultWorkout)
      localStorage.setItem('fitpulse_current_workout', JSON.stringify(defaultWorkout))
      if (user?.id) {
        void persistCurrentWorkoutForUser(user.id, defaultWorkout as unknown as Record<string, unknown>)
      }
      const inputs: ExerciseInputs = {}
      defaultWorkout.exercises.forEach((exercise) => {
        inputs[exercise.id] = Array.from({ length: exercise.sets }).map(() => ({
          weight: 0,
          reps: exercise.reps,
        }))
      })
      setExerciseInputs(inputs)
    }

    // Charger les statistiques depuis l'historique
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const { streak, totalWorkouts } = computeHistoryStats(history as WorkoutHistoryItem[])
    setStreak(streak)
    setCompletedWorkouts(totalWorkouts)
    if (storedWorkout) {
      const parsed = JSON.parse(storedWorkout)
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
    const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}')
    const override = Number(settings?.restTime)
    if (Number.isFinite(override) && override > 0) {
      setRestOverride(override)
    }
    const between = Number(settings?.restBetweenExercises)
    if (Number.isFinite(between) && between > 0) {
      setExerciseRestOverride(between)
    }
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
      const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}')
      const nextUnit: 'kg' | 'lbs' = settings?.weightUnit === 'lbs' ? 'lbs' : 'kg'
      const between = Number(settings?.restBetweenExercises)
      if (Number.isFinite(between) && between > 0) {
        setExerciseRestOverride(between)
      }
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

  useEffect(() => {
    if (!workout) return
    const stored = JSON.parse(localStorage.getItem(`fitpulse_superset_${workout.id}`) || '{}')
    setSupersetMap(stored)
  }, [workout?.id])

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
  }, [isRunning, timeRemaining, timerKind, soundEnabled, voiceEnabled])

  const handleStartTimer = (restTime: number, kind: 'set' | 'exercise') => {
    setTimerKind(kind)
    setTimeRemaining(restTime)
    setIsRunning(true)
  }

  const handlePauseTimer = () => {
    setIsRunning(false)
  }

  const handleResetTimer = () => {
    setTimeRemaining(0)
    setIsRunning(false)
    setTimerKind(null)
  }

  const handleNextExercise = () => {
    if (workout && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setTimeRemaining(0)
      setIsRunning(false)
      setTimerKind(null)
    }
  }

  const handleCompleteWorkout = () => {
    if (!workout) return

    // Ajouter à l'historique (éviter doublons même jour + même séance)
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const todayKey = toLocalDateKey(new Date())
    const existsSameSessionToday = history.some((item: any) =>
      typeof item.date === 'string' &&
      toLocalDateKey(item.date) === todayKey &&
      (item.workoutId === workout.id || item.workoutName === workout.name)
    )

    const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}')
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
        id: Date.now().toString(),
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
      localStorage.setItem('fitpulse_history', JSON.stringify(history))
      window.dispatchEvent(new Event('fitpulse-history'))
      if (user?.id) {
        void persistHistoryForUser(user.id, history as WorkoutHistoryItem[])
      }
    }

    // Réinitialiser
    const { streak, totalWorkouts } = computeHistoryStats(history as WorkoutHistoryItem[])
    setStreak(streak)
    setCompletedWorkouts(totalWorkouts)
    if (workout.programId) {
      const completedForProgram = (history as WorkoutHistoryItem[]).filter(
        (item: any) => item.programId === workout.programId
      ).length
      setProgramCompletedSessions(completedForProgram)
    }
    setCurrentExerciseIndex(0)
    setTimeRemaining(0)
    setIsRunning(false)
    if (workout) {
      localStorage.removeItem('fitpulse_current_workout')
      if (user?.id) {
        void persistCurrentWorkoutForUser(user.id, null)
      }
    }
    setLastSummary({
      calories: caloriesBurned,
      volume: Math.round(sessionVolume),
      duration: workout.duration,
      muscleUsage,
    })
    setShowSummary(false)
    push(`Séance terminée !`, 'success')
    window.location.href = '/dashboard?view=feed'
  }

  const updateWorkoutExercises = (nextExercises: Exercise[]) => {
    if (!workout) return
    const updated = { ...workout, exercises: nextExercises }
    setWorkout(updated)
    localStorage.setItem('fitpulse_current_workout', JSON.stringify(updated))
    if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, updated as unknown as Record<string, unknown>)
    }
    setExerciseInputs((prev) => {
      const next: ExerciseInputs = {}
      nextExercises.forEach((exercise, index) => {
        const previousExercise = workout.exercises[index]
        const existing =
          (previousExercise && previousExercise.id === exercise.id && prev[exercise.id]) || prev[exercise.id] || []
        next[exercise.id] = Array.from({ length: exercise.sets }).map((_, idx) => {
          const row = (existing as SetInput[])[idx]
          return {
            weight: row?.weight ?? 0,
            reps: row?.reps ?? exercise.reps,
            completed: row?.completed ?? false,
          }
        })
      })
      return next
    })
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

  const supersetKey = workout ? `fitpulse_superset_${workout.id}` : 'fitpulse_superset'
  const currentExercise = workout ? workout.exercises[currentExerciseIndex] : null
  const currentSupersetGroup = workout
    ? supersetMap[workout.exercises[currentExerciseIndex]?.id]
    : undefined
  const nextExerciseId = workout?.exercises[currentExerciseIndex + 1]?.id
  const isSupersetWithNext =
    !!currentSupersetGroup && nextExerciseId && supersetMap[nextExerciseId] === currentSupersetGroup

  const effectiveRest = useMemo(() => {
    if (!workout || !currentExercise) return 0
    const base = restOverride && restOverride > 0 ? restOverride : currentExercise.rest
    return isSupersetWithNext ? 0 : base
  }, [currentExercise, isSupersetWithNext, restOverride])

  const effectiveExerciseRest = useMemo(() => {
    if (isSupersetWithNext) return 0
    return exerciseRestOverride && exerciseRestOverride > 0 ? exerciseRestOverride : 180
  }, [exerciseRestOverride, isSupersetWithNext])

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
                <button className="btn-primary w-full">Modifier la séance</button>
                <button className="btn-secondary w-full">Copier le lien</button>
              </div>
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

  const currentInputs = exerciseInputs[currentExercise.id] || []
  const currentVolume = currentInputs.reduce((sum, set) => sum + set.weight * set.reps, 0)
  const currentBestOneRm = currentInputs.reduce((max, set) => Math.max(max, estimateOneRm(set.weight, set.reps)), 0)
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1

  const toggleSetCompleted = (setIndex: number, checked: boolean) => {
    setExerciseInputs((prev) => {
      const updated = {
        ...prev,
        [currentExercise.id]: (prev[currentExercise.id] || []).map((row, idx) =>
          idx === setIndex ? { ...row, completed: checked } : row
        ),
      }
      if (!checked) return updated
      const allDone = (updated[currentExercise.id] || []).every((row) => row.completed)
      if (allDone) {
        if (effectiveExerciseRest > 0) {
          handleStartTimer(effectiveExerciseRest, 'exercise')
        } else {
          setTimeout(() => {
            handleNextExercise()
          }, 100)
        }
      } else if (effectiveRest > 0) {
        handleStartTimer(effectiveRest, 'set')
      }
      return updated
    })
  }

  const markNextSetCompleted = () => {
    const nextIndex = currentInputs.findIndex((set) => !set.completed)
    if (nextIndex === -1) {
      if (effectiveExerciseRest > 0) {
        handleStartTimer(effectiveExerciseRest, 'exercise')
      } else {
        handleNextExercise()
      }
      return
    }
    toggleSetCompleted(nextIndex, true)
  }

  useEffect(() => {
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
        if (isRunning) handlePauseTimer()
        else handleStartTimer(effectiveRest, timerKind ?? 'set')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentExercise.id, currentInputs, isLastExercise, isRunning, effectiveRest, timerKind, effectiveExerciseRest])

  const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as any[]
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

  return (
    <div className="page-wrap panel-stack">
      <div className="mb-8 reveal">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">{workout.name}</h1>
          <div className="text-xs font-semibold text-primary-700 bg-primary-100 px-3 py-1 rounded-full">
            {currentExerciseIndex + 1}/{workout.exercises.length} exercices
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
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Remplacer
                    </button>
                    <button
                      onClick={() => removeExerciseAt(index)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
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
                        updateWorkoutExercises(next)
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 reveal reveal-2">
        {/* Exercice actuel */}
        <div className="lg:col-span-2">
          <div className="card bg-gradient-to-br from-primary-50 to-accent-50 shadow-sm">
            <div className="mb-6">
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

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card-soft text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl font-bold text-primary-600">{currentExercise.sets}</div>
              <div className="text-sm text-gray-600">Séries</div>
            </div>
            <div className="card-soft text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="text-2xl font-bold text-primary-600">{currentExercise.reps}</div>
              <div className="text-sm text-gray-600">Répétitions</div>
            </div>
          </div>

          <div className="mb-4 text-xs text-gray-500">
            Auto‑passage actif après le repos entre exercices.
          </div>
          <div className="mb-6">
            <ExerciseMedia name={currentExercise.name} videoUrl={currentExercise.videoUrl} />
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
                      onChange={(event) => {
                        const checked = event.target.checked
                        toggleSetCompleted(index, checked)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Série {index + 1}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={set.weight}
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
                className="text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 text-primary-700 hover:border-primary-300"
              >
                Valider la prochaine série (Entrée)
              </button>
              <button
                type="button"
                onClick={() =>
                  setExerciseInputs((prev) => ({
                    ...prev,
                    [currentExercise.id]: [
                      ...(prev[currentExercise.id] || []),
                      { weight: 0, reps: currentExercise.reps },
                    ],
                  }))
                }
                className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300"
              >
                + Ajouter une série
              </button>
              <button
                type="button"
                onClick={() =>
                  setExerciseInputs((prev) => ({
                    ...prev,
                    [currentExercise.id]: (prev[currentExercise.id] || []).slice(0, -1),
                  }))
                }
                disabled={(currentInputs?.length || 0) <= 1}
                className="text-xs font-semibold px-3 py-1 rounded-full border border-gray-200 text-gray-600 hover:border-primary-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
            <textarea
              value={exerciseNotes[currentExercise.id] || ''}
              onChange={(event) =>
                setExerciseNotes((prev) => ({ ...prev, [currentExercise.id]: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              rows={3}
              placeholder="Sensations, conseils..."
            />
          </div>

            {/* Timer */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className="text-6xl font-bold text-primary-600 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-gray-600">Temps de repos</div>
              </div>
              <div className="flex justify-center space-x-4">
                {!isRunning && timeRemaining === 0 && (
                  <button
                    onClick={() => handleStartTimer(effectiveRest, 'set')}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>{effectiveRest === 0 ? 'Passer au superset' : 'Démarrer le repos'}</span>
                  </button>
                )}
                {isRunning && (
                  <button onClick={handlePauseTimer} className="btn-secondary flex items-center space-x-2">
                    <Pause className="h-5 w-5" />
                    <span>Pause</span>
                  </button>
                )}
                {timeRemaining > 0 && (
                  <button onClick={handleResetTimer} className="btn-secondary flex items-center space-x-2">
                    <RotateCcw className="h-5 w-5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  if (currentExerciseIndex > 0) {
                    setCurrentExerciseIndex(currentExerciseIndex - 1)
                    setTimeRemaining(0)
                    setIsRunning(false)
                  }
                }}
                disabled={currentExerciseIndex === 0}
                className="px-4 py-2 text-gray-600 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              {isLastExercise ? (
                <button onClick={handleCompleteWorkout} className="btn-primary">
                  Terminer la séance
                </button>
              ) : (
                <button onClick={handleNextExercise} className="btn-primary">
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
            {workout.exercises.map((exercise, index) => (
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
                  setCurrentExerciseIndex(index)
                  setTimeRemaining(0)
                  setIsRunning(false)
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{exercise.name}</div>
                    <div className="text-sm text-gray-600">
                      {exercise.sets} séries × {exercise.reps} reps
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
            ))}
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

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            </div>

            <div className="mt-6">
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
