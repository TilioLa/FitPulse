import type { ExerciseGoal } from '@/lib/exercise-insights'

type SexPreference = 'femme' | 'homme' | 'non-binaire' | 'non-renseigne'

export function normalizeSexPreference(value: unknown): SexPreference {
  const raw = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (raw === 'femme') return 'femme'
  if (raw === 'homme') return 'homme'
  if (raw === 'non-binaire' || raw === 'non binaire' || raw === 'nonbinaire') return 'non-binaire'
  return 'non-renseigne'
}

export function profileBiasForSex(value: unknown) {
  const sex = normalizeSexPreference(value)
  if (sex === 'femme') {
    return {
      programGoals: ['tonification', 'perte de poids', 'cardio', 'endurance'],
      programBodyParts: ['jambes', 'fessiers', 'abdos', 'cardio', 'tout le corps'],
      exerciseTags: ['Jambes', 'Fessiers', 'Abdos', 'Cardio'],
      exerciseGoals: ['cardio', 'core'] as ExerciseGoal[],
    }
  }
  if (sex === 'homme') {
    return {
      programGoals: ['force', 'hypertrophie', 'prise de masse'],
      programBodyParts: ['haut du corps', 'bras', 'dos', 'pectoraux', 'tout le corps'],
      exerciseTags: ['Pectoraux', 'Dos', 'Bras', 'Épaules'],
      exerciseGoals: ['strength', 'hypertrophy'] as ExerciseGoal[],
    }
  }
  return {
    programGoals: [] as string[],
    programBodyParts: [] as string[],
    exerciseTags: [] as string[],
    exerciseGoals: [] as ExerciseGoal[],
  }
}
