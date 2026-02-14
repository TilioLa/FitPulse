import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'
import type { WorkoutHistoryItem } from '@/lib/history'

const HISTORY_KEY = 'fitpulse_history'

function makeHistoryKey(item: Partial<WorkoutHistoryItem>) {
  return item.id || `${item.workoutId || 'w'}-${item.date || 'd'}-${item.workoutName || 'n'}`
}

function normalizeHistory(input: unknown): WorkoutHistoryItem[] {
  if (!Array.isArray(input)) return []
  return input.filter((item) => typeof item === 'object' && item !== null) as WorkoutHistoryItem[]
}

function mergeHistory(localItems: WorkoutHistoryItem[], remoteItems: WorkoutHistoryItem[]) {
  const merged = new Map<string, WorkoutHistoryItem>()
  for (const item of [...localItems, ...remoteItems]) {
    merged.set(makeHistoryKey(item), item)
  }
  return Array.from(merged.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export function readLocalHistory(): WorkoutHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    return normalizeHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'))
  } catch {
    return []
  }
}

export function writeLocalHistory(items: WorkoutHistoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('fitpulse-history'))
}

export async function persistHistoryForUser(userId: string, items: WorkoutHistoryItem[]) {
  if (!isSupabaseConfigured()) return
  try {
    const supabase = getSupabaseBrowserClient()
    await supabase.from('user_history').upsert(
      {
        user_id: userId,
        history: items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  } catch {
    // keep local fallback if cloud persistence is unavailable
  }
}

export async function syncHistoryForUser(userId: string) {
  if (!isSupabaseConfigured()) return

  const localItems = readLocalHistory()

  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from('user_history')
      .select('history')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      writeLocalHistory(localItems)
      return
    }

    const remoteItems = normalizeHistory(data?.history)
    const merged = mergeHistory(localItems, remoteItems)
    writeLocalHistory(merged)
    await persistHistoryForUser(userId, merged)
  } catch {
    writeLocalHistory(localItems)
  }
}
