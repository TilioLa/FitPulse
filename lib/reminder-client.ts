import { toLocalDateKey, type WorkoutHistoryItem } from '@/lib/history'
import { didWorkoutToday, shouldTrainToday } from '@/lib/reminder-logic'

type ReminderUser = {
  id: string
  email: string
  name?: string | null
}

function wasReminderSentToday(userId: string) {
  return localStorage.getItem(`fitpulse_reminder_last_sent_${userId}`) === toLocalDateKey(new Date())
}

function markReminderSentToday(userId: string) {
  localStorage.setItem(`fitpulse_reminder_last_sent_${userId}`, toLocalDateKey(new Date()))
}

export async function maybeSendDailyWorkoutReminder(user: ReminderUser) {
  if (typeof window === 'undefined') return
  if (process.env.NEXT_PUBLIC_ENABLE_CLIENT_EMAIL_AUTOMATION !== 'true') return
  if (!user?.email) return
  if (wasReminderSentToday(user.id)) return

  const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}') as Record<string, unknown>
  if (settings.reminderEmailsEnabled === false) return
  if (!shouldTrainToday(settings)) return

  const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as WorkoutHistoryItem[]
  if (didWorkoutToday(history)) return

  try {
    const response = await fetch('/api/reminders/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
