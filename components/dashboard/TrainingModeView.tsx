'use client'

import { useEffect } from 'react'
import { Play, Pause, X, Speaker } from 'lucide-react'

interface TrainingModeViewProps {
  exerciseName: string
  currentSet: number
  totalSets: number
  reps: number
  weightUnit: 'kg' | 'lbs'
  timeRemaining: number
  isResting: boolean
  onExit: () => void
  onToggleTimer: () => void
  isTimerRunning: boolean
  restSeconds: number
}

export default function TrainingModeView({
  exerciseName,
  currentSet,
  totalSets,
  reps,
  weightUnit,
  timeRemaining,
  isResting,
  onExit,
  onToggleTimer,
  isTimerRunning,
  restSeconds,
}: TrainingModeViewProps) {
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const pct = totalSets ? Math.round(((currentSet - 1) / totalSets) * 100) : 0

  useEffect(() => {
    const label = isResting ? 'Repos' : 'Travail'
    const speakText = `${label} : set ${currentSet} sur ${totalSets} de ${exerciseName}`
    window.speechSynthesis?.cancel()
    const utterance = new SpeechSynthesisUtterance(speakText)
    utterance.lang = navigator.language || 'fr-FR'
    window.speechSynthesis?.speak(utterance)
  }, [currentSet, exerciseName, totalSets, isResting])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-primary-900/95 text-white px-6 py-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary-300">Mode entraînement</div>
          <h1 className="text-3xl lg:text-4xl font-semibold">{exerciseName}</h1>
          <div className="text-sm text-primary-200 mt-1">
            Sets {currentSet}/{totalSets} · {reps} reps · {weightUnit}
          </div>
        </div>
        <button
          onClick={onExit}
          className="text-primary-200 border border-primary-500 rounded-full p-2 hover:bg-primary-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1">
        <div className="flex items-center gap-2">
          <Speaker className="h-5 w-5 text-primary-300" />
          <span className="text-xs uppercase tracking-wide text-primary-300">
            {isResting ? 'Repos' : 'Action'}
          </span>
        </div>
        <div className="text-6xl lg:text-8xl font-bold mt-6">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-sm text-primary-200 mt-2">
          {isResting ? `Temps de repos standard ${restSeconds}s` : 'Reste concentré sur la technique'}
        </div>
        <div className="mt-6 w-80 h-1 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-primary-400" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onToggleTimer}
          className="btn-secondary px-6 py-3 flex items-center gap-2 text-sm uppercase tracking-wider"
        >
          {isTimerRunning ? (
            <>
              <Pause className="h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Reprendre
            </>
          )}
        </button>
        <div className="text-xs text-primary-200">
          {isResting ? 'Repos actif' : 'Action en cours'}
        </div>
      </div>
    </div>
  )
}
