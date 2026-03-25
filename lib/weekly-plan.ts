export type WeeklyPlanDay = {
  date: string
  label: string
  type: 'training' | 'rest'
}

function toDayKey(value: string | Date) {
  const d = typeof value === 'string' ? new Date(value) : value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildTrainingIndexes(sessionsPerWeek: number) {
  const count = Math.max(1, Math.min(7, sessionsPerWeek))
  const indexes = new Set<number>()
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor((i * 7) / count) % 7
    indexes.add(idx)
  }
  // Safety if rounding produced fewer indexes.
  for (let i = 0; indexes.size < count && i < 7; i += 1) {
    indexes.add(i)
  }
  return indexes
}

export function generateWeeklyPlan(
  sessionsPerWeek: number,
  startDate = new Date(),
  locale = 'fr-FR'
): WeeklyPlanDay[] {
  const trainingIndexes = buildTrainingIndexes(sessionsPerWeek)
  const days: WeeklyPlanDay[] = []
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    days.push({
      date: d.toISOString(),
      label: d.toLocaleDateString(locale, { weekday: 'short' }),
      type: trainingIndexes.has(i) ? 'training' : 'rest',
    })
  }
  return days
}

export function generateAdaptiveWeeklyPlan(
  sessionsPerWeek: number,
  completedDates: Array<string | Date>,
  startDate = new Date(),
  locale = 'fr-FR'
): WeeklyPlanDay[] {
  const target = Math.max(1, Math.min(7, sessionsPerWeek))
  const weekAgo = new Date(startDate)
  weekAgo.setDate(startDate.getDate() - 7)
  const recent = completedDates.filter((value) => new Date(value).getTime() >= weekAgo.getTime())
  const completedCount = new Set(recent.map((value) => toDayKey(value))).size
  const missed = Math.max(0, target - completedCount)
  const adaptiveTarget = Math.min(7, target + Math.min(2, missed))
  return generateWeeklyPlan(adaptiveTarget, startDate, locale)
}
