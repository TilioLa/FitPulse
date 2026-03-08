import { Program } from '@/data/programs'

type RecommendationInput = {
  level?: string
  goals?: string[]
  equipment?: string[]
  sessionsPerWeek?: number
}

type RecommendationResult = {
  program: Program
  score: number
  reasons: string[]
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function goalMatches(userGoal: string, programGoal: string) {
  const u = normalize(userGoal)
  const p = normalize(programGoal)
  if (u.includes('prise de masse') && (p.includes('hypertrophie') || p.includes('force'))) return true
  if (u.includes('cardio') && (p.includes('endurance') || p.includes('tonification'))) return true
  if (u.includes('seche') && (p.includes('tonification') || p.includes('endurance'))) return true
  if (u.includes('perte de poids') && (p.includes('tonification') || p.includes('endurance'))) return true
  return p.includes(u) || u.includes(p)
}

export function recommendProgram(programs: Program[], input: RecommendationInput): RecommendationResult | null {
  if (!programs.length) return null

  const level = normalize(input.level || '')
  const goals = (input.goals || []).map(normalize).filter(Boolean)
  const equipment = (input.equipment || []).map(normalize).filter(Boolean)
  const sessions = Number(input.sessionsPerWeek || 0)

  const ranked = programs.map((program) => {
    let score = 0
    const reasons: string[] = []
    const programLevel = normalize(program.level)
    const programEquipment = normalize(program.equipment)
    const programGoals = program.goals.map(normalize)

    if (level && programLevel.includes(level)) {
      score += 3
      reasons.push('niveau adapté')
    }

    const goalHits = goals.filter((goal) => programGoals.some((pg) => goalMatches(goal, pg))).length
    if (goalHits > 0) {
      score += goalHits * 2
      reasons.push('objectif(s) aligné(s)')
    }

    if (equipment.length > 0 && equipment.some((eq) => programEquipment.includes(eq))) {
      score += 4
      reasons.push('matériel compatible')
    }

    if (sessions > 0) {
      const diff = Math.abs(program.sessionsPerWeek - sessions)
      score += Math.max(0, 3 - diff)
      if (diff <= 1) reasons.push('rythme hebdo proche')
    }

    if (program.recommended) score += 1

    return { program, score, reasons }
  })

  ranked.sort((a, b) => b.score - a.score)
  const best = ranked[0]
  return best ? { ...best, reasons: Array.from(new Set(best.reasons)) } : null
}
