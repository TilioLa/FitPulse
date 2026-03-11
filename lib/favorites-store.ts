const PROGRAM_FAVORITES_KEY = 'fitpulse_program_favorites'
const ROUTINE_FAVORITES_KEY = 'fitpulse_routine_favorites'

function readJsonSafe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJsonSafe<T>(key: string, value: T) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

export function readLocalProgramFavorites() {
  return readJsonSafe<string[]>(PROGRAM_FAVORITES_KEY, [])
}

export function writeLocalProgramFavorites(ids: string[]) {
  writeJsonSafe(PROGRAM_FAVORITES_KEY, ids)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-program-favorites'))
  }
}

export function readLocalRoutineFavorites() {
  return readJsonSafe<string[]>(ROUTINE_FAVORITES_KEY, [])
}

export function writeLocalRoutineFavorites(ids: string[]) {
  writeJsonSafe(ROUTINE_FAVORITES_KEY, ids)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-routine-favorites'))
  }
}
