const STORAGE_KEY = 'fitpulse_followed_profiles'

export function readFollowedProfiles(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter((item) => typeof item === 'string')
  } catch {
    return []
  }
}

function writeFollowedProfiles(slugs: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(slugs))))
  window.dispatchEvent(new Event('fitpulse-followed-profiles'))
}

export function isProfileFollowed(slug: string) {
  return readFollowedProfiles().includes(slug)
}

export function toggleFollowProfile(slug: string) {
  const current = readFollowedProfiles()
  if (current.includes(slug)) {
    writeFollowedProfiles(current.filter((item) => item !== slug))
    return false
  }
  writeFollowedProfiles([slug, ...current].slice(0, 50))
  return true
}
