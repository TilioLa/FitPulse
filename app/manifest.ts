import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FitPulse',
    short_name: 'FitPulse',
    description: 'Coach sportif personnel, séances et progression.',
    start_url: '/dashboard?view=feed',
    display: 'standalone',
    background_color: '#f9fafb',
    theme_color: '#1a56db',
    lang: 'fr',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
