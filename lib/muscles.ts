export type ExerciseMuscle = {
  id:
    | 'chest'
    | 'shoulders'
    | 'biceps'
    | 'triceps'
    | 'back'
    | 'core'
    | 'glutes'
    | 'quads'
    | 'hamstrings'
    | 'calves'
  intensity: 1 | 2 | 3
}

const rules: Array<{
  keys: string[]
  muscles: ExerciseMuscle[]
}> = [
  { keys: ['pompe', 'developpe', 'presse poitrine', 'pec'], muscles: [
    { id: 'chest', intensity: 3 },
    { id: 'triceps', intensity: 2 },
    { id: 'shoulders', intensity: 2 },
  ] },
  { keys: ['row', 'rowing', 'tirage', 'traction', 'pull'], muscles: [
    { id: 'back', intensity: 3 },
    { id: 'biceps', intensity: 2 },
    { id: 'shoulders', intensity: 1 },
  ] },
  { keys: ['shoulder', 'epaules', 'developpe epaules'], muscles: [
    { id: 'shoulders', intensity: 3 },
    { id: 'triceps', intensity: 2 },
  ] },
  { keys: ['curl biceps', 'biceps'], muscles: [
    { id: 'biceps', intensity: 3 },
  ] },
  { keys: ['triceps', 'extension triceps', 'kickback'], muscles: [
    { id: 'triceps', intensity: 3 },
  ] },
  { keys: ['squat', 'presse', 'hack squat'], muscles: [
    { id: 'quads', intensity: 3 },
    { id: 'glutes', intensity: 2 },
  ] },
  { keys: ['fente', 'lunge'], muscles: [
    { id: 'quads', intensity: 2 },
    { id: 'glutes', intensity: 2 },
    { id: 'hamstrings', intensity: 1 },
  ] },
  { keys: ['deadlift', 'souleve de terre'], muscles: [
    { id: 'hamstrings', intensity: 3 },
    { id: 'glutes', intensity: 3 },
    { id: 'back', intensity: 2 },
  ] },
  { keys: ['hip thrust', 'pont fessier'], muscles: [
    { id: 'glutes', intensity: 3 },
    { id: 'hamstrings', intensity: 2 },
  ] },
  { keys: ['leg extension'], muscles: [
    { id: 'quads', intensity: 3 },
  ] },
  { keys: ['leg curl'], muscles: [
    { id: 'hamstrings', intensity: 3 },
  ] },
  { keys: ['mollets', 'calf'], muscles: [
    { id: 'calves', intensity: 3 },
  ] },
  { keys: ['planche', 'gainage', 'core', 'crunch', 'hollow', 'dead bug', 'bird dog'], muscles: [
    { id: 'core', intensity: 3 },
    { id: 'shoulders', intensity: 1 },
  ] },
  { keys: ['burpee', 'mountain', 'jump', 'hiit', 'sprint'], muscles: [
    { id: 'quads', intensity: 2 },
    { id: 'core', intensity: 2 },
    { id: 'shoulders', intensity: 1 },
  ] },
]

export function inferMuscles(name: string): ExerciseMuscle[] {
  const normalized = name.toLowerCase()
  for (const rule of rules) {
    if (rule.keys.some((key) => normalized.includes(key))) {
      return rule.muscles
    }
  }
  return []
}
