'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      } catch {
        // no-op: app remains functional without SW
      }
    }

    const run = () => void register()
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(run, { timeout: 2000 })
    } else {
      setTimeout(run, 1200)
    }
  }, [])

  return null
}
