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
  const settings = readLocalSettings() as {
    onboardingCompletedAt?: string
    onboardingDismissedAt?: string
    onboardingAnswers?: OnboardingAnswers
  }
  const fallbackState: OnboardingState = {
    completed: typeof settings.onboardingCompletedAt === 'string' && settings.onboardingCompletedAt.length > 0,
    dismissed: typeof settings.onboardingDismissedAt === 'string' && settings.onboardingDismissedAt.length > 0,
    answers: settings.onboardingAnswers,
  }
  if (typeof window === 'undefined') return fallbackState
  try {
    const localState = JSON.parse(localStorage.getItem(ONBOARDING_STATE_KEY) || '{}') as OnboardingState
    return {
      ...fallbackState,
      ...localState,
      completed: Boolean(localState.completed || fallbackState.completed),
      dismissed: Boolean(localState.dismissed || fallbackState.dismissed),
      answers: localState.answers || fallbackState.answers,
    }
  } catch {
    return fallbackState
  }
}

export function writeOnboardingState(state: OnboardingState) {
  if (typeof window === 'undefined') return
  const nowIso = new Date().toISOString()
  const existingSettings = readLocalSettings()
  writeLocalSettings({
    ...existingSettings,
    onboardingCompletedAt:
      state.completed === true
        ? nowIso
        : (existingSettings.onboardingCompletedAt as string | undefined),
    onboardingDismissedAt:
      state.dismissed === true
        ? nowIso
        : (existingSettings.onboardingDismissedAt as string | undefined),
    onboardingAnswers: state.answers || (existingSettings.onboardingAnswers as OnboardingAnswers | undefined),
  })
  localStorage.setItem(
    ONBOARDING_STATE_KEY,
    JSON.stringify({
      ...state,
      updatedAt: nowIso,
    })
  )
  window.dispatchEvent(new Event('fitpulse-onboarding'))
}

export function isOnboardingProfileComplete() {
  const settings = readLocalSettings()
  const completedFlag =
    typeof settings.onboardingCompletedAt === 'string' && settings.onboardingCompletedAt.length > 0
  if (completedFlag) return true
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
