'use client'

import { ToastProvider } from '@/components/ui/ToastProvider'
import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/components/I18nProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SessionProvider>
  )
}
