export type RoutineTemplate = {
  name: string
  equipment: string
  sessionsPerWeek: number
  exercises: { name: string; sets: number; reps: number; rest: number }[]
}

export const routineTemplates: RoutineTemplate[] = [
  {
    name: 'Full Body Express',
    equipment: 'Poids du corps',
    sessionsPerWeek: 3,
    exercises: [
      { name: 'Pompes', sets: 3, reps: 10, rest: 60 },
      { name: 'Squats', sets: 3, reps: 12, rest: 60 },
      { name: 'Fentes', sets: 3, reps: 10, rest: 60 },
      { name: 'Gainage', sets: 3, reps: 30, rest: 45 },
    ],
  },
  {
    name: 'Haut du corps',
    equipment: 'Haltères',
    sessionsPerWeek: 3,
    exercises: [
      { name: 'Développé couché', sets: 4, reps: 8, rest: 90 },
      { name: 'Rowing', sets: 4, reps: 10, rest: 90 },
      { name: 'Shoulder press', sets: 3, reps: 10, rest: 75 },
      { name: 'Curl biceps', sets: 3, reps: 12, rest: 60 },
    ],
  },
  {
    name: 'Bas du corps',
    equipment: 'Machines',
    sessionsPerWeek: 2,
    exercises: [
      { name: 'Presse à cuisses', sets: 4, reps: 10, rest: 90 },
      { name: 'Leg extension', sets: 3, reps: 12, rest: 75 },
      { name: 'Leg curl', sets: 3, reps: 12, rest: 75 },
      { name: 'Mollets', sets: 3, reps: 15, rest: 60 },
    ],
  },
]
