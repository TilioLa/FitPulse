'use client'

import { ToastProvider } from '@/components/ui/ToastProvider'
import { I18nProvider } from '@/components/I18nProvider'
import { SupabaseAuthProvider } from '@/components/SupabaseAuthProvider'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <I18nProvider>
        <ToastProvider>{children}</ToastProvider>
      </I18nProvider>
    </SupabaseAuthProvider>
  )
}
