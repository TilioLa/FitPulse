import { readLocalSettings, writeLocalSettings } from '@/lib/user-state-store'

export const ONBOARDING_STATE_KEY = 'fitpulse_onboarding_state_v2'

export type OnboardingAnswers = {
  goal: string
  level: string
  equipment: string[]
  sessionsPerWeek: number
}

type OnboardingState = {
  completed?: boolean
  dismissed?: boolean
  updatedAt?: string
  answers?: OnboardingAnswers
}

const defaultAnswers: OnboardingAnswers = {
  goal: 'Remise en forme',
  level: 'debutant',
  equipment: ['Poids du corps'],
  sessionsPerWeek: 3,
}

export function getDefaultOnboardingAnswers() {
  return { ...defaultAnswers }
}

export function readOnboardingState(): OnboardingState {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(ONBOARDING_STATE_KEY) || '{}') as OnboardingState
  } catch {
    return {}
  }
}

export function writeOnboardingState(state: OnboardingState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    ONBOARDING_STATE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: new Date().toISOString(),
    })
  )
  window.dispatchEvent(new Event('fitpulse-onboarding'))
}

export function isOnboardingProfileComplete() {
  const settings = readLocalSettings()
  const hasGoal = typeof settings.goal === 'string' && settings.goal.trim().length > 0
  const hasLevel = typeof settings.level === 'string' && settings.level.trim().length > 0
  const hasEquipment = Array.isArray(settings.equipment) && settings.equipment.length > 0
  const hasSessions = Number(settings.sessionsPerWeek) >= 1
  return hasGoal && hasLevel && hasEquipment && hasSessions
}

export function applyOnboardingAnswers(answers: OnboardingAnswers) {
  const existing = readLocalSettings()
  writeLocalSettings({
    ...existing,
    goal: answers.goal,
    goals: existing.goals && Array.isArray(existing.goals) && existing.goals.length > 0
      ? existing.goals
      : [answers.goal],
    level: answers.level,
    equipment: answers.equipment,
    sessionsPerWeek: answers.sessionsPerWeek,
    onboardingCompletedAt: new Date().toISOString(),
  })
  writeOnboardingState({
    completed: true,
    dismissed: false,
    answers,
  })
}
