'use client'

import { ArrowRight } from 'lucide-react'
import { Program } from '@/data/programs'

export default function StartProgramButton({
  program,
  sessionId,
  label,
  className,
  onStart,
  hrefOverride,
  overrideExercises,
}: {
  program: Program
  sessionId?: string
  label?: string
  className?: string
  onStart?: () => void
  hrefOverride?: string | null
  overrideExercises?: { name: string; sets: number; reps: number; rest: number; videoUrl?: string }[]
}) {
  const resolveNextSession = () => {
    if (typeof window === 'undefined') {
      return program.sessions[0]
    }
    const historyRaw = localStorage.getItem('fitpulse_history')
    if (!historyRaw) return program.sessions[0]
    try {
      const history = JSON.parse(historyRaw) as { programId?: string; workoutId?: string }[]
      const completedIds = new Set(
        history.filter((item) => item.programId === program.id).map((item) => item.workoutId)
      )
      const next = program.sessions.find((item) => !completedIds.has(item.id))
      return next || program.sessions[0]
    } catch {
      return program.sessions[0]
    }
  }

  const handleStart = () => {
    const session = sessionId
      ? program.sessions.find((item) => item.id === sessionId)
      : resolveNextSession()

    if (!session) {
      return
    }

    const exercises = overrideExercises && overrideExercises.length > 0 ? overrideExercises : session.exercises
    const workout = {
      id: session.id,
      name: `${program.name} - ${session.name}`,
      duration: session.duration,
      programId: program.id,
      programName: program.name,
      equipment: program.equipment,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      exercises: exercises.map((exercise, index) => ({
        id: `${session.id}-${index + 1}`,
        ...exercise,
      })),
    }

    localStorage.setItem('fitpulse_current_workout', JSON.stringify(workout))
    onStart?.()
  }

  const targetSession =
    sessionId ? program.sessions.find((item) => item.id === sessionId) : resolveNextSession()
  const targetUrl =
    hrefOverride === undefined
      ? targetSession
        ? `/programmes/${program.slug}/seances/${targetSession.id}`
        : '#'
      : hrefOverride

  if (targetUrl === null) {
    return (
      <button
        onClick={handleStart}
        className={
          className ||
          'btn-primary w-full flex items-center justify-center space-x-2'
        }
      >
        <span>{label || 'Démarrer la prochaine séance'}</span>
        <ArrowRight className="h-5 w-5" />
      </button>
    )
  }

  return (
    <a
      href={targetUrl}
      onClick={handleStart}
      className={
        className ||
        'btn-primary w-full flex items-center justify-center space-x-2'
      }
    >
      <span>{label || 'Démarrer la prochaine séance'}</span>
      <ArrowRight className="h-5 w-5" />
    </a>
  )
}
