'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Dumbbell, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'

type RoutineExercise = {
  name: string
  sets: number
  reps: number
  rest: number
}

type Routine = {
  id: string
  name: string
  equipment: string
  sessionsPerWeek: number
  exercises: RoutineExercise[]
  createdAt: string
}

const templates = [
  {
    name: 'Full Body Express',
    equipment: 'Poids du corps',
    sessionsPerWeek: 3,
    exercises: [
      { name: 'Pompes', sets: 3, reps: 10, rest: 60 },
      { name: 'Squats', sets: 3, reps: 12, rest: 60 },
      { name: 'Fentes', sets: 3, reps: 10, rest: 60 },
      { name: 'Gainage', sets: 3, reps: 30, rest: 45 },
    ],
  },
  {
    name: 'Haut du corps',
    equipment: 'Haltères',
    sessionsPerWeek: 3,
    exercises: [
      { name: 'Développé couché', sets: 4, reps: 8, rest: 90 },
      { name: 'Rowing', sets: 4, reps: 10, rest: 90 },
      { name: 'Shoulder press', sets: 3, reps: 10, rest: 75 },
      { name: 'Curl biceps', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    name: 'Bas du corps',
    equipment: 'Machines',
    sessionsPerWeek: 2,
    exercises: [
      { name: 'Presse à cuisses', sets: 4, reps: 10, rest: 90 },
      { name: 'Leg extension', sets: 3, reps: 12, rest: 75 },
      { name: 'Leg curl', sets: 3, reps: 12, rest: 75 },
      { name: 'Mollets', sets: 3, reps: 15, rest: 60 },
    ],
  },
]

const STORAGE_KEY = 'fitpulse_custom_routines'
const PLAN_KEY = 'fitpulse_plan'

function loadRoutines(): Routine[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRoutines(routines: Routine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routines))
}

export default function CustomRoutines() {
  const router = useRouter()
  const { push } = useToast()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('Poids du corps')
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [exercises, setExercises] = useState<RoutineExercise[]>([
    { name: '', sets: 3, reps: 10, rest: 60 },
  ])
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)

  useEffect(() => {
    setRoutines(loadRoutines())
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


  const isPro = useMemo(() => {
    return localStorage.getItem(PLAN_KEY) === 'pro'
  }, [])

  const canCreate = isPro || routines.length < 5

  const handleAddExercise = () => {
    setExercises((prev) => [...prev, { name: `Exercice ${prev.length + 1}`, sets: 3, reps: 10, rest: 60 }])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleCreate = () => {
    if (!canCreate) {
      push('Limite gratuite atteinte. Passe Pro pour créer plus de routines.', 'error')
      return
    }
    if (!name.trim()) {
      push('Donne un nom à ta routine.', 'error')
      return
    }
    if (editingRoutineId) {
      const existing = routines.find((routine) => routine.id === editingRoutineId)
      const updated: Routine = {
        id: editingRoutineId,
        name: name.trim(),
        equipment,
        sessionsPerWeek,
        exercises: exercises.filter((ex) => ex.name.trim()),
        createdAt: existing?.createdAt || new Date().toISOString(),
      }
      const next = routines.map((routine) => (routine.id === editingRoutineId ? updated : routine))
      setRoutines(next)
      saveRoutines(next)
      setEditingRoutineId(null)
      setName('')
      setEquipment('Poids du corps')
      setSessionsPerWeek(3)
      setExercises([{ name: '', sets: 3, reps: 10, rest: 60 }])
      push('Routine mise à jour.', 'success')
      return
    }

    const routine: Routine = {
      id: `${Date.now()}`,
      name: name.trim(),
      equipment,
      sessionsPerWeek,
      exercises: exercises.filter((ex) => ex.name.trim()),
      createdAt: new Date().toISOString(),
    }
    const next = [routine, ...routines]
    setRoutines(next)
    saveRoutines(next)
    setName('')
    setEquipment('Poids du corps')
    setSessionsPerWeek(3)
    setExercises([{ name: '', sets: 3, reps: 10, rest: 60 }])
    push('Routine créée.', 'success')
  }

  const handleDelete = (id: string) => {
    const next = routines.filter((routine) => routine.id !== id)
    setRoutines(next)
    saveRoutines(next)
  }

  const startRoutine = (routine: Routine) => {
    const workout = {
      id: routine.id,
      name: `Routine - ${routine.name}`,
      duration: Math.max(20, routine.exercises.length * 6),
      equipment: routine.equipment,
      exercises: routine.exercises.map((exercise, index) => ({
        id: `${routine.id}-${index + 1}`,
        ...exercise,
      })),
    }
    localStorage.setItem('fitpulse_current_workout', JSON.stringify(workout))
    router.push('/dashboard?view=session')
  }

  return (
    <div className="page-wrap panel-stack">
      <div className="mb-8">
        <h1 className="section-title mb-2">Mes routines</h1>
        <p className="section-subtitle">
          Crée tes routines personnalisées. Limite gratuite : 5 routines.
        </p>
        {!isPro && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Tu as {routines.length}/5 routines. Pour en créer plus, passe Pro.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {routines.length === 0 && (
            <div className="card-soft text-center text-gray-600">Aucune routine créée.</div>
          )}
          {routines.map((routine) => (
            <div key={routine.id} className="card-soft">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{routine.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Matériel : {routine.equipment} · {routine.sessionsPerWeek} séances / semaine · {routine.exercises.length} exercices
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(routine.id)}
                  className="text-xs font-semibold text-red-500 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {routine.exercises.map((exercise) => (
                  <span key={exercise.name} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {exercise.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setEditingRoutineId(routine.id)
                    setName(routine.name)
                    setEquipment(routine.equipment)
                    setSessionsPerWeek(routine.sessionsPerWeek)
                    setExercises(routine.exercises)
                  }}
                  className="btn-secondary"
                >
                  Modifier
                </button>
                <button
                  onClick={() => startRoutine(routine)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Démarrer
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="h-5 w-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Nouvelle routine</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Template rapide</label>
              <select
                onChange={(e) => {
                  const tpl = templates.find((t) => t.name === e.target.value)
                  if (tpl) {
                    setName(tpl.name)
                    setEquipment(tpl.equipment)
                    setSessionsPerWeek(tpl.sessionsPerWeek)
                    setExercises(tpl.exercises)
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                defaultValue=""
              >
                <option value="">Choisir un template</option>
                {templates.map((tpl) => (
                  <option key={tpl.name} value={tpl.name}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Nom de la routine</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Ex: Haut du corps"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Matériel</label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {['Poids du corps', 'Élastiques', 'Haltères', 'Barres', 'Machines'].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Séances / semaine</label>
                <select
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                    <option key={value} value={value}>
                      {value} / semaine
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <div key={index} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-600">Exercice {index + 1}</label>
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="text-xs text-red-500"
                    >
                      Retirer
                    </button>
                  </div>
                  <input
                    value={exercise.name}
                    onChange={(e) =>
                      setExercises((prev) =>
                        prev.map((ex, idx) => (idx === index ? { ...ex, name: e.target.value } : ex))
                      )
                    }
                    className="mt-2 w-full rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Nom de l'exercice"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPickerIndex(index)
                      setPickerOpen(true)
                    }}
                    className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Choisir un exercice
                  </button>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Séries</label>
                      <input
                        type="number"
                        min={1}
                        value={exercise.sets}
                        onChange={(e) =>
                          setExercises((prev) =>
                            prev.map((ex, idx) => (idx === index ? { ...ex, sets: Number(e.target.value) } : ex))
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Reps</label>
                      <input
                        type="number"
                        min={1}
                        value={exercise.reps}
                        onChange={(e) =>
                          setExercises((prev) =>
                            prev.map((ex, idx) => (idx === index ? { ...ex, reps: Number(e.target.value) } : ex))
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 mb-1">Repos (s)</label>
                      <input
                        type="number"
                        min={10}
                        value={exercise.rest}
                        onChange={(e) =>
                          setExercises((prev) =>
                            prev.map((ex, idx) => (idx === index ? { ...ex, rest: Number(e.target.value) } : ex))
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-2 py-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddExercise}
              className="w-full rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:border-primary-400"
            >
              + Ajouter un exercice
            </button>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Dumbbell className="h-4 w-4" />
                {editingRoutineId ? 'Enregistrer la routine' : 'Créer la routine'}
              </button>
              {editingRoutineId && (
                <button
                  onClick={() => {
                    setEditingRoutineId(null)
                    setName('')
                    setEquipment('Poids du corps')
                    setSessionsPerWeek(3)
                    setExercises([{ name: '', sets: 3, reps: 10, rest: 60 }])
                  }}
                  className="btn-secondary w-full"
                >
                  Annuler les modifications
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {pickerOpen && pickerIndex != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Choisir un exercice</h3>
                <p className="text-sm text-gray-500">Sélectionne un exercice dans le catalogue.</p>
              </div>
              <button
                onClick={() => setPickerOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-2">
              <ExerciseCatalog
                onSelect={(exercise) => {
                  setExercises((prev) =>
                    prev.map((ex, idx) => (idx === pickerIndex ? { ...ex, name: exercise.name } : ex))
                  )
                  setPickerOpen(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
