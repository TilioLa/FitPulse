'use client'

export const COOKIE_CONSENT_KEY = 'fitpulse_cookie_consent_v1'
export const COOKIE_CONSENT_EVENT = 'fitpulse-cookie-consent'

export type CookieConsentValue = 'accepted' | 'rejected'

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

function readCookieValue(key: string): string | null {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  for (const cookie of cookies) {
    const eqIndex = cookie.indexOf('=')
    if (eqIndex <= 0) continue
    const name = cookie.slice(0, eqIndex)
    if (name !== key) continue
    return decodeURIComponent(cookie.slice(eqIndex + 1))
  }
  return null
}

export function getCookieConsent(): CookieConsentValue | null {
  const value = readCookieValue(COOKIE_CONSENT_KEY)
  if (value === 'accepted' || value === 'rejected') return value
  return null
}

export function setCookieConsent(value: CookieConsentValue) {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_CONSENT_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
  }
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === 'accepted'
}

