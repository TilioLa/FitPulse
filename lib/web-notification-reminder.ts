import type { WorkoutHistoryItem } from '@/lib/history'
import { didWorkoutToday, shouldTrainToday } from '@/lib/reminder-logic'

export function canUseBrowserNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) return 'unsupported' as const
  if (Notification.permission === 'granted') return 'granted' as const
  if (Notification.permission === 'denied') return 'denied' as const
  const permission = await Notification.requestPermission()
  return permission
}

export function sendTestBrowserNotification() {
  if (!canUseBrowserNotifications()) return false
  if (Notification.permission !== 'granted') return false
  new Notification('FitPulse', {
    body: 'Notifications activées. Tu recevras des rappels utiles.',
  })
  return true
}

function wasSentToday(userId: string) {
  const key = `fitpulse_push_reminder_last_${userId}`
  const today = new Date().toISOString().slice(0, 10)
  return localStorage.getItem(key) === today
}

function markSentToday(userId: string) {
  const key = `fitpulse_push_reminder_last_${userId}`
  const today = new Date().toISOString().slice(0, 10)
  localStorage.setItem(key, today)
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

export function maybeSendBrowserWorkoutReminder(input: {
  userId: string
  userName?: string | null
}) {
  if (process.env.NEXT_PUBLIC_ENABLE_WEB_NOTIFICATIONS !== 'true') return
  if (!canUseBrowserNotifications()) return
  if (Notification.permission !== 'granted') return
  if (wasSentToday(input.userId)) return

  const settings = readJsonSafe<Record<string, unknown>>('fitpulse_settings', {})
  if (settings.pushRemindersEnabled === false) return
  if (!shouldTrainToday(settings)) return

  const history = readJsonSafe<WorkoutHistoryItem[]>('fitpulse_history', [])
  if (didWorkoutToday(history)) return

  const name = (input.userName || '').trim()
  new Notification('FitPulse - Séance prévue aujourd’hui', {
    body: name ? `${name}, ta séance t’attend. Garde ta streak.` : 'Ta séance t’attend. Garde ta streak.',
  })
  markSentToday(input.userId)
}
