'use client'

import { useEffect } from 'react'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { SupabaseAuthProvider } from '@/components/SupabaseAuthProvider'
import { initA11yPreferences } from '@/lib/a11y-preferences'
import PageTypeTelemetry from '@/components/system/PageTypeTelemetry'
import RemoveCookieBanner from '@/components/system/RemoveCookieBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initA11yPreferences()
  }, [])

  return (
    <SupabaseAuthProvider>
      <I18nProvider>
        <ToastProvider>
          {children}
          <RemoveCookieBanner />
          <PageTypeTelemetry />
        </ToastProvider>
      </I18nProvider>
    </SupabaseAuthProvider>
  )
}
