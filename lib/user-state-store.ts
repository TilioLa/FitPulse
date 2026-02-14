import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'

export const SETTINGS_KEY = 'fitpulse_settings'
export const CURRENT_WORKOUT_KEY = 'fitpulse_current_workout'
export const CUSTOM_ROUTINES_KEY = 'fitpulse_custom_routines'

type UserStateRow = {
  user_id: string
  settings: Record<string, unknown> | null
  current_workout: Record<string, unknown> | null
  custom_routines: Record<string, unknown>[] | null
  updated_at?: string
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
  writeJson(SETTINGS_KEY, settings)
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

async function upsertUserState(userId: string, patch: Partial<UserStateRow>) {
  if (!isSupabaseConfigured()) return
  try {
    const supabase = getSupabaseBrowserClient()
    await supabase.from('user_state').upsert(
      {
        user_id: userId,
        updated_at: new Date().toISOString(),
        ...patch,
      },
      { onConflict: 'user_id' }
    )
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

export async function syncUserStateForUser(userId: string) {
  if (!isSupabaseConfigured()) return
  const localSettings = readLocalSettings()
  const localWorkout = readLocalCurrentWorkout()
  const localRoutines = readLocalCustomRoutines()

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('user_state')
      .select('settings,current_workout,custom_routines')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) return

    const remoteSettings = (data?.settings || {}) as Record<string, unknown>
    const remoteWorkout = (data?.current_workout || null) as Record<string, unknown> | null
    const remoteRoutines = (data?.custom_routines || []) as Record<string, unknown>[]

    const mergedSettings = mergeObjects(remoteSettings, localSettings)
    const mergedWorkout = localWorkout || remoteWorkout
    const mergedRoutines = mergeRoutines(remoteRoutines, localRoutines)

    writeLocalSettings(mergedSettings)
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
