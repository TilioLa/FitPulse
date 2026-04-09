'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import VercelAnalytics from '@/components/VercelAnalytics'
import {
  COOKIE_CONSENT_EVENT,
  getCookieConsent,
  setCookieConsent,
  type CookieConsentValue,
} from '@/lib/cookie-consent'

export default function CookieConsentManager() {
  const [consent, setConsent] = useState<CookieConsentValue | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const e2eBypass = process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true'
    const current = getCookieConsent()
    if (!current && e2eBypass) {
      setCookieConsent('accepted')
      setConsent('accepted')
    } else {
      setConsent(current)
    }
    setReady(true)

    const sync = () => setConsent(getCookieConsent())
    window.addEventListener(COOKIE_CONSENT_EVENT, sync)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, sync)
  }, [])

  const analyticsEnabled = consent === 'accepted'
  const showBanner = ready && consent == null

  return (
    <>
      {analyticsEnabled && (
        <>
          <VercelAnalytics />
          <SpeedInsights />
        </>
      )}
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              FitPulse utilise des cookies pour mesurer l&apos;audience et améliorer l&apos;expérience.
              <Link href="/confidentialite" className="ml-1 font-semibold text-primary-700 underline underline-offset-2">
                En savoir plus
              </Link>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCookieConsent('rejected')}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => setCookieConsent('accepted')}
                className="btn-primary px-4 py-2 text-sm"
              >
                Accepter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

