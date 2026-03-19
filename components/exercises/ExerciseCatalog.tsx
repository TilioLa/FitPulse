'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Star, Dumbbell, History, Shuffle } from 'lucide-react'
import { exerciseCatalog, ExerciseCatalogItem } from '@/data/exercises'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { readLocalExerciseFavorites, saveLocalExerciseFavorites } from '@/lib/exercise-preferences-store'
import {
  readRecentExercises,
  saveRecentExercise,
  searchExercisesWithSynonyms,
  suggestExerciseSubstitutions,
} from '@/lib/exercise-memory'
import { readLocalSettings } from '@/lib/user-state-store'
import { localizeExerciseNameFr } from '@/lib/exercise-name-fr'

export default function ExerciseCatalog({
  onSelect,
}: {
  onSelect?: (exercise: ExerciseCatalogItem) => void
}) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('all')
  const [equipment, setEquipment] = useState('all')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<string[]>(() => readLocalExerciseFavorites())
  const [recentExercises, setRecentExercises] = useState(() => readRecentExercises())
  const [userEquipment, setUserEquipment] = useState<string[]>([])

  useEffect(() => {
    const apply = () => setFavorites(readLocalExerciseFavorites())
    window.addEventListener('fitpulse-exercise-favorites', apply)
    window.addEventListener('fitpulse-settings', apply)
    return () => {
      window.removeEventListener('fitpulse-exercise-favorites', apply)
      window.removeEventListener('fitpulse-settings', apply)
    }
  }, [])

  useEffect(() => {
    const applyRecent = () => setRecentExercises(readRecentExercises())
    const applySettings = () => {
      const settings = readLocalSettings() as { equipment?: string[] }
      setUserEquipment(Array.isArray(settings.equipment) ? settings.equipment : [])
    }
    applyRecent()
    applySettings()
    window.addEventListener('fitpulse-recent-exercises', applyRecent)
    window.addEventListener('fitpulse-settings', applySettings)
    return () => {
      window.removeEventListener('fitpulse-recent-exercises', applyRecent)
      window.removeEventListener('fitpulse-settings', applySettings)
    }
  }, [])

  const tags = useMemo(() => {
    const set = new Set<string>()
    exerciseCatalog.forEach((item) => item.tags.forEach((t) => set.add(t)))
    return ['all', ...Array.from(set)]
  }, [])

  const equipments = useMemo(() => {
    const set = new Set<string>()
    exerciseCatalog.forEach((item) => item.equipment.forEach((t) => set.add(t)))
    return ['all', ...Array.from(set)]
  }, [])

  const filtered = useMemo(() => {
    const byQuery = searchExercisesWithSynonyms(query, exerciseCatalog)
    return byQuery.filter((item) => {
      const matchTag = tag === 'all' || item.tags.includes(tag)
      const matchEquip = equipment === 'all' || item.equipment.includes(equipment)
      const matchFav = !onlyFavorites || favorites.includes(item.id)
      return matchTag && matchEquip && matchFav
    })
  }, [query, tag, equipment, onlyFavorites, favorites])

  const recentItems = useMemo(
    () =>
      recentExercises
        .map((recent) => exerciseCatalog.find((item) => item.id === recent.id))
        .filter(Boolean)
        .slice(0, 4) as ExerciseCatalogItem[],
    [recentExercises]
  )

  const substitutionItems = useMemo(() => {
    if (!query.trim()) return []
    return suggestExerciseSubstitutions(query, userEquipment)
      .filter((item) => !filtered.some((candidate) => candidate.id === item.id))
      .slice(0, 4)
  }, [filtered, query, userEquipment])

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((fav) => fav !== id)
      : [...favorites, id]
    setFavorites(next)
    void saveLocalExerciseFavorites(next, user?.id)
  }

  const handleSelect = (item: ExerciseCatalogItem) => {
    saveRecentExercise({ id: item.id, name: item.name })
    onSelect?.({
      ...item,
      name: localizeExerciseNameFr(item.name),
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un exercice"
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-3 text-sm"
          />
        </div>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-3 text-sm"
        >
          {tags.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'Tous les muscles' : value}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-3 text-sm"
        >
          {equipments.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'Tout matériel' : value}
            </option>
          ))}
        </select>
        <button
          onClick={() => setOnlyFavorites((prev) => !prev)}
          className={`rounded-lg border px-3 py-3 text-sm font-semibold ${
            onlyFavorites ? 'border-amber-400 text-amber-600' : 'border-gray-300 text-gray-600'
          }`}
        >
          Favoris
        </button>
      </div>

      {recentItems.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <History className="h-4 w-4 text-primary-600" />
            Récemment utilisés
          </div>
          <div className="flex flex-wrap gap-2">
            {recentItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary-200 hover:text-primary-700"
              >
                {localizeExerciseNameFr(item.name)}
              </button>
            ))}
          </div>
        </div>
      )}

      {substitutionItems.length > 0 && (
        <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Shuffle className="h-4 w-4 text-primary-600" />
            Substitutions intelligentes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {substitutionItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="rounded-xl border border-primary-100 bg-white px-4 py-3 text-left hover:border-primary-200"
              >
                <div className="text-sm font-semibold text-gray-900">{localizeExerciseNameFr(item.name)}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {item.tags.join(', ')} · {item.equipment.join(', ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((item) => {
          const isFav = favorites.includes(item.id)
          return (
            <div key={item.id} className="rounded-lg border border-gray-200 p-4 active:scale-[0.99] transition-transform">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <Dumbbell className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{localizeExerciseNameFr(item.name)}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{item.tags.join(', ')}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{item.equipment.join(', ')}</div>
                </div>
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className={`p-2 rounded-full border ${
                    isFav ? 'border-amber-400 text-amber-500' : 'border-gray-200 text-gray-400'
                  }`}
                >
                  <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400' : ''}`} />
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleSelect(item)}
                  className="min-h-11 px-4 rounded-lg border border-primary-200 text-sm font-semibold text-primary-700 hover:bg-primary-50"
                >
                  Ajouter
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
