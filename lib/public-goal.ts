export type PublicGoalMetric = 'volume' | 'pr'

export type PublicGoalSettings = {
  metric: PublicGoalMetric
  target: number
}

function keyForSlug(slug: string) {
  return `fitpulse_public_goal_${slug}`
}

export function readPublicGoal(slug: string): PublicGoalSettings | null {
  if (typeof window === 'undefined' || !slug) return null
  try {
    const raw = JSON.parse(localStorage.getItem(keyForSlug(slug)) || 'null') as PublicGoalSettings | null
    if (!raw) return null
    const metric: PublicGoalMetric = raw.metric === 'pr' ? 'pr' : 'volume'
    const target = Number(raw.target)
    if (!Number.isFinite(target) || target <= 0) return null
    return { metric, target }
  } catch {
    return null
  }
}

export function writePublicGoal(slug: string, goal: PublicGoalSettings) {
  if (typeof window === 'undefined' || !slug) return
  localStorage.setItem(keyForSlug(slug), JSON.stringify(goal))
}
