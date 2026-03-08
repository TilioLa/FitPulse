export type WorkoutHistoryMuscleUse = {
  id: string
  percent: number
}

export type WorkoutExerciseHistory = {
  id: string
  name: string
  notes: string
  sets: { weight: number; reps: number }[]
}

export type WorkoutRecord = {
  id: string
  name: string
  bestOneRm: number
  bestWeight: number
}

export type WorkoutHistoryItem = {
  id: string
  workoutId: string
  workoutName: string
  programId?: string
  programName?: string
  date: string
  duration: number
  calories?: number
  volume?: number
  records?: WorkoutRecord[]
  muscleUsage?: WorkoutHistoryMuscleUse[]
  exercises?: WorkoutExerciseHistory[]
}

export function toLocalDateKey(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function uniqueDays(history: WorkoutHistoryItem[]) {
  const unique = new Map<string, WorkoutHistoryItem>()
  history.forEach((item) => {
    const dayKey = toLocalDateKey(item.date)
    const existing = unique.get(dayKey)
    if (!existing || new Date(item.date).getTime() > new Date(existing.date).getTime()) {
      unique.set(dayKey, item)
    }
  })
  return Array.from(unique.values())
}

function computeStreak(dates: string[]) {
  const daySet = new Set(dates.map((date) => toLocalDateKey(date)))
  const cursor = new Date()
  let streak = 0
  while (true) {
    const key = toLocalDateKey(cursor)
    if (!daySet.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function computeHistoryStats(history: WorkoutHistoryItem[]) {
  const deduped = uniqueDays(history)
  const totalMinutes = deduped.reduce((sum, item) => sum + item.duration, 0)
  const dates = deduped.map((item) => item.date.slice(0, 10))
  const streak = computeStreak(dates)

  return {
    deduped,
    totalMinutes,
    totalWorkouts: deduped.length,
    streak,
  }
}
