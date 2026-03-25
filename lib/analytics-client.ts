'use client'

type AnalyticsPayload = Record<string, unknown>

const STORAGE_KEY = 'fitpulse_analytics_events_v1'

function persistLocally(name: string, payload: AnalyticsPayload) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : []
    const next = [
      ...parsed.slice(-99),
      {
        name,
        payload,
        at: new Date().toISOString(),
      },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore local persistence issues
  }
}

export function trackEvent(name: string, payload: AnalyticsPayload = {}) {
  const body = JSON.stringify({
    name,
    payload,
    at: new Date().toISOString(),
    path: typeof window !== 'undefined' ? window.location.pathname : '',
  })
  persistLocally(name, payload)

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' })
    navigator.sendBeacon('/api/analytics/event', blob)
    return
  }

  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
