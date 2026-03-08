export type WorkoutTemplateExercise = {
  name: string
  sets: number
  reps: number
  rest: number
}

export type WorkoutTemplate = {
  id: string
  name: string
  duration: number
  exercises: WorkoutTemplateExercise[]
}

export const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'full-body-45',
    name: 'Full Body 45 min',
    duration: 45,
    exercises: [
      { name: 'Squats', sets: 4, reps: 10, rest: 75 },
      { name: 'Pompes', sets: 4, reps: 12, rest: 60 },
      { name: 'Rowing haltère', sets: 4, reps: 10, rest: 75 },
      { name: 'Fentes', sets: 3, reps: 12, rest: 60 },
      { name: 'Planche', sets: 3, reps: 45, rest: 45 },
    ],
  },
  {
    id: 'no-equipment-30',
    name: 'Sans matériel 30 min',
    duration: 30,
    exercises: [
      { name: 'Burpees', sets: 3, reps: 12, rest: 60 },
      { name: 'Squats', sets: 4, reps: 15, rest: 50 },
      { name: 'Pompes', sets: 4, reps: 10, rest: 50 },
      { name: 'Mountain climbers', sets: 3, reps: 30, rest: 40 },
    ],
  },
  {
    id: 'upper-body-40',
    name: 'Haut du corps 40 min',
    duration: 40,
    exercises: [
      { name: 'Développé épaules', sets: 4, reps: 10, rest: 75 },
      { name: 'Tractions assistées', sets: 4, reps: 8, rest: 90 },
      { name: 'Curl biceps', sets: 3, reps: 12, rest: 60 },
      { name: 'Extensions triceps', sets: 3, reps: 12, rest: 60 },
      { name: 'Gainage latéral', sets: 3, reps: 30, rest: 40 },
    ],
  },
]
