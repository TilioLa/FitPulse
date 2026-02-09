import type { MetadataRoute } from 'next'

const baseUrl = 'https://fitpulse.fr'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/dashboard',
    '/programmes',
    '/profil',
    '/pricing',
    '/connexion',
    '/inscription',
    '/contact',
    '/mentions-legales',
    '/confidentialite',
    '/cgv',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
