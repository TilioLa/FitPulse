'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const PwaRegister = dynamic(() => import('@/components/PwaRegister'), { ssr: false })
const CookieConsentManager = dynamic(() => import('@/components/CookieConsentManager'), { ssr: false })

export default function ClientBoot() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const enable = () => setReady(true)
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(enable, { timeout: 3000 })
    } else {
      globalThis.setTimeout(enable, 1500)
    }
  }, [])

  if (!ready) return null

  return (
    <>
      <CookieConsentManager />
      <PwaRegister />
    </>
  )
}
