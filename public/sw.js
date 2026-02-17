const CACHE_NAME = 'fitpulse-v1'
const OFFLINE_FALLBACKS = ['/', '/dashboard?view=feed', '/connexion', '/inscription']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_FALLBACKS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (request.url.startsWith(self.location.origin)) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {})
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const fallback = await caches.match('/dashboard?view=feed')
        return fallback || Response.error()
      })
  )
})
