const CACHE_NAME = 'fitpulse-v3'
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

  const url = new URL(request.url)
  const isSameOrigin = url.origin === self.location.origin
  const isNavigation = request.mode === 'navigate'
  const isStaticAsset =
    isSameOrigin &&
    (url.pathname.startsWith('/_next/static/') ||
      url.pathname.startsWith('/icons/') ||
      url.pathname.startsWith('/images/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.woff2'))

  if (!isNavigation && !isStaticAsset) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Avoid caching HTML/API documents to prevent stale app versions.
        if (isStaticAsset) {
          const cloned = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => {})
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(request)
        if (cached) return cached
        const fallback = await caches.match('/')
        return fallback || Response.error()
      })
  )
})
