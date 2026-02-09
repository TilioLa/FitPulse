'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Clock, Flame, Trophy } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  rest: number // en secondes
}

interface Workout {
  id: string
  name: string
  duration: number // en minutes
  exercises: Exercise[]
}

export default function MySessions() {
  const { push } = useToast()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0) // en secondes
  const [streak, setStreak] = useState(0)
  const [completedWorkouts, setCompletedWorkouts] = useState(0)

  useEffect(() => {
    // Charger la séance du jour
    const storedWorkout = localStorage.getItem('fitpulse_current_workout')
    if (storedWorkout) {
      setWorkout(JSON.parse(storedWorkout))
    } else {
      // Séance par défaut
      const defaultWorkout: Workout = {
        id: '1',
        name: 'Séance du jour - Full Body',
        duration: 30,
        exercises: [
          { id: '1', name: 'Pompes', sets: 3, reps: 12, rest: 60 },
          { id: '2', name: 'Squats', sets: 3, reps: 15, rest: 60 },
          { id: '3', name: 'Planche', sets: 3, reps: 30, rest: 45 },
          { id: '4', name: 'Fentes', sets: 3, reps: 12, rest: 60 },
          { id: '5', name: 'Gainage', sets: 3, reps: 45, rest: 60 },
        ]
      }
      setWorkout(defaultWorkout)
      localStorage.setItem('fitpulse_current_workout', JSON.stringify(defaultWorkout))
    }

    // Charger les statistiques
    const stats = JSON.parse(localStorage.getItem('fitpulse_stats') || '{"streak": 0, "completedWorkouts": 0}')
    setStreak(stats.streak || 0)
    setCompletedWorkouts(stats.completedWorkouts || 0)
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            // Passer à l'exercice suivant
            handleNextExercise()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeRemaining])

  const handleStartTimer = (restTime: number) => {
    setTimeRemaining(restTime)
    setIsRunning(true)
  }

  const handlePauseTimer = () => {
    setIsRunning(false)
  }

  const handleResetTimer = () => {
    setTimeRemaining(0)
    setIsRunning(false)
  }

  const handleNextExercise = () => {
    if (workout && currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1)
      setTimeRemaining(0)
      setIsRunning(false)
    }
  }

  const handleCompleteWorkout = () => {
    if (!workout) return

    // Mettre à jour les statistiques
    const stats = JSON.parse(localStorage.getItem('fitpulse_stats') || '{"streak": 0, "completedWorkouts": 0}')
    stats.streak = (stats.streak || 0) + 1
    stats.completedWorkouts = (stats.completedWorkouts || 0) + 1
    localStorage.setItem('fitpulse_stats', JSON.stringify(stats))

    // Ajouter à l'historique
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    history.push({
      id: Date.now().toString(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      duration: workout.duration,
    })
    localStorage.setItem('fitpulse_history', JSON.stringify(history))

    // Réinitialiser
    setStreak(stats.streak)
    setCompletedWorkouts(stats.completedWorkouts)
    setCurrentExerciseIndex(0)
    setTimeRemaining(0)
    setIsRunning(false)
    push('Séance terminée ! Félicitations !', 'success')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!workout) {
    return <div className="text-center text-gray-600">Chargement de la séance...</div>
  }

  const currentExercise = workout.exercises[currentExerciseIndex]
  const isLastExercise = currentExerciseIndex === workout.exercises.length - 1

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{workout.name}</h1>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-5 w-5" />
            <span>Durée : {workout.duration} min</span>
          </div>
          <div className="flex items-center space-x-2 text-orange-600">
            <Flame className="h-5 w-5" />
            <span>Streak : {streak} jours</span>
          </div>
          <div className="flex items-center space-x-2 text-primary-600">
            <Trophy className="h-5 w-5" />
            <span>Séances complétées : {completedWorkouts}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercice actuel */}
        <div className="lg:col-span-2">
          <div className="card bg-gradient-to-br from-primary-50 to-accent-50">
            <div className="mb-6">
              <span className="text-sm text-gray-600">
                Exercice {currentExerciseIndex + 1} sur {workout.exercises.length}
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2">
                {currentExercise.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">{currentExercise.sets}</div>
                <div className="text-sm text-gray-600">Séries</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary-600">{currentExercise.reps}</div>
                <div className="text-sm text-gray-600">Répétitions</div>
              </div>
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
                    onClick={() => handleStartTimer(currentExercise.rest)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Play className="h-5 w-5" />
                    <span>Démarrer le repos</span>
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
    </div>
  )
}
