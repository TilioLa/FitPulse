import type { ExerciseCatalogItem } from '@/data/exercises'
import { persistSettingsForUser, readLocalSettings, writeLocalSettings } from '@/lib/user-state-store'

const CUSTOM_EXERCISES_KEY = 'fitpulse_custom_exercises'
const EXERCISE_FAVORITES_KEY = 'fitpulse_exercise_favorites'

type SettingsWithExercisePrefs = {
  customExercises?: ExerciseCatalogItem[]
  exerciseFavorites?: string[]
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

function getSettingsExercisePrefs() {
  const settings = readLocalSettings() as SettingsWithExercisePrefs
  const customExercises = Array.isArray(settings.customExercises) ? settings.customExercises : []
  const exerciseFavorites = Array.isArray(settings.exerciseFavorites) ? settings.exerciseFavorites : []
  return { customExercises, exerciseFavorites }
}

async function persistExercisePrefsInSettings(
  userId: string | undefined,
  customExercises: ExerciseCatalogItem[],
  exerciseFavorites: string[]
) {
  const baseSettings = readLocalSettings()
  const nextSettings = {
    ...baseSettings,
    customExercises,
    exerciseFavorites,
  }
  writeLocalSettings(nextSettings)
  if (userId) {
    await persistSettingsForUser(userId, nextSettings)
  }
}

export function readLocalCustomExercises() {
  const local = readJson<ExerciseCatalogItem[]>(CUSTOM_EXERCISES_KEY, [])
  if (local.length > 0) return local
  return getSettingsExercisePrefs().customExercises
}

export function readLocalExerciseFavorites() {
  const local = readJson<string[]>(EXERCISE_FAVORITES_KEY, [])
  if (local.length > 0) return local
  return getSettingsExercisePrefs().exerciseFavorites
}

export async function saveLocalCustomExercises(items: ExerciseCatalogItem[], userId?: string) {
  writeJson(CUSTOM_EXERCISES_KEY, items)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-custom-exercises'))
  }
  const favorites = readLocalExerciseFavorites()
  await persistExercisePrefsInSettings(userId, items, favorites)
}

export async function saveLocalExerciseFavorites(ids: string[], userId?: string) {
  const normalized = Array.from(new Set(ids))
  writeJson(EXERCISE_FAVORITES_KEY, normalized)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-exercise-favorites'))
  }
  const customExercises = readLocalCustomExercises()
  await persistExercisePrefsInSettings(userId, customExercises, normalized)
}
