import { Program } from '@/data/programs'

type RecommendationInput = {
  level?: string
  goals?: string[]
  equipment?: string[]
  sessionsPerWeek?: number
  historyProgramIds?: string[]
  recentProgramId?: string | null
  sex?: 'femme' | 'homme' | 'non-binaire' | 'non-renseigne' | string
  focusZones?: string[]
  avoidZones?: string[]
  trainingContext?: 'maison' | 'salle' | 'mixte' | string
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

export function rankPrograms(programs: Program[], input: RecommendationInput): RecommendationResult[] {
  if (!programs.length) return []

  const level = normalize(input.level || '')
  const goals = (input.goals || []).map(normalize).filter(Boolean)
  const equipment = (input.equipment || []).map(normalize).filter(Boolean)
  const sessions = Number(input.sessionsPerWeek || 0)
  const historyProgramIds = (input.historyProgramIds || []).filter(Boolean)
  const recentProgramId = input.recentProgramId || null
  const focusZones = (input.focusZones || []).map(normalize).filter(Boolean)
  const avoidZones = (input.avoidZones || []).map(normalize).filter(Boolean)
  const trainingContext = normalize(String(input.trainingContext || 'mixte'))
  const sex = normalize(String(input.sex || 'non-renseigne'))

  const ranked = programs.map((program) => {
    let score = 0
    const reasons: string[] = []
    const programLevel = normalize(program.level)
    const programEquipment = normalize(program.equipment)
    const programGoals = program.goals.map(normalize)
    const programBodyParts = (program.bodyParts || []).map(normalize)

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
    if (trainingContext === 'maison' && !programEquipment.includes('machines')) {
      score += 2
      reasons.push('adapté maison')
    }
    if (trainingContext === 'salle' && (programEquipment.includes('machines') || programEquipment.includes('barres'))) {
      score += 2
      reasons.push('adapté salle')
    }

    if (sessions > 0) {
      const diff = Math.abs(program.sessionsPerWeek - sessions)
      score += Math.max(0, 3 - diff)
      if (diff <= 1) reasons.push('rythme hebdo proche')
    }

    if (historyProgramIds.includes(program.id)) {
      score -= 2
      reasons.push('déjà commencé')
    }

    if (recentProgramId && recentProgramId === program.id) {
      score -= 1
    }

    if (program.recommended) score += 1

    const focusHits = focusZones.filter((zone) => programBodyParts.some((part) => part.includes(zone))).length
    if (focusHits > 0) {
      score += focusHits * 2
      reasons.push('zones ciblées prises en compte')
    }
    const avoidHits = avoidZones.filter((zone) => programBodyParts.some((part) => part.includes(zone))).length
    if (avoidHits > 0) {
      score -= avoidHits * 3
      reasons.push('zones à éviter prises en compte')
    }

    if (sex === 'femme' && programBodyParts.some((part) => part.includes('jambes') || part.includes('fessiers') || part.includes('abdos'))) {
      score += 1
      reasons.push('profil adapté')
    }
    if (sex === 'homme' && programBodyParts.some((part) => part.includes('dos') || part.includes('bras') || part.includes('pectoraux'))) {
      score += 1
      reasons.push('profil adapté')
    }

    return { program, score, reasons: Array.from(new Set(reasons)) }
  })

  ranked.sort((a, b) => b.score - a.score)
  return ranked
}

export function recommendProgram(programs: Program[], input: RecommendationInput): RecommendationResult | null {
  const ranked = rankPrograms(programs, input)
  return ranked[0] || null
}
