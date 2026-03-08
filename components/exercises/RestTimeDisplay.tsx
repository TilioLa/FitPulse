'use client'

import { useMemo } from 'react'

export default function RestTimeDisplay({ defaultRest }: { defaultRest: number }) {
  const restTime = useMemo(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}')
      const override = Number(settings?.restTime)
      return Number.isFinite(override) && override > 0 ? override : defaultRest
    } catch {
      return defaultRest
    }
  }, [defaultRest])

  return <span>{restTime}s repos</span>
}
