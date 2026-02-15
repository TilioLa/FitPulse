import type { ExerciseCatalogItem } from '@/data/exercises'

export type ExerciseLevel = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseGoal = 'strength' | 'hypertrophy' | 'cardio' | 'mobility' | 'core'

export type ExerciseInsights = {
  level: ExerciseLevel
  goals: ExerciseGoal[]
  safetyTips: string[]
  commonMistakes: string[]
  variations: string[]
}

function toKey(item: ExerciseCatalogItem) {
  return `${item.name} ${item.tags.join(' ')} ${item.equipment.join(' ')}`.toLowerCase()
}

function deriveLevel(item: ExerciseCatalogItem): ExerciseLevel {
  const key = toKey(item)
  const equipment = item.equipment.map((value) => value.toLowerCase())

  if (
    key.includes('pistol') ||
    key.includes('snatch') ||
    key.includes('clean') ||
    key.includes('muscle up') ||
    key.includes('weighted') ||
    equipment.includes('barbell')
  ) {
    return 'advanced'
  }

  if (
    equipment.includes('machine') ||
    equipment.includes('smith machine') ||
    equipment.includes('assisted') ||
    equipment.includes('bodyweight')
  ) {
    return 'beginner'
  }

  return 'intermediate'
}

function deriveGoals(item: ExerciseCatalogItem): ExerciseGoal[] {
  const tags = item.tags.map((tag) => tag.toLowerCase())
  const goals = new Set<ExerciseGoal>()

  if (tags.includes('cardio')) goals.add('cardio')
  if (tags.includes('abdominals') || tags.includes('core') || tags.includes('lower back')) goals.add('core')
  if (tags.includes('full body')) {
    goals.add('hypertrophy')
    goals.add('cardio')
  }

  const hasStrengthMuscle = tags.some((tag) =>
    ['chest', 'quadriceps', 'hamstrings', 'glutes', 'upper back', 'shoulders', 'triceps', 'biceps'].includes(tag)
  )
  if (hasStrengthMuscle) {
    goals.add('strength')
    goals.add('hypertrophy')
  }

  const key = toKey(item)
  if (key.includes('stretch') || key.includes('mobility')) goals.add('mobility')

  if (goals.size === 0) goals.add('hypertrophy')
  return Array.from(goals)
}

export function getExerciseInsights(item: ExerciseCatalogItem): ExerciseInsights {
  const key = toKey(item)
  const goals = deriveGoals(item)

  let safetyTips = [
    'Commence avec une charge que tu peux contrôler sur toute l’amplitude.',
    'Garde un tempo stable et respire pendant la série.',
  ]

  let commonMistakes = [
    'Accélérer la descente et perdre le contrôle du mouvement.',
    'Choisir une charge trop lourde qui dégrade la technique.',
  ]

  if (key.includes('squat') || key.includes('lunge')) {
    safetyTips = [
      'Garde le pied entier au sol et les genoux alignés avec les orteils.',
      'Maintiens le buste gainé pendant toute la répétition.',
    ]
    commonMistakes = [
      'Genoux qui rentrent vers l’intérieur en phase de poussée.',
      'Amplitude écourtée sans contrôle en bas du mouvement.',
    ]
  } else if (key.includes('deadlift') || key.includes('row')) {
    safetyTips = [
      'Maintiens le dos neutre et serre les omoplates avant de tirer.',
      'Rapproche la charge du corps pour limiter le stress lombaire.',
    ]
    commonMistakes = [
      'Arrondir le bas du dos en fin de série.',
      'Tirer uniquement avec les bras sans engager le dos.',
    ]
  } else if (key.includes('press') || key.includes('push') || key.includes('dip')) {
    safetyTips = [
      'Stabilise les épaules en gardant les omoplates actives.',
      'Verrouille la position du tronc pour éviter la cambrure excessive.',
    ]
    commonMistakes = [
      'Descendre trop vite et perdre la trajectoire du mouvement.',
      'Compensation du bas du dos sur les charges lourdes.',
    ]
  } else if (key.includes('curl') || key.includes('extension')) {
    safetyTips = [
      'Garde les coudes fixes et proches du corps.',
      'Favorise une amplitude complète sans élan.',
    ]
    commonMistakes = [
      'Balancer le buste pour terminer la répétition.',
      'Travailler en demi-amplitude avec une charge trop lourde.',
    ]
  } else if (key.includes('plank') || key.includes('ab') || key.includes('crunch')) {
    safetyTips = [
      'Contracte les abdos et les fessiers pour protéger les lombaires.',
      'Respire de manière régulière sans bloquer la cage thoracique.',
    ]
    commonMistakes = [
      'Cambrer le bas du dos en fin de série.',
      'Négliger le placement du bassin et des épaules.',
    ]
  } else if (key.includes('cardio') || key.includes('bike') || key.includes('ropes')) {
    safetyTips = [
      'Monte progressivement l’intensité sur les premières minutes.',
      'Reste hydraté et garde un rythme respiratoire maîtrisé.',
    ]
    commonMistakes = [
      'Partir trop fort puis chuter brutalement en intensité.',
      'Ignorer la récupération active entre les intervalles.',
    ]
  }

  const variations: string[] = []
  if (item.equipment.some((value) => value.toLowerCase().includes('barbell'))) {
    variations.push('Variante haltères pour travailler la stabilité unilatérale.')
    variations.push('Variante machine pour mieux isoler si fatigue élevée.')
  } else if (item.equipment.some((value) => value.toLowerCase().includes('dumbbell'))) {
    variations.push('Variante barre pour charger plus lourd en cycle force.')
    variations.push('Variante poulie pour une tension continue.')
  } else if (item.equipment.some((value) => value.toLowerCase().includes('machine'))) {
    variations.push('Variante libre (barre/haltères) pour recruter davantage de stabilisateurs.')
    variations.push('Variante assistée légère pour travailler la technique.')
  } else {
    variations.push('Variante avec tempo lent (3 sec descente) pour plus de contrôle.')
    variations.push('Variante avec charge externe légère pour progresser graduellement.')
  }

  if (goals.includes('mobility')) {
    variations.unshift('Version amplitude réduite puis progression semaine après semaine.')
  }

  return {
    level: deriveLevel(item),
    goals,
    safetyTips,
    commonMistakes,
    variations: variations.slice(0, 3),
  }
}
