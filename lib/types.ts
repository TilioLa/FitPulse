export interface PublicUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface StoredUser extends PublicUser {
  password: string
}

export interface WorkoutStats {
  streak: number
  completedWorkouts: number
}

export interface WorkoutHistoryEntry {
  id: string
  workoutId: string
  workoutName: string
  date: string
  duration: number
}
