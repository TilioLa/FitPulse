'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Locale, resolveLocale, t as translate } from '@/lib/i18n'

type I18nContextValue = {
  locale: Locale
  t: (key: keyof typeof import('@/lib/i18n').messages.fr.common) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'fr',
  t: (key) => translate('fr', key),
})

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale || 'fr')

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setLocale(resolveLocale(navigator.language))
    }
  }, [])

  const value = useMemo(
    () => ({
      locale,
      t: (key: keyof typeof import('@/lib/i18n').messages.fr.common) => translate(locale, key),
    }),
    [locale]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
