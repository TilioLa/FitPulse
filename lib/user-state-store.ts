import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'

export const SETTINGS_KEY = 'fitpulse_settings'
export const CURRENT_WORKOUT_KEY = 'fitpulse_current_workout'
export const CUSTOM_ROUTINES_KEY = 'fitpulse_custom_routines'
export const PROGRESS_STATE_KEY = '__progress_state_v1'

const PROGRESS_EXACT_KEYS = ['fitpulse_program_overrides']
const PROGRESS_PREFIX_KEYS = [
  'fitpulse_last_exercise_index_',
  'fitpulse_superset_',
  'fitpulse_sessions_per_week_',
]

export function markProgressDirty() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('fitpulse-progress'))
}

type UserStateRow = {
  user_id: string
  settings: Record<string, unknown> | null
  current_workout: Record<string, unknown> | null
  custom_routines: Record<string, unknown>[] | null
  updated_at?: string
}

let cloudStateDisabled = false

function shouldUseCloudState() {
  if (cloudStateDisabled) return false
  if (typeof window === 'undefined') return true
  return localStorage.getItem('fitpulse_disable_cloud_state') !== 'true'
}

function disableCloudStateSync() {
  cloudStateDisabled = true
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('fitpulse_disable_cloud_state', 'true')
    } catch {
      // ignore localStorage write failures
    }
  }
}

function isMissingUserStateTable(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const status = Number((error as { status?: number }).status)
  const code = String((error as { code?: string }).code || '')
  const message = String((error as { message?: string }).message || '')
  if (status === 404) return true
  if (code.toUpperCase().startsWith('PGRST')) return true
  return /user_state|relation .*user_state.*does not exist|404/i.test(message)
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

function mergeObjects<T extends Record<string, unknown>>(remote: T, local: T): T {
  return { ...remote, ...local }
}

function mergeRoutines(remote: Record<string, unknown>[], local: Record<string, unknown>[]) {
  const byId = new Map<string, Record<string, unknown>>()
  for (const item of [...remote, ...local]) {
    const id = String(item?.id || '')
    if (!id) continue
    byId.set(id, item)
  }
  return Array.from(byId.values())
}

export function readLocalSettings() {
  return readJson<Record<string, unknown>>(SETTINGS_KEY, {})
}

export function writeLocalSettings(settings: Record<string, unknown>) {
  const existing = readJson<Record<string, unknown>>(SETTINGS_KEY, {})
  const existingProgress = existing[PROGRESS_STATE_KEY]
  const nextSettings =
    existingProgress && !Object.prototype.hasOwnProperty.call(settings, PROGRESS_STATE_KEY)
      ? { ...settings, [PROGRESS_STATE_KEY]: existingProgress }
      : settings
  writeJson(SETTINGS_KEY, nextSettings)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-settings'))
  }
}

export function readLocalCurrentWorkout() {
  return readJson<Record<string, unknown> | null>(CURRENT_WORKOUT_KEY, null)
}

export function writeLocalCurrentWorkout(workout: Record<string, unknown> | null) {
  if (typeof window === 'undefined') return
  if (!workout) {
    localStorage.removeItem(CURRENT_WORKOUT_KEY)
  } else {
    writeJson(CURRENT_WORKOUT_KEY, workout)
  }
  window.dispatchEvent(new Event('fitpulse-current-workout'))
}

export function readLocalCustomRoutines() {
  return readJson<Record<string, unknown>[]>(CUSTOM_ROUTINES_KEY, [])
}

export function writeLocalCustomRoutines(routines: Record<string, unknown>[]) {
  writeJson(CUSTOM_ROUTINES_KEY, routines)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('fitpulse-custom-routines'))
  }
}

export function readLocalProgressState(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const state: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) continue
      const matchesExact = PROGRESS_EXACT_KEYS.includes(key)
      const matchesPrefix = PROGRESS_PREFIX_KEYS.some((prefix) => key.startsWith(prefix))
      if (!matchesExact && !matchesPrefix) continue
      const value = localStorage.getItem(key)
      if (value == null) continue
      state[key] = value
    }
  } catch {
    return {}
  }
  return state
}

export function writeLocalProgressState(state: Record<string, string>) {
  if (typeof window === 'undefined') return
  try {
    for (const [key, value] of Object.entries(state)) {
      if (!key) continue
      const existing = localStorage.getItem(key)
      if (existing === value) continue
      localStorage.setItem(key, value)
    }
  } catch {
    // ignore localStorage write errors
  }
}

async function upsertUserState(userId: string, patch: Partial<UserStateRow>) {
  if (!shouldUseCloudState()) return
  if (!isSupabaseConfigured()) return
  try {
    const supabase = getSupabaseBrowserClient()
    const { error } = await supabase.from('user_state').upsert(
      {
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...patch,
      },
      { onConflict: 'user_id' }
    )
    if (error && isMissingUserStateTable(error)) {
      disableCloudStateSync()
    }
  } catch {
    // local fallback only
  }
}

export async function persistSettingsForUser(userId: string, settings: Record<string, unknown>) {
  await upsertUserState(userId, { settings })
}

export async function persistCurrentWorkoutForUser(
  userId: string,
  workout: Record<string, unknown> | null
) {
  await upsertUserState(userId, { current_workout: workout })
}

export async function persistCustomRoutinesForUser(
  userId: string,
  routines: Record<string, unknown>[]
) {
  await upsertUserState(userId, { custom_routines: routines })
}

export async function persistProgressStateForUser(userId: string) {
  const localSettings = readLocalSettings()
  const localProgress = readLocalProgressState()
  const nextSettings = {
    ...localSettings,
    [PROGRESS_STATE_KEY]: localProgress,
  }
  writeLocalSettings(nextSettings)
  await upsertUserState(userId, { settings: nextSettings })
}

export async function syncUserStateForUser(userId: string) {
  if (!shouldUseCloudState()) return
  if (!isSupabaseConfigured()) return
  const localSettings = readLocalSettings()
  const localWorkout = readLocalCurrentWorkout()
  const localRoutines = readLocalCustomRoutines()
  const localProgress = readLocalProgressState()

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('user_state')
      .select('settings,current_workout,custom_routines')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      if (isMissingUserStateTable(error)) {
        disableCloudStateSync()
      }
      return
    }

    const remoteSettings = (data?.settings || {}) as Record<string, unknown>
    const remoteProgress =
      (remoteSettings[PROGRESS_STATE_KEY] as Record<string, string> | undefined) || {}
    const remoteWorkout = (data?.current_workout || null) as Record<string, unknown> | null
    const remoteRoutines = (data?.custom_routines || []) as Record<string, unknown>[]

    const mergedProgress = { ...remoteProgress, ...localProgress }
    const mergedSettings = {
      ...mergeObjects(remoteSettings, localSettings),
      [PROGRESS_STATE_KEY]: mergedProgress,
    }
    const mergedWorkout = localWorkout || remoteWorkout
    const mergedRoutines = mergeRoutines(remoteRoutines, localRoutines)

    writeLocalSettings(mergedSettings)
    writeLocalProgressState(mergedProgress)
    writeLocalCurrentWorkout(mergedWorkout)
    writeLocalCustomRoutines(mergedRoutines)

    await upsertUserState(userId, {
      settings: mergedSettings,
      current_workout: mergedWorkout,
      custom_routines: mergedRoutines,
    })
  } catch {
    // keep local data if cloud sync fails
  }
}
