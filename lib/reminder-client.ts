import { toLocalDateKey, type WorkoutHistoryItem } from '@/lib/history'

type ReminderUser = {
  id: string
  email: string
  name?: string | null
}

type WeeklyPlanDay = {
  id?: string
  day?: string
  shouldTrain?: boolean
}

function todayLabelFr() {
  const labels = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  return labels[new Date().getDay()]
}

function shouldTrainTodayFromSettings(settings: Record<string, unknown>) {
  const weeklyPlan = (settings.weeklyPlan || []) as WeeklyPlanDay[]
  if (!Array.isArray(weeklyPlan) || weeklyPlan.length === 0) return false
  const today = todayLabelFr()
  return weeklyPlan.some((day) => {
    const name = String(day.day || '').toLowerCase()
    return day.shouldTrain === true && name.includes(today)
  })
}

function wasReminderSentToday(userId: string) {
  return localStorage.getItem(`fitpulse_reminder_last_sent_${userId}`) === toLocalDateKey(new Date())
}

function markReminderSentToday(userId: string) {
  localStorage.setItem(`fitpulse_reminder_last_sent_${userId}`, toLocalDateKey(new Date()))
}

export async function maybeSendDailyWorkoutReminder(user: ReminderUser) {
  if (typeof window === 'undefined') return
  if (!user?.email) return
  if (wasReminderSentToday(user.id)) return

  const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}') as Record<string, unknown>
  if (settings.reminderEmailsEnabled === false) return
  if (!shouldTrainTodayFromSettings(settings)) return

  const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as WorkoutHistoryItem[]
  const todayKey = toLocalDateKey(new Date())
  const hasWorkoutToday = history.some((item) => toLocalDateKey(item.date) === todayKey)
  if (hasWorkoutToday) return

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
