export type PlanId = 'free' | 'pro' | 'proplus'

export type Entitlement = {
  plan: PlanId
  effectivePlan: PlanId
  trialStartedAt: string | null
  trialEndsAt: string | null
  trialDaysLeft: number
  isTrialActive: boolean
}

export const PLAN_STORAGE_KEY = 'fitpulse_plan'
export const TRIAL_STARTED_AT_STORAGE_KEY = 'fitpulse_trial_started_at'
const TRIAL_DAYS = 14

const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  proplus: 2,
}

export function parsePlanId(raw: string | null | undefined): PlanId {
  if (raw === 'pro' || raw === 'proplus' || raw === 'free') return raw
  return 'free'
}

export function getStoredPlan(): PlanId {
  if (typeof window === 'undefined') return 'free'
  return parsePlanId(localStorage.getItem(PLAN_STORAGE_KEY))
}

export function setStoredPlan(plan: PlanId) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PLAN_STORAGE_KEY, plan)
  window.dispatchEvent(new Event('fitpulse-plan'))
}

export function ensureTrialStarted(dateIso?: string) {
  if (typeof window === 'undefined') return
  if (!localStorage.getItem(TRIAL_STARTED_AT_STORAGE_KEY)) {
    localStorage.setItem(TRIAL_STARTED_AT_STORAGE_KEY, dateIso || new Date().toISOString())
    window.dispatchEvent(new Event('fitpulse-plan'))
  }
}

export function getEntitlement(): Entitlement {
  const fallback: Entitlement = {
    plan: 'free',
    effectivePlan: 'free',
    trialStartedAt: null,
    trialEndsAt: null,
    trialDaysLeft: 0,
    isTrialActive: false,
  }

  if (typeof window === 'undefined') return fallback

  const plan = getStoredPlan()
  const trialStartedAt = localStorage.getItem(TRIAL_STARTED_AT_STORAGE_KEY)
  if (!trialStartedAt) {
    return { ...fallback, plan }
  }

  const startedMs = new Date(trialStartedAt).getTime()
  if (!Number.isFinite(startedMs)) {
    return { ...fallback, plan }
  }

  const trialEndsAtMs = startedMs + TRIAL_DAYS * 24 * 60 * 60 * 1000
  const nowMs = Date.now()
  const isTrialActive = nowMs < trialEndsAtMs
  const trialDaysLeft = isTrialActive
    ? Math.max(1, Math.ceil((trialEndsAtMs - nowMs) / (24 * 60 * 60 * 1000)))
    : 0
  const trialEndsAt = new Date(trialEndsAtMs).toISOString()

  const effectivePlan: PlanId = plan === 'free' && isTrialActive ? 'pro' : plan

  return {
    plan,
    effectivePlan,
    trialStartedAt,
    trialEndsAt,
    trialDaysLeft,
    isTrialActive,
  }
}

export function hasAtLeastPlan(plan: PlanId, minimum: PlanId) {
  return PLAN_RANK[plan] >= PLAN_RANK[minimum]
}

export function hasProAccess(entitlement: Entitlement) {
  return hasAtLeastPlan(entitlement.effectivePlan, 'pro')
}

export function isProgramPremium(programId: string) {
  // Free plan keeps one complete program unlocked.
  return programId !== '1'
}

export function canAccessProgram(programId: string, entitlement: Entitlement) {
  if (!isProgramPremium(programId)) return true
  return hasProAccess(entitlement)
}
