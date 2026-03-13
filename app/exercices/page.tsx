'use client'

import { useMemo, useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/SupabaseAuthProvider'
import Footer from '@/components/Footer'
import Sidebar from '@/components/dashboard/Sidebar'
import { Search, Plus, Dumbbell, Star, Download } from 'lucide-react'
import { exerciseCatalog, ExerciseCatalogItem } from '@/data/exercises'
import { getExerciseInsights, type ExerciseGoal } from '@/lib/exercise-insights'
import { readLocalHistory } from '@/lib/history-store'
import {
  readLocalCustomExercises,
  readLocalExerciseFavorites,
  saveLocalCustomExercises,
  saveLocalExerciseFavorites,
} from '@/lib/exercise-preferences-store'
import { hrefForDashboardSection } from '@/lib/dashboard-navigation'

type HistoryExercise = {
  id?: string
  name: string
  notes?: string
  sets?: { weight: number; reps: number }[]
}

type HistoryItem = {
  date: string
  exercises?: HistoryExercise[]
}

export default function ExercicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Chargement...</div>}>
      <ExercicesPageContent />
    </Suspense>
  )
}

function ExercicesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, user } = useAuth()
  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState('all')
  const [muscle, setMuscle] = useState('all')
  const [goal, setGoal] = useState<'all' | ExerciseGoal>('all')
  const [selected, setSelected] = useState<ExerciseCatalogItem | null>(null)
  const [customExercises, setCustomExercises] = useState<ExerciseCatalogItem[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => readLocalExerciseFavorites())
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [router, status])

  useEffect(() => {
    const term = searchParams.get('q') || ''
    if (term) setQuery(term)
  }, [searchParams])

  useEffect(() => {
    const applyStored = (value: ExerciseCatalogItem[]) => {
      queueMicrotask(() => setCustomExercises(value))
    }
    const load = () => applyStored(readLocalCustomExercises())
    load()
    window.addEventListener('fitpulse-custom-exercises', load)
    window.addEventListener('fitpulse-settings', load)
    return () => {
      window.removeEventListener('fitpulse-custom-exercises', load)
      window.removeEventListener('fitpulse-settings', load)
    }
  }, [])

  useEffect(() => {
    const applyFavorites = () => setFavorites(readLocalExerciseFavorites())
    applyFavorites()
    window.addEventListener('fitpulse-exercise-favorites', applyFavorites)
    window.addEventListener('fitpulse-settings', applyFavorites)
    return () => {
      window.removeEventListener('fitpulse-exercise-favorites', applyFavorites)
      window.removeEventListener('fitpulse-settings', applyFavorites)
    }
  }, [])

  const allExercises = useMemo(() => [...exerciseCatalog, ...customExercises], [customExercises])

  const equipmentOptions = useMemo(() => {
    const set = new Set<string>()
    allExercises.forEach((ex) => ex.equipment.forEach((e) => set.add(e)))
    return ['all', ...Array.from(set)]
  }, [allExercises])

  const muscleOptions = useMemo(() => {
    const set = new Set<string>()
    allExercises.forEach((ex) => ex.tags.forEach((t) => set.add(t)))
    return ['all', ...Array.from(set)]
  }, [allExercises])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return allExercises.filter((ex) => {
      const matchQuery = !term || ex.name.toLowerCase().includes(term)
      const matchEquip = equipment === 'all' || ex.equipment.includes(equipment)
      const matchMuscle = muscle === 'all' || ex.tags.includes(muscle)
      const insights = getExerciseInsights(ex)
      const matchGoal = goal === 'all' || insights.goals.includes(goal)
      const matchFav = !onlyFavorites || favorites.includes(ex.id)
      return matchQuery && matchEquip && matchMuscle && matchGoal && matchFav
    })
  }, [allExercises, query, equipment, muscle, goal, onlyFavorites, favorites])

  const goalOptions = useMemo(() => {
    const set = new Set<ExerciseGoal>()
    allExercises.forEach((item) => {
      getExerciseInsights(item).goals.forEach((itemGoal) => set.add(itemGoal))
    })
    return ['all', ...Array.from(set)] as Array<'all' | ExerciseGoal>
  }, [allExercises])

  const history = useMemo(() => {
    return readLocalHistory() as HistoryItem[]
  }, [])

  const stats = useMemo(() => {
    if (!selected) return null
    const allSets = history.flatMap((item) =>
      (item.exercises || [])
        .filter((ex) => ex.name === selected.name)
        .flatMap((ex) => ex.sets || [])
    )
    const totalVolume = allSets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0)
    const bestOneRm = allSets.reduce((max, set) => {
      const oneRm = Math.round((set.weight || 0) * (1 + (set.reps || 0) / 30))
      return Math.max(max, oneRm)
    }, 0)
    const lastDate = history
      .filter((item) => (item.exercises || []).some((ex) => ex.name === selected.name))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date

    return {
      totalVolume: Math.round(totalVolume),
      bestOneRm,
      lastDate,
    }
  }, [selected, history])

  const progression = useMemo(() => {
    if (!selected) return []
    const points = history
      .filter((item) => (item.exercises || []).some((ex) => ex.name === selected.name))
      .map((item) => {
        const best = (item.exercises || [])
          .filter((ex) => ex.name === selected.name)
          .flatMap((ex) => ex.sets || [])
          .reduce((max, set) => {
            const weight = Number(set.weight) || 0
            const reps = Number(set.reps) || 0
            const oneRm = Math.round(weight * (1 + reps / 30))
            return Math.max(max, oneRm)
          }, 0)
        return { date: item.date, oneRm: best }
      })
      .filter((point) => point.oneRm > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return points.slice(-6)
  }, [selected, history])

  const selectedInsights = useMemo(
    () => (selected ? getExerciseInsights(selected) : null),
    [selected]
  )

  const relatedExercises = useMemo(() => {
    if (!selected) return []
    return allExercises
      .filter((item) => item.id !== selected.id)
      .map((item) => {
        const overlap = item.tags.filter((tag) => selected.tags.includes(tag)).length
        return { item, overlap }
      })
      .filter((row) => row.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map((row) => row.item)
  }, [allExercises, selected])

  const handleAddCustom = () => {
    const name = prompt('Nom de l’exercice')
    if (!name) return
    const item: ExerciseCatalogItem = {
      id: `custom-${Date.now()}`,
      name,
      equipment: ['Poids du corps'],
      tags: ['Autre'],
    }
    const next = [item, ...customExercises]
    setCustomExercises(next)
    void saveLocalCustomExercises(next, user?.id)
  }

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id]
    setFavorites(next)
    void saveLocalExerciseFavorites(next, user?.id)
  }

  const selectedHistoryEntries = useMemo(() => {
    if (!selected) return []
    const rows = history
      .map((item) => {
        const matches = (item.exercises || []).filter((ex) => ex.name === selected.name)
        if (matches.length === 0) return null
        const allSets = matches.flatMap((ex) => ex.sets || [])
        const volume = allSets.reduce(
          (sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0),
          0
        )
        const bestOneRm = allSets.reduce((max, set) => {
          const oneRm = Math.round((Number(set.weight) || 0) * (1 + (Number(set.reps) || 0) / 30))
          return Math.max(max, oneRm)
        }, 0)
        const notes =
          matches.map((ex) => (ex.notes || '').trim()).find((note) => note.length > 0) || ''
        return {
          date: item.date,
          volume: Math.round(volume),
          bestOneRm,
          totalSets: allSets.length,
          notes,
        }
      })
      .filter(
        (row): row is { date: string; volume: number; bestOneRm: number; totalSets: number; notes: string } =>
          Boolean(row)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    return rows.slice(0, 6)
  }, [history, selected])

  const exportSelectedCsv = () => {
    if (!selected || selectedHistoryEntries.length === 0) return
    const rows = [
      ['date', 'volume_kg', 'best_1rm_kg', 'sets', 'notes'],
      ...selectedHistoryEntries.map((row) => [
        row.date,
        String(row.volume),
        String(row.bestOneRm),
        String(row.totalSets),
        row.notes || '',
      ]),
    ]
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fitpulse-${selected.name.replace(/\s+/g, '-').toLowerCase()}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement des exercices...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Redirection vers la connexion...
      </div>
    )
  }

    return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-col lg:flex-row flex-grow">
        <Sidebar
          activeSection="exercises"
          setActiveSection={(section) => {
            router.push(hrefForDashboardSection(section))
          }}
        />
        <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">Exercices</h1>
              <p className="text-sm text-gray-500 mt-1">Bibliothèque complète, stats et favoris.</p>
            </div>
            <button
              onClick={handleAddCustom}
              className="btn-secondary px-4 py-2 text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Exercice custom
            </button>
          </div>

          <div className="space-y-6">
            <div className="card">
              {selected ? (
                <div className="max-w-4xl w-full">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                        <Dumbbell className="h-6 w-6 text-gray-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{selected.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">
                          {selected.tags.join(', ')} · {selected.equipment.join(', ')}
                        </p>
                        {selectedInsights && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-primary-50 text-primary-700 text-xs px-2.5 py-1 font-semibold">
                              Niveau {selectedInsights.level === 'beginner' ? 'débutant' : selectedInsights.level === 'advanced' ? 'avancé' : 'intermédiaire'}
                            </span>
                            {selectedInsights.goals.map((itemGoal) => (
                              <span key={itemGoal} className="rounded-full bg-gray-100 text-gray-700 text-xs px-2.5 py-1 font-medium">
                                {itemGoal === 'strength'
                                  ? 'Force'
                                  : itemGoal === 'hypertrophy'
                                    ? 'Prise de masse'
                                    : itemGoal === 'cardio'
                                      ? 'Cardio'
                                      : itemGoal === 'mobility'
                                        ? 'Mobilité'
                                        : 'Abdominaux'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => toggleFavorite(selected.id)}
                        className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full border ${
                          favorites.includes(selected.id)
                            ? 'border-amber-300 text-amber-600 bg-amber-50'
                            : 'border-gray-200 text-gray-500 bg-white'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${favorites.includes(selected.id) ? 'fill-amber-400' : ''}`} />
                        Favori
                      </button>
                      <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                        <Dumbbell className="h-4 w-4" />
                        Stats perso
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-500">Volume total</div>
                      <div className="text-xl font-semibold text-gray-900">{stats?.totalVolume ?? 0} kg</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-500">1RM estimé</div>
                      <div className="text-xl font-semibold text-gray-900">{stats?.bestOneRm || '—'} kg</div>
                    </div>
                    <div className="rounded-lg border border-gray-200 p-4">
                      <div className="text-xs text-gray-500">Dernière séance</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {stats?.lastDate ? new Date(stats.lastDate).toLocaleDateString('fr-FR') : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-lg border border-gray-200 p-4">
                    <div className="text-xs text-gray-500 mb-3">Progression récente (1RM)</div>
                    {progression.length === 0 ? (
                      <div className="text-sm text-gray-500">Pas encore de données.</div>
                    ) : (
                      <div className="flex items-end gap-2">
                        {progression.map((point) => {
                          const max = Math.max(...progression.map((p) => p.oneRm))
                          const height = max > 0 ? Math.max(20, Math.round((point.oneRm / max) * 80)) : 20
                          return (
                            <div key={point.date} className="flex flex-col items-center gap-2">
                              <div
                                className="w-6 rounded-full bg-primary-500/80"
                                style={{ height }}
                                title={`${point.oneRm} kg`}
                              />
                              <div className="text-[10px] text-gray-400">
                                {new Date(point.date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">Historique récent</div>
                      <button
                        onClick={exportSelectedCsv}
                        disabled={selectedHistoryEntries.length === 0}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 disabled:text-gray-300"
                      >
                        <Download className="h-4 w-4" />
                        Exporter CSV
                      </button>
                    </div>
                    {selectedHistoryEntries.length === 0 ? (
                      <div className="mt-3 text-sm text-gray-500">Aucune séance enregistrée.</div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-left text-xs">
                          <thead className="text-gray-400">
                            <tr>
                              <th className="py-2 pr-4">Date</th>
                              <th className="py-2 pr-4">Volume</th>
                              <th className="py-2 pr-4">1RM</th>
                              <th className="py-2 pr-4">Séries</th>
                              <th className="py-2 pr-4">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="text-gray-700">
                            {selectedHistoryEntries.map((row) => (
                              <tr key={row.date} className="border-t border-gray-100">
                                <td className="py-2 pr-4">
                                  {new Date(row.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td className="py-2 pr-4">{row.volume} kg</td>
                                <td className="py-2 pr-4">{row.bestOneRm || '—'} kg</td>
                                <td className="py-2 pr-4">{row.totalSets}</td>
                                <td className="py-2 pr-4">{row.notes || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    Astuce : clique sur un exercice pour voir ton historique, tes PR et ton volume.
                  </div>

                  {selectedInsights && (
                    <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Sécurité</div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {selectedInsights.safetyTips.map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Erreurs fréquentes</div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {selectedInsights.commonMistakes.map((mistake, index) => (
                            <li key={index}>• {mistake}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Variantes utiles</div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {selectedInsights.variations.map((variation, index) => (
                            <li key={index}>• {variation}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {relatedExercises.length > 0 && (
                    <div className="mt-4 rounded-lg border border-gray-200 p-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Exercices proches</div>
                      <div className="flex flex-wrap gap-2">
                        {relatedExercises.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelected(item)}
                            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            {item.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-10">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-500 mb-4">
                    <Dumbbell className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Sélectionne un exercice</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Clique sur un exercice dans la bibliothèque pour voir ses statistiques.
                  </p>
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Library</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Dumbbell className="h-4 w-4" />
                    Exercices
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <select
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {equipmentOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'all' ? 'Tout matériel' : opt}
                      </option>
                    ))}
                  </select>
                  <select
                    value={muscle}
                    onChange={(e) => setMuscle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {muscleOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'all' ? 'Tous les muscles' : opt}
                      </option>
                    ))}
                    </select>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as 'all' | ExerciseGoal)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    {goalOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'all'
                          ? 'Tous objectifs'
                          : opt === 'strength'
                            ? 'Force'
                            : opt === 'hypertrophy'
                              ? 'Prise de masse'
                              : opt === 'cardio'
                                ? 'Cardio'
                                : opt === 'mobility'
                                  ? 'Mobilité'
                                  : 'Abdominaux'}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Rechercher un exercice"
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => setOnlyFavorites((prev) => !prev)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      onlyFavorites ? 'border-amber-400 text-amber-600' : 'border-gray-300 text-gray-600'
                    }`}
                  >
                    <Star className={`h-4 w-4 ${onlyFavorites ? 'fill-amber-400' : ''}`} />
                    Favoris
                  </button>
                </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white">
                <div className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Tous les exercices
                </div>
                <div className="max-h-[70vh] overflow-y-auto pb-2">
                    {filtered.map((item) => (
                      <div
                        key={item.id}
                        className={`w-full px-4 py-2 transition-colors ${
                          selected?.id === item.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => setSelected(item)}
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="h-11 w-11 rounded-full border border-gray-200 bg-white flex items-center justify-center">
                              <Dumbbell className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                              <div className="text-xs text-gray-500">
                                {item.tags.join(', ')} · {item.equipment[0] || 'Autre'}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => toggleFavorite(item.id)}
                            className={`p-2 rounded-full border ${
                              favorites.includes(item.id)
                                ? 'border-amber-400 text-amber-500'
                                : 'border-gray-200 text-gray-400'
                            }`}
                          >
                            <Star className={`h-4 w-4 ${favorites.includes(item.id) ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500">Aucun exercice trouvé.</div>
                    )}
                </div>
              </div>
          </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
