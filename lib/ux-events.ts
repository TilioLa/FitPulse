type UxEventPayload = Record<string, string | number | boolean | null | undefined>

const STORAGE_KEY = 'fitpulse_ux_events_v1'
const MAX_EVENTS = 200

const canUseWindow = () => typeof window !== 'undefined'

export function trackUxEvent(event: string, payload: UxEventPayload = {}) {
  if (!canUseWindow()) return

  const timestamp = new Date().toISOString()
  const enriched = { event, timestamp, ...payload }

  try {
    const existing = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    const next = Array.isArray(existing) ? [...existing, enriched].slice(-MAX_EVENTS) : [enriched]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // ignore local tracking failures
  }

  const dataLayer = (window as Window & { dataLayer?: Array<Record<string, unknown>> }).dataLayer
  if (Array.isArray(dataLayer)) {
    dataLayer.push(enriched)
  }
}

