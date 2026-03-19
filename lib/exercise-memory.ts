import { exerciseCatalog, type ExerciseCatalogItem } from '@/data/exercises'
import { localizeExerciseNameFr } from '@/lib/exercise-name-fr'

const RECENT_EXERCISES_KEY = 'fitpulse_recent_exercises_v1'

type RecentExercise = {
  id: string
  name: string
  usedAt: string
  count: number
}

const exerciseSynonyms: Record<string, string[]> = {
  pompes: ['push up', 'push-up', 'bench press', 'chest press'],
  squat: ['leg press', 'hack squat', 'goblet squat'],
  rowing: ['row', 'tirage', 'lat pulldown'],
  tirage: ['row', 'rowing', 'lat pulldown'],
  abdos: ['core', 'crunch', 'plank'],
  gainage: ['plank', 'core'],
  epaules: ['shoulders', 'press', 'lateral raise'],
  jambes: ['legs', 'quadriceps', 'hamstrings'],
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function readRecentExercises(): RecentExercise[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_EXERCISES_KEY) || '[]') as RecentExercise[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRecentExercise(item: Pick<RecentExercise, 'id' | 'name'>) {
  if (typeof window === 'undefined') return
  const existing = readRecentExercises()
  const current = existing.find((entry) => entry.id === item.id)
  const next = [
    {
      id: item.id,
      name: item.name,
      usedAt: new Date().toISOString(),
      count: (current?.count || 0) + 1,
    },
    ...existing.filter((entry) => entry.id !== item.id),
  ].slice(0, 8)
  localStorage.setItem(RECENT_EXERCISES_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event('fitpulse-recent-exercises'))
}

export function searchExercisesWithSynonyms(query: string, items: ExerciseCatalogItem[]) {
  const term = normalize(query)
  if (!term) return items
  const expandedTerms = new Set([term])
  Object.entries(exerciseSynonyms).forEach(([key, values]) => {
    if (term.includes(key) || key.includes(term)) {
      values.forEach((value) => expandedTerms.add(normalize(value)))
    }
  })
  return items.filter((item) => {
    const haystack = `${item.name} ${localizeExerciseNameFr(item.name)} ${item.tags.join(' ')} ${item.equipment.join(' ')}`.toLowerCase()
    return Array.from(expandedTerms).some((value) => haystack.includes(value))
  })
}

export function suggestExerciseSubstitutions(
  exerciseName: string,
  availableEquipment: string[] = []
) {
  const term = normalize(exerciseName)
  const preferred = availableEquipment.map(normalize)
  const source = exerciseCatalog.filter((item) => {
    const label = normalize(item.name)
    const tags = item.tags.map(normalize)
    return (
      label.includes(term) ||
      term.includes(label) ||
      tags.some((tag) => term.includes(tag) || tag.includes(term))
    )
  })
  const ranked = source
    .map((item) => {
      const equipmentScore = item.equipment.some((equipment) =>
        preferred.some((pref) => normalize(equipment).includes(pref))
      )
        ? 2
        : 0
      return { item, score: equipmentScore + (normalize(item.name).includes(term) ? 2 : 1) }
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
  return ranked.slice(0, 4)
}
