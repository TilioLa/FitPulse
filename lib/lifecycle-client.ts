import { getEntitlement } from '@/lib/subscription'

type LifecycleEmailEvent = 'day1' | 'day7' | 'trial_ending'

type LifecycleUser = {
  id: string
  email: string
  name?: string | null
  createdAt?: string | null
}

type SentMap = Partial<Record<LifecycleEmailEvent, string>>

function getSentKey(userId: string) {
  return `fitpulse_lifecycle_sent_${userId}`
}

function readSentMap(userId: string): SentMap {
  try {
    return JSON.parse(localStorage.getItem(getSentKey(userId)) || '{}') as SentMap
  } catch {
    return {}
  }
}

function writeSentMap(userId: string, value: SentMap) {
  localStorage.setItem(getSentKey(userId), JSON.stringify(value))
}

function getDueEvents(user: LifecycleUser): LifecycleEmailEvent[] {
  const sent = readSentMap(user.id)
  const now = Date.now()
  const createdAtMs = new Date(user.createdAt || now).getTime()
  const oneDayMs = 24 * 60 * 60 * 1000
  const due: LifecycleEmailEvent[] = []

  if (!sent.day1 && now - createdAtMs >= oneDayMs) {
    due.push('day1')
  }
  if (!sent.day7 && now - createdAtMs >= 7 * oneDayMs) {
    due.push('day7')
  }

  const entitlement = getEntitlement()
  if (
    !sent.trial_ending &&
    entitlement.plan === 'free' &&
    entitlement.isTrialActive &&
    entitlement.trialDaysLeft <= 2
  ) {
    due.push('trial_ending')
  }

  return due
}

export async function maybeSendLifecycleEmails(user: LifecycleUser) {
  if (typeof window === 'undefined') return
  if (process.env.NEXT_PUBLIC_ENABLE_CLIENT_EMAIL_AUTOMATION !== 'true') return
  if (!user?.email) return

  const dueEvents = getDueEvents(user)
  if (dueEvents.length === 0) return

  for (const event of dueEvents) {
    try {
      const response = await fetch('/api/lifecycle/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          name: user.name,
          event,
        }),
      })
      if (!response.ok) continue
      const data = (await response.json().catch(() => ({}))) as { sent?: boolean }
      if (!data?.sent) continue

      const sentMap = readSentMap(user.id)
      sentMap[event] = new Date().toISOString()
      writeSentMap(user.id, sentMap)
    } catch {
      // ignore lifecycle email errors on client
    }
  }
}
