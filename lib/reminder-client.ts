import { toLocalDateKey, type WorkoutHistoryItem } from '@/lib/history'
import { didWorkoutToday, shouldTrainToday } from '@/lib/reminder-logic'
import { buildAuthenticatedJsonHeaders } from '@/lib/api-auth-headers'

type ReminderUser = {
  id: string
  email: string
  name?: string | null
}

function wasReminderSentToday(userId: string) {
  try {
    return localStorage.getItem(`fitpulse_reminder_last_sent_${userId}`) === toLocalDateKey(new Date())
  } catch {
    return false
  }
}

function markReminderSentToday(userId: string) {
  try {
    localStorage.setItem(`fitpulse_reminder_last_sent_${userId}`, toLocalDateKey(new Date()))
  } catch {
    // ignore storage write failures (private mode, quota, restricted webview)
  }
}

function readJsonSafe<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export async function maybeSendDailyWorkoutReminder(user: ReminderUser) {
  if (typeof window === 'undefined') return
  if (process.env.NEXT_PUBLIC_ENABLE_CLIENT_EMAIL_AUTOMATION !== 'true') return
  if (!user?.email) return
  if (wasReminderSentToday(user.id)) return

  const settings = readJsonSafe<Record<string, unknown>>('fitpulse_settings', {})
  if (settings.reminderEmailsEnabled === false) return
  if (!shouldTrainToday(settings)) return

  const history = readJsonSafe<WorkoutHistoryItem[]>('fitpulse_history', [])
  if (didWorkoutToday(history)) return

  try {
    const headers = await buildAuthenticatedJsonHeaders()
    const response = await fetch('/api/reminders/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to: user.email,
        name: user.name,
      }),
    })
    if (!response.ok) return
    const data = (await response.json().catch(() => ({}))) as { sent?: boolean }
    if (data?.sent) {
      markReminderSentToday(user.id)
    }
  } catch {
    // keep silent on reminder failures
  }
}
