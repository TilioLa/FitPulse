export type LevelInfo = {
  level: number
  name: string
  minXp: number
  maxXp: number
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Bronze', minXp: 0, maxXp: 299 },
  { level: 2, name: 'Argent', minXp: 300, maxXp: 699 },
  { level: 3, name: 'Or', minXp: 700, maxXp: 1199 },
  { level: 4, name: 'Platine', minXp: 1200, maxXp: 1799 },
  { level: 5, name: 'Diamant', minXp: 1800, maxXp: 2499 },
  { level: 6, name: 'Elite', minXp: 2500, maxXp: 999999 },
]

export function computeXp(totalMinutes: number, totalWorkouts: number) {
  return Math.max(0, Math.round(totalMinutes + totalWorkouts * 20))
}

export function getLevelInfo(xp: number) {
  const current = LEVELS.find((lvl) => xp >= lvl.minXp && xp <= lvl.maxXp) || LEVELS[0]
  const next = LEVELS.find((lvl) => lvl.level === current.level + 1) || null
  const progress = next
    ? Math.min(100, Math.round(((xp - current.minXp) / Math.max(1, next.minXp - current.minXp)) * 100))
    : 100
  return { current, next, progress }
}
