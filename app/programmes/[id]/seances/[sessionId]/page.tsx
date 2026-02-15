'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Footer from '@/components/Footer'
import { programs, programsById, programsBySlug } from '@/data/programs'
import { slugify } from '@/lib/slug'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import ExerciseMedia from '@/components/exercises/ExerciseMedia'
import EquipmentBadge from '@/components/exercises/EquipmentBadge'
import RestTimeDisplay from '@/components/exercises/RestTimeDisplay'
import ExerciseCatalog from '@/components/exercises/ExerciseCatalog'
import { labelize } from '@/lib/labels'
import { Clock, Timer, Dumbbell, Pencil, Plus, RefreshCw, Save, X, Lock } from 'lucide-react'
import { inferVideoUrl } from '@/lib/videos'
import WithSidebar from '@/components/layouts/WithSidebar'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { persistCurrentWorkoutForUser, readLocalCurrentWorkout, writeLocalCurrentWorkout } from '@/lib/user-state-store'
import { readLocalHistory } from '@/lib/history-store'
import { canAccessProgram, getEntitlement } from '@/lib/subscription'

type SessionExercise = { name: string; sets: number; reps: number; rest: number; videoUrl?: string }

export default function SessionDetailPage() {
  const params = useParams<{ id?: string; sessionId?: string }>()
  const { user } = useAuth()
  const [isStarted, setIsStarted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerIndex, setPickerIndex] = useState<number | null>(null)
  const [customExercises, setCustomExercises] = useState<SessionExercise[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [nextUnlockedId, setNextUnlockedId] = useState<string | undefined>(undefined)
  const [entitlement, setEntitlement] = useState(() => getEntitlement())

  const { program, session } = useMemo(() => {
    const rawId = decodeURIComponent(params?.id || '').trim()
    const normalizedId = rawId.toLowerCase().split('?')[0].split('#')[0].replace(/\/+$/, '')
    const slugCandidate = slugify(rawId)
    const foundProgram =
      programsBySlug[normalizedId] ||
      programsBySlug[slugCandidate] ||
      programsById[rawId] ||
      programsById[normalizedId] ||
      programs.find(
        (item) =>
          item.slug === normalizedId ||
          item.slug === slugCandidate ||
          slugify(item.name) === slugCandidate ||
          item.id === rawId ||
          item.id === normalizedId
      ) ||
      programs.find((item) => normalizedId.includes(item.slug) || item.slug.includes(normalizedId))

    const foundSession =
      foundProgram?.sessions.find((item) => item.id === params?.sessionId) ??
      foundProgram?.sessions[0]

    return { program: foundProgram, session: foundSession }
  }, [params])

  useEffect(() => {
    const apply = () => setEntitlement(getEntitlement())
    apply()
    window.addEventListener('fitpulse-plan', apply)
    window.addEventListener('storage', apply)
    return () => {
      window.removeEventListener('fitpulse-plan', apply)
      window.removeEventListener('storage', apply)
    }
  }, [])

  useEffect(() => {
    if (!program || !session) return
    try {
      const stored = JSON.parse(localStorage.getItem('fitpulse_program_overrides') || '{}')
      const overrides = stored?.[program.id]?.[session.id]
      if (Array.isArray(overrides) && overrides.length > 0) {
        setCustomExercises(overrides)
      } else {
        setCustomExercises(session.exercises)
      }
    } catch {
      setCustomExercises(session.exercises)
    }
  }, [program?.id, session?.id])

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
    if (!program) return
    const applyProgress = () => {
      try {
        const history = readLocalHistory() as {
          programId?: string
          workoutId?: string
        }[]
        const completed = new Set(
          history
            .filter((item) => item.programId === program.id && item.workoutId)
            .map((item) => item.workoutId!)
        )
        const next = program.sessions.find((item) => !completed.has(item.id)) || program.sessions[0]
        setCompletedIds(completed)
        setNextUnlockedId(next?.id)
      } catch {
        setCompletedIds(new Set())
        setNextUnlockedId(program.sessions[0]?.id)
      }
    }

    applyProgress()
    window.addEventListener('fitpulse-history', applyProgress)
    return () => window.removeEventListener('fitpulse-history', applyProgress)
  }, [program])

  const sessionExercises = customExercises.length > 0 ? customExercises : session?.exercises || []
  const totalSets = session ? sessionExercises.reduce((sum, ex) => sum + ex.sets, 0) : 0
  const totalReps = session ? sessionExercises.reduce((sum, ex) => sum + ex.sets * ex.reps, 0) : 0
  const isLocked =
    !!program &&
    !!session &&
    !completedIds.has(session.id) &&
    !!nextUnlockedId &&
    session.id !== nextUnlockedId
  const isProgramLocked = !!program && !canAccessProgram(program.id, entitlement)

  useEffect(() => {
    if (!session) return
    const stored = readLocalCurrentWorkout()
    if (!stored) return
    try {
      const parsed = stored as Record<string, unknown>
      if (parsed?.id === session.id && parsed?.status === 'in_progress') {
        setIsStarted(true)
      }
    } catch {
      // ignore
    }
  }, [session])

  const handleStart = () => {
    if (!program || !session) return
    const workout = {
      id: session.id,
      name: `${program.name} - ${session.name}`,
      duration: session.duration,
      programId: program.id,
      programName: program.name,
      equipment: program.equipment,
      exercises: sessionExercises.map((exercise, index) => ({
        id: `${session.id}-${index + 1}`,
        ...exercise,
      })),
    }
    writeLocalCurrentWorkout(workout as Record<string, unknown>)
    if (user?.id) {
      void persistCurrentWorkoutForUser(user.id, workout as Record<string, unknown>)
    }
    setIsStarted(true)
  }

  const saveOverrides = (exercises: { name: string; sets: number; reps: number; rest: number }[]) => {
    if (!program || !session) return
    const stored = JSON.parse(localStorage.getItem('fitpulse_program_overrides') || '{}')
    const next = {
      ...stored,
      [program.id]: {
        ...(stored?.[program.id] || {}),
        [session.id]: exercises,
      },
    }
    localStorage.setItem('fitpulse_program_overrides', JSON.stringify(next))
  }

  const resetOverrides = () => {
    if (!program || !session) return
    const stored = JSON.parse(localStorage.getItem('fitpulse_program_overrides') || '{}')
    if (stored?.[program.id]?.[session.id]) {
      const next = { ...stored }
      if (next[program.id]) {
        delete next[program.id][session.id]
      }
      localStorage.setItem('fitpulse_program_overrides', JSON.stringify(next))
    }
    setCustomExercises(session.exercises)
    setIsEditing(false)
  }

  const updateExercise = (
    index: number,
    patch: Partial<{ name: string; sets: number; reps: number; rest: number }>
  ) => {
    setCustomExercises((prev) => {
      const next = [...prev]
      const current = next[index]
      if (!current) return prev
      next[index] = { ...current, ...patch }
      return next
    })
  }

  const getThumbnail = (name: string) => {
    const url = inferVideoUrl(name)
    if (!url) return null
    const match = url.match(/\/embed\/([a-zA-Z0-9_-]+)/)
    if (!match) return null
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="session">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          {!program || !session ? (
            <div className="card-soft text-center py-12">
              <h1 className="section-title mb-3">Séance introuvable</h1>
              <p className="text-gray-600 mb-6">Impossible de charger cette séance. Retourne aux programmes.</p>
              <Link href="/programmes" className="btn-primary">
                Voir les programmes
              </Link>
            </div>
          ) : isProgramLocked ? (
            <div className="card-soft text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="section-title mb-3">Programme premium</h1>
              <p className="text-gray-600 mb-6">
                Cette séance est réservée au plan Pro.
              </p>
              <Link href="/pricing" className="btn-primary">
                Voir les plans
              </Link>
            </div>
          ) : isLocked ? (
            <div className="card-soft text-center py-12">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="section-title mb-3">Séance verrouillée</h1>
              <p className="text-gray-600 mb-6">
                Termine d&apos;abord la séance en cours avant d&apos;accéder à celle-ci.
              </p>
              <Link href={`/programmes/${program.slug}/seances/${nextUnlockedId}`} className="btn-primary">
                Aller à la séance actuelle
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <Link href={`/programmes/${program.slug}`} className="text-sm text-primary-600 hover:text-primary-700">
                  ← Retour au programme
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
                <div className="card-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-xl lg:text-2xl font-semibold text-gray-900">{session.name}</h1>
                      <div className="text-xs text-gray-500 mt-1">{session.focus}</div>
                      <div className="mt-2">
                        <EquipmentBadge equipment={program.equipment} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing((prev) => !prev)}
                        className="btn-secondary px-3 py-2 text-xs flex items-center gap-2"
                      >
                        <Pencil className="h-4 w-4" />
                        {isEditing ? 'Fermer' : 'Modifier'}
                      </button>
                      <StartProgramButton
                        program={program}
                        sessionId={session.id}
                        label={isStarted ? 'Séance en cours' : 'Démarrer la séance'}
                        className="btn-primary px-4 py-2 text-sm"
                        onStart={handleStart}
                        hrefOverride="/dashboard?view=session"
                        overrideExercises={sessionExercises}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Durée {session.duration} min
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      {totalSets} séries
                    </div>
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      {totalReps} reps
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-5 rounded-xl border border-dashed border-primary-200 bg-primary-50/30 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">Personnaliser la séance</div>
                          <div className="text-xs text-gray-600">
                            Ajoute, remplace ou supprime des exercices. Les changements sont sauvés pour toi.
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveOverrides(sessionExercises)}
                            className="btn-primary px-3 py-2 text-xs flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Enregistrer
                          </button>
                          <button
                            onClick={resetOverrides}
                            className="btn-secondary px-3 py-2 text-xs flex items-center gap-2"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Réinitialiser
                          </button>
                          <button
                            onClick={() => {
                              setPickerIndex(sessionExercises.length)
                              setPickerOpen(true)
                            }}
                            className="btn-secondary px-3 py-2 text-xs flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter un exercice
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 divide-y divide-gray-100">
                    {sessionExercises.map((exercise, index) => (
                      <div key={exercise.name} className="py-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-full border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                              {getThumbnail(exercise.name) ? (
                                <img
                                  src={getThumbnail(exercise.name) as string}
                                  alt={exercise.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Dumbbell className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{exercise.name}</div>
                              <div className="text-xs text-gray-500">
                                {exercise.sets} séries · {exercise.reps} reps ·{' '}
                                <RestTimeDisplay defaultRest={exercise.rest} />
                              </div>
                            </div>
                          </div>
                          {isEditing && (
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
                                onClick={() => {
                                  setCustomExercises((prev) => prev.filter((_, idx) => idx !== index))
                                }}
                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                              >
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                        {isEditing && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                            <label className="flex flex-col gap-1">
                              Séries
                              <input
                                type="number"
                                min={1}
                                value={exercise.sets}
                                onChange={(e) => updateExercise(index, { sets: Number(e.target.value) || 1 })}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              Répétitions
                              <input
                                type="number"
                                min={1}
                                value={exercise.reps}
                                onChange={(e) => updateExercise(index, { reps: Number(e.target.value) || 1 })}
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
                                onChange={(e) => updateExercise(index, { rest: Number(e.target.value) || 30 })}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                              />
                            </label>
                          </div>
                        )}
                        <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3">
                          <div className="grid grid-cols-[40px_1fr_90px] text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                            <span>Set</span>
                            <span>Réps</span>
                            <span>Repos</span>
                          </div>
                          <div className="space-y-2">
                            {Array.from({ length: exercise.sets }).map((_, idx) => (
                              <div key={`${exercise.name}-set-${idx}`} className="grid grid-cols-[40px_1fr_90px] text-sm text-gray-700">
                                <span>{idx + 1}</span>
                                <span>{exercise.reps} reps</span>
                                <span>{exercise.rest}s</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <details className="mt-3">
                          <summary className="text-xs font-semibold text-primary-600 cursor-pointer">
                            Voir la vidéo et les muscles
                          </summary>
                          <div className="mt-3">
                            <ExerciseMedia name={exercise.name} videoUrl={exercise.videoUrl} />
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel-stack">
                  <div className="card-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Programme</h3>
                    <p className="text-gray-600 mb-4">{program.name}</p>
                    <Link
                      href={`/programmes/${program.slug}`}
                      className="btn-secondary w-full text-center"
                    >
                      Voir le programme
                    </Link>
                  </div>
                  <div className="card-soft">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Conseil</h3>
                    <p className="text-gray-600">Concentrez-vous sur la qualité du mouvement. Prenez votre temps.</p>
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </main>
      </WithSidebar>
      <Footer />
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
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {pickerIndex !== null && pickerIndex < sessionExercises.length ? 'Remplacer un exercice' : 'Ajouter un exercice'}
            </h3>
            <div className="flex-1 overflow-y-auto pr-2">
              <ExerciseCatalog
                onSelect={(exercise) => {
                  const nextExercise = {
                    name: exercise.name,
                    sets: 3,
                    reps: 10,
                    rest: 60,
                  }
                  setCustomExercises((prev) => {
                    const next = [...prev]
                    if (pickerIndex !== null && pickerIndex < next.length) {
                      next[pickerIndex] = nextExercise
                    } else {
                      next.push(nextExercise)
                    }
                    return next
                  })
                  setPickerOpen(false)
                  setPickerIndex(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
