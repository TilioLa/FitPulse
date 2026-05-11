'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackUxEvent } from '@/lib/ux-events'

function pageTypeFromPath(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/programmes')) return 'programs'
  if (pathname.startsWith('/exercices')) return 'exercises'
  if (pathname.startsWith('/connexion') || pathname.startsWith('/inscription') || pathname.startsWith('/reset')) return 'auth'
  return 'other'
}

export default function PageTypeTelemetry() {
  const pathname = usePathname()

  useEffect(() => {
    const pageType = pageTypeFromPath(pathname)
    trackUxEvent('page_view_segmented', {
      path: pathname,
      page_type: pageType,
    })
  }, [pathname])

  return null
}
