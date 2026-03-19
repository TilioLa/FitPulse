'use client'

import { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Dumbbell, Play, Copy, Search, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/ToastProvider'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { readLocalRoutineFavorites, writeLocalRoutineFavorites } from '@/lib/favorites-store'
import { routineTemplates } from '@/data/routine-templates'
import {
  persistCustomRoutinesForUser,
  persistCurrentWorkoutForUser,
  readLocalCustomRoutines,
  writeLocalCustomRoutines,
  writeLocalCurrentWorkout,
} from '@/lib/user-state-store'
import { localizeExerciseNameFr } from '@/lib/exercise-name-fr'

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
  updatedAt?: string
}

const templates = routineTemplates

function loadRoutines(): Routine[] {
  try {
    return readLocalCustomRoutines() as unknown as Routine[]
  } catch {
    return []
  }
}

function saveRoutines(routines: Routine[]) {
  writeLocalCustomRoutines(routines as unknown as Record<string, unknown>[])
}

export default function CustomRoutines() {
  const router = useRouter()
  const { user } = useAuth()
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
  const [query, setQuery] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('Tous')
  const [sessionsFilter, setSessionsFilter] = useState('Tous')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => readLocalRoutineFavorites())

  useEffect(() => {
    const apply = () => setRoutines(loadRoutines())
    apply()
    window.addEventListener('fitpulse-custom-routines', apply)
    return () => window.removeEventListener('fitpulse-custom-routines', apply)
  }, [])

  useEffect(() => {
    const apply = () => setFavorites(readLocalRoutineFavorites())
    apply()
    window.addEventListener('fitpulse-routine-favorites', apply)
    window.addEventListener('storage', apply)
    return () => {
      window.removeEventListener('fitpulse-routine-favorites', apply)
      window.removeEventListener('storage', apply)
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

  const handleAddExercise = () => {
    setExercises((prev) => [...prev, { name: `Exercice ${prev.length + 1}`, sets: 3, reps: 10, rest: 60 }])
  }

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleCreate = () => {
    if (!name.trim()) {
      push('Donne un nom à ta routine.', 'error')
      return
    }
    const cleanedExercises = exercises.filter((ex) => ex.name.trim())
    if (cleanedExercises.length === 0) {
      push('Ajoute au moins un exercice.', 'error')
      return
    }
    if (editingRoutineId) {
      const existing = routines.find((routine) => routine.id === editingRoutineId)
      const updated: Routine = {
        id: editingRoutineId,
        name: name.trim(),
        equipment,
        sessionsPerWeek,
        exercises: cleanedExercises,
        createdAt: existing?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const next = routines.map((routine) => (routine.id === editingRoutineId ? updated : routine))
      setRoutines(next)
      saveRoutines(next)
      if (user?.id) {
        void persistCustomRoutinesForUser(user.id, next as unknown as Record<string, unknown>[])
      }
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
      exercises: cleanedExercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const next = [routine, ...routines]
    setRoutines(next)
    saveRoutines(next)
    if (user?.id) {
      void persistCustomRoutinesForUser(user.id, next as unknown as Record<string, unknown>[])
    }
    setName('')
    setEquipment('Poids du corps')
    setSessionsPerWeek(3)
    setExercises([{ name: '', sets: 3, reps: 10, rest: 60 }])
    push('Routine créée.', 'success')
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Supprimer cette routine ?')) return
    const next = routines.filter((routine) => routine.id !== id)
    setRoutines(next)
    saveRoutines(next)
    if (user?.id) {
      void persistCustomRoutinesForUser(user.id, next as unknown as Record<string, unknown>[])
    }
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
    writeLocalCurrentWorkout(workout as unknown as Record<string, unknown>)
    if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, workout as unknown as Record<string, unknown>)
    }
    router.push('/dashboard?view=session')
  }

  const duplicateRoutine = (routine: Routine) => {
    const cloned: Routine = {
      ...routine,
      id: `${Date.now()}`,
      name: `${routine.name} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const next = [cloned, ...routines]
    setRoutines(next)
    saveRoutines(next)
    if (user?.id) {
      void persistCustomRoutinesForUser(user.id, next as unknown as Record<string, unknown>[])
    }
    push('Routine dupliquée.', 'success')
  }

  const totals = useMemo(() => {
    const totalRoutines = routines.length
    const totalExercises = routines.reduce((sum, routine) => sum + routine.exercises.length, 0)
    const totalWeeklySessions = routines.reduce((sum, routine) => sum + routine.sessionsPerWeek, 0)
    const avgDuration = totalRoutines === 0
      ? 0
      : Math.round(routines.reduce((sum, routine) => sum + Math.max(20, routine.exercises.length * 6), 0) / totalRoutines)
    return { totalRoutines, totalExercises, totalWeeklySessions, avgDuration }
  }, [routines])

  const visibleRoutines = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return routines.filter((routine) => {
      const matchesQuery =
        normalized.length === 0 ||
        routine.name.toLowerCase().includes(normalized) ||
        routine.exercises.some((exercise) =>
          exercise.name.toLowerCase().includes(normalized) ||
          localizeExerciseNameFr(exercise.name).toLowerCase().includes(normalized)
        )
      const matchesEquipment = equipmentFilter === 'Tous' || routine.equipment === equipmentFilter
      const matchesSessions =
        sessionsFilter === 'Tous' || routine.sessionsPerWeek === Number(sessionsFilter)
      const matchesFav = !onlyFavorites || favorites.includes(routine.id)
      return matchesQuery && matchesEquipment && matchesSessions && matchesFav
    })
  }, [equipmentFilter, favorites, onlyFavorites, query, routines, sessionsFilter])

  return (
    <div className="page-wrap panel-stack">
      <div className="mb-8">
        <h1 className="section-title mb-2">Mes routines</h1>
        <p className="section-subtitle">
          Crée tes routines personnalisées en illimité.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-8">
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Routines</div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalRoutines}</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Exercices</div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalExercises}</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Séances / semaine</div>
          <div className="text-2xl font-bold text-gray-900">{totals.totalWeeklySessions}</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Durée moyenne</div>
          <div className="text-2xl font-bold text-gray-900">{totals.avgDuration} min</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-9 py-2 text-sm"
                placeholder="Rechercher une routine ou un exercice"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                onlyFavorites ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              Favoris
            </button>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {['Tous', 'Poids du corps', 'Haltères', 'Barres', 'Machines'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={sessionsFilter}
              onChange={(e) => setSessionsFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {['Tous', '1', '2', '3', '4', '5', '6', '7'].map((value) => (
                <option key={value} value={value}>
                  {value === 'Tous' ? 'Toutes fréquences' : `${value} / semaine`}
                </option>
              ))}
            </select>
          </div>

          {visibleRoutines.length === 0 && (
            <div className="card-soft text-center text-gray-600">
              Aucune routine trouvée.
            </div>
          )}
          {routines.length === 0 && (
            <div className="card-soft bg-gradient-to-br from-primary-50 to-white">
              <div className="text-sm font-semibold text-primary-700">Démarrer rapidement</div>
              <p className="mt-1 text-sm text-gray-700">
                Choisis un template et personnalise-le en quelques secondes.
              </p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((tpl) => (
                  <button
                    key={tpl.name}
                    onClick={() => {
                      setName(tpl.name)
                      setEquipment(tpl.equipment)
                      setSessionsPerWeek(tpl.sessionsPerWeek)
                      setExercises(tpl.exercises)
                    }}
                    className="rounded-xl border border-primary-200 bg-white px-3 py-3 text-left hover:shadow-sm"
                  >
                    <div className="text-sm font-semibold text-gray-900">{tpl.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {tpl.equipment} · {tpl.sessionsPerWeek} / semaine
                    </div>
                    <div className="mt-2 text-xs text-primary-700 font-semibold">Utiliser</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {visibleRoutines.map((routine) => (
            <div key={routine.id} className="card-soft">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{routine.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Matériel : {routine.equipment} · {routine.sessionsPerWeek} séances / semaine · {routine.exercises.length} exercices
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Durée estimée : {Math.max(20, routine.exercises.length * 6)} min ·
                    Dernière mise à jour : {new Date(routine.updatedAt || routine.createdAt).toLocaleDateString('fr-FR')}
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
                {routine.exercises.slice(0, 6).map((exercise) => (
                  <span key={exercise.name} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {localizeExerciseNameFr(exercise.name)}
                  </span>
                ))}
                {routine.exercises.length > 6 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    +{routine.exercises.length - 6}
                  </span>
                )}
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
                  type="button"
                  onClick={() => {
                    const isFav = favorites.includes(routine.id)
                    const next = isFav
                      ? favorites.filter((id) => id !== routine.id)
                      : [...favorites, routine.id]
                    writeLocalRoutineFavorites(next)
                    setFavorites(next)
                  }}
                  className={`btn-secondary inline-flex items-center gap-2 ${favorites.includes(routine.id) ? 'text-amber-600' : ''}`}
                >
                  <Star className={`h-4 w-4 ${favorites.includes(routine.id) ? 'fill-amber-400' : ''}`} />
                  Favori
                </button>
                <button
                  onClick={() => duplicateRoutine(routine)}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Dupliquer
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
                  {['Poids du corps', 'Haltères', 'Barres', 'Machines'].map((item) => (
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
                className="btn-primary w-full flex items-center justify-center gap-2"
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
