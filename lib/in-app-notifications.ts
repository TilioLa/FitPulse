export type AppNotificationLevel = 'info' | 'success' | 'warning' | 'error'

export type AppNotification = {
  id: string
  title: string
  body?: string
  level: AppNotificationLevel
  createdAt: string
  readAt?: string
  href?: string
}

const STORAGE_KEY = 'fitpulse_notifications'
const EVENT_NAME = 'fitpulse-notifications'
const LIMIT = 60

function isBrowser() {
  return typeof window !== 'undefined'
}

function parse(input: string | null): AppNotification[] {
  if (!input) return []
  try {
    const data = JSON.parse(input)
    if (!Array.isArray(data)) return []
    return data.filter((item) => item && typeof item === 'object') as AppNotification[]
  } catch {
    return []
  }
}

function write(items: AppNotification[]) {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, LIMIT)))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function readNotifications(): AppNotification[] {
  if (!isBrowser()) return []
  return parse(localStorage.getItem(STORAGE_KEY)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function addNotification(input: {
  title: string
  body?: string
  level?: AppNotificationLevel
  href?: string
}) {
  if (!isBrowser()) return
  const current = readNotifications()
  const next: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 9)}`,
    title: input.title,
    body: input.body,
    href: input.href,
    level: input.level ?? 'info',
    createdAt: new Date().toISOString(),
  }
  write([next, ...current])
}

export function markNotificationRead(id: string) {
  const next = readNotifications().map((item) =>
    item.id === id && !item.readAt ? { ...item, readAt: new Date().toISOString() } : item
  )
  write(next)
}

export function markAllNotificationsRead() {
  const now = new Date().toISOString()
  const next = readNotifications().map((item) => (item.readAt ? item : { ...item, readAt: now }))
  write(next)
}

export function clearNotifications() {
  write([])
}

export function getUnreadNotificationCount() {
  return readNotifications().filter((item) => !item.readAt).length
}

export function subscribeNotifications(callback: () => void) {
  if (!isBrowser()) return () => {}
  window.addEventListener(EVENT_NAME, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(EVENT_NAME, callback)
    window.removeEventListener('storage', callback)
  }
}
