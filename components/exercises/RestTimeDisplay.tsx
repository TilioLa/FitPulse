'use client'

import { useEffect, useState } from 'react'

export default function RestTimeDisplay({ defaultRest }: { defaultRest: number }) {
  const [restTime, setRestTime] = useState<number>(defaultRest)

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}')
    const override = Number(settings?.restTime)
    if (Number.isFinite(override) && override > 0) {
      setRestTime(override)
    } else {
      setRestTime(defaultRest)
    }
  }, [defaultRest])

  return <span>{restTime}s repos</span>
}
