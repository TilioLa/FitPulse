'use client'

import dynamic from 'next/dynamic'

const PwaRegister = dynamic(() => import('@/components/PwaRegister'), { ssr: false })
const CookieConsentManager = dynamic(() => import('@/components/CookieConsentManager'), { ssr: false })

export default function ClientBoot() {
  return (
    <>
      <CookieConsentManager />
      <PwaRegister />
    </>
  )
}

