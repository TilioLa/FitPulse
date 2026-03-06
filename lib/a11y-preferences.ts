export type A11yPreferences = {
  fontScale: 'normal' | 'large' | 'xlarge'
  reducedMotion: boolean
  highContrast: boolean
}

const STORAGE_KEY = 'fitpulse_a11y_preferences'
const EVENT_NAME = 'fitpulse-a11y-preferences'

const DEFAULT_PREFS: A11yPreferences = {
  fontScale: 'normal',
  reducedMotion: false,
  highContrast: false,
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function parse(raw: string | null): A11yPreferences {
  if (!raw) return DEFAULT_PREFS
  try {
    const data = JSON.parse(raw) as Partial<A11yPreferences>
    return {
      fontScale: data.fontScale === 'large' || data.fontScale === 'xlarge' ? data.fontScale : 'normal',
      reducedMotion: data.reducedMotion === true,
      highContrast: data.highContrast === true,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function readA11yPreferences(): A11yPreferences {
  if (!isBrowser()) return DEFAULT_PREFS
  return parse(localStorage.getItem(STORAGE_KEY))
}

export function applyA11yPreferences(prefs: A11yPreferences) {
  if (!isBrowser()) return
  const root = document.documentElement
  root.dataset.fitpulseFontScale = prefs.fontScale
  root.dataset.fitpulseMotion = prefs.reducedMotion ? 'reduce' : 'normal'
  root.dataset.fitpulseContrast = prefs.highContrast ? 'high' : 'normal'
}

export function writeA11yPreferences(prefs: A11yPreferences) {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  applyA11yPreferences(prefs)
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function initA11yPreferences() {
  if (!isBrowser()) return DEFAULT_PREFS
  const prefs = readA11yPreferences()
  applyA11yPreferences(prefs)
  return prefs
}

export function subscribeA11yPreferences(callback: () => void) {
  if (!isBrowser()) return () => {}
  window.addEventListener(EVENT_NAME, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT_NAME, callback)
    window.removeEventListener('storage', callback)
  }
}
