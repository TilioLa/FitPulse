import { toLocalDateKey, type WorkoutHistoryItem } from '@/lib/history'

type WeeklyPlanDay = {
  date?: string
  type?: 'training' | 'rest'
}

function buildTrainingIndexes(sessionsPerWeek: number) {
  const count = Math.max(1, Math.min(7, sessionsPerWeek))
  const indexes = new Set<number>()
  for (let i = 0; i < count; i += 1) {
    indexes.add(Math.floor((i * 7) / count) % 7)
  }
  for (let i = 0; indexes.size < count && i < 7; i += 1) {
    indexes.add(i)
  }
  return indexes
}

export function shouldTrainToday(
  settings: Record<string, unknown>,
  now = new Date()
) {
  const plan = Array.isArray(settings.weeklyPlan)
    ? (settings.weeklyPlan as WeeklyPlanDay[])
    : []
  const todayKey = toLocalDateKey(now)

  const exactMatch = plan.find(
    (item) => item?.date && toLocalDateKey(item.date) === todayKey
  )
  if (exactMatch) {
    return exactMatch.type === 'training'
  }

  const sessionsPerWeek = Number(settings.sessionsPerWeek || 0)
  if (!Number.isFinite(sessionsPerWeek) || sessionsPerWeek <= 0) {
    return false
  }

  const weekday = now.getDay() // 0-6
  return buildTrainingIndexes(sessionsPerWeek).has(weekday)
}

export function didWorkoutToday(
  history: WorkoutHistoryItem[],
  now = new Date()
) {
  const todayKey = toLocalDateKey(now)
  return history.some((item) => toLocalDateKey(item.date) === todayKey)
}
