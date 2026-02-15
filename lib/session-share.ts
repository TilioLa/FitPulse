export type SharedSessionPayload = {
  workoutName: string
  author: string
  date: string
  duration: number
  volume: number
  calories: number
  muscleUsage: { id: string; percent: number }[]
}

function base64UrlEncode(value: string) {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window
      .btoa(unescape(encodeURIComponent(value)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
  }
  return Buffer.from(value, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(padded)))
  }
  return Buffer.from(padded, 'base64').toString('utf-8')
}

export function encodeSharedSession(payload: SharedSessionPayload) {
  return base64UrlEncode(JSON.stringify(payload))
}

export function decodeSharedSession(token: string): SharedSessionPayload | null {
  try {
    const parsed = JSON.parse(base64UrlDecode(token)) as SharedSessionPayload
    if (!parsed?.workoutName || !parsed?.date) return null
    return parsed
  } catch {
    return null
  }
}
