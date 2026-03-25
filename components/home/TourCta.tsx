'use client'

import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/analytics-client'

export default function TourCta() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('fitpulse_tour_pending', 'true')
          trackEvent('tour_start_click', { location: 'home_hero' })
          window.location.href = '/dashboard?tour=1'
        }
      }}
      className="btn-secondary w-full sm:w-auto border-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 inline-flex items-center justify-center gap-2"
    >
      <span>Visite guidée</span>
      <ArrowRight className="h-5 w-5" />
    </button>
  )
}
