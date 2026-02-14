export type WeeklyPlanDay = {
  date: string
  label: string
  type: 'training' | 'rest'
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
