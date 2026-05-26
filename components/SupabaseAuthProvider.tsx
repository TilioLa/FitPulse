'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { usePathname } from 'next/navigation'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AppUser = {
  id: string
  email: string
  name?: string | null
  phone?: string | null
  createdAt?: string | null
}

type AuthContextValue = {
  status: AuthStatus
  user: AppUser | null
  reload: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (payload: { name?: string; phone?: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function shouldLoadAuthImmediately(pathname: string | null) {
  if (!pathname) return false
  return (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/exercices') ||
    pathname.startsWith('/profil') ||
    pathname.startsWith('/programmes') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/tickets') ||
    pathname.startsWith('/connexion') ||
    pathname.startsWith('/inscription') ||
    pathname.startsWith('/reset')
  )
}

function mapUser(user: User | null): AppUser | null {
  if (!user?.email) return null
  const meta = (user.user_metadata || {}) as { full_name?: string; phone?: string }
  const normalizedName = meta.full_name?.trim() || user.email.split('@')[0]
  return {
    id: user.id,
    email: user.email,
    name: normalizedName,
    phone: meta.phone ?? null,
    createdAt: user.created_at ?? null,
  }
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const localBypass =
    typeof window !== 'undefined' && window.localStorage.getItem('fitpulse_e2e_bypass') === 'true'
  const e2eBypass =
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'e2e-anon-key' ||
    localBypass
  const [status, setStatus] = useState<AuthStatus>(e2eBypass ? 'authenticated' : 'loading')
  const [user, setUser] = useState<AppUser | null>(
    e2eBypass
      ? {
          id: 'e2e-user',
          email: 'e2e@fitpulse.local',
          name: 'E2E User',
          phone: null,
          createdAt: new Date().toISOString(),
        }
      : null
  )
  const lastProgressPersistRef = useRef(0)
  const lastHistoryPersistRef = useRef(0)

  const applySession = useCallback(async () => {
    if (e2eBypass) {
      setUser({
        id: 'e2e-user',
        email: 'e2e@fitpulse.local',
        name: 'E2E User',
        phone: null,
        createdAt: new Date().toISOString(),
      })
      setStatus('authenticated')
      return
    }
    if (!isSupabaseConfigured()) {
      setStatus('unauthenticated')
      setUser(null)
      return
    }
    const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setStatus('unauthenticated')
      setUser(null)
      return
    }
    let sessionUser = data.session?.user ?? null
    if (!sessionUser) {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (!userError && userData?.user) {
        sessionUser = userData.user
      }
    }
    const mapped = mapUser(sessionUser)
    if (mapped) {
      setStatus('loading')
      const [historyStore, userStateStore] = await Promise.all([
        import('@/lib/history-store'),
        import('@/lib/user-state-store'),
      ])
      await Promise.all([
        historyStore.syncHistoryForUser(mapped.id),
        userStateStore.syncUserStateForUser(mapped.id),
      ])
      setUser(mapped)
      setStatus('authenticated')
      return
    }
    setUser(null)
    setStatus('unauthenticated')
  }, [e2eBypass])

  useEffect(() => {
    if (e2eBypass) return
    if (!isSupabaseConfigured()) {
      setStatus('unauthenticated')
      setUser(null)
      return
    }
    let active = true
    let unsubscribe: (() => void) | undefined
    let idleId: number | undefined
    let timeoutId: number | undefined

    const bootAuth = () => {
      void (async () => {
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
        if (!active) return
        const supabase = getSupabaseBrowserClient()
        void applySession()

        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          const mapped = mapUser(session?.user ?? null)
          if (!mapped) {
            setUser(null)
            setStatus('unauthenticated')
            return
          }
          setStatus('loading')
          void (async () => {
            const [historyStore, userStateStore] = await Promise.all([
              import('@/lib/history-store'),
              import('@/lib/user-state-store'),
            ])
            await Promise.all([
              historyStore.syncHistoryForUser(mapped.id),
              userStateStore.syncUserStateForUser(mapped.id),
            ])
            setUser(mapped)
            setStatus('authenticated')
          })()
        })
        unsubscribe = () => data.subscription.unsubscribe()
      })()
    }

    if (shouldLoadAuthImmediately(pathname)) {
      bootAuth()
    } else {
      const win = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
        cancelIdleCallback?: (id: number) => void
      }
      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(bootAuth, { timeout: 2500 })
      } else {
        timeoutId = window.setTimeout(bootAuth, 1200)
      }
    }

    return () => {
      active = false
      if (idleId && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId)
      }
      if (timeoutId) window.clearTimeout(timeoutId)
      unsubscribe?.()
    }
  }, [e2eBypass, applySession, pathname])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    void (async () => {
      const [lifecycleClient, reminderClient, webNotificationReminder] = await Promise.all([
        import('@/lib/lifecycle-client'),
        import('@/lib/reminder-client'),
        import('@/lib/web-notification-reminder'),
      ])
      void lifecycleClient.maybeSendLifecycleEmails({
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      })
      void reminderClient.maybeSendDailyWorkoutReminder({
        id: user.id,
        email: user.email,
        name: user.name,
      })
      webNotificationReminder.maybeSendBrowserWorkoutReminder({
        userId: user.id,
        userName: user.name,
      })
    })()
  }, [status, user])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    const persistNow = () => {
      if (!user?.id) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const now = Date.now()
      if (now - lastProgressPersistRef.current < 20_000) return
      lastProgressPersistRef.current = now
      void import('@/lib/user-state-store').then(({ persistProgressStateForUser }) =>
        persistProgressStateForUser(user.id)
      )
    }
    const interval = window.setInterval(persistNow, 30_000)
    const onProgress = () => persistNow()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistNow()
    }
    window.addEventListener('fitpulse-progress', onProgress)
    window.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('fitpulse-progress', onProgress)
      window.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [status, user])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    const persistHistoryNow = () => {
      if (!user?.id) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) return
      const now = Date.now()
      if (now - lastHistoryPersistRef.current < 20_000) return
      lastHistoryPersistRef.current = now
      void import('@/lib/history-store').then(({ persistHistoryForUser, readLocalHistory }) => {
        const localHistory = readLocalHistory()
        if (localHistory.length === 0) return
        void persistHistoryForUser(user.id, localHistory)
      })
    }
    const interval = window.setInterval(persistHistoryNow, 45_000)
    const onHistory = () => persistHistoryNow()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistHistoryNow()
    }
    window.addEventListener('fitpulse-history', onHistory)
    window.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('fitpulse-history', onHistory)
      window.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [status, user])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void import('@/lib/client-telemetry').then(({ logClientEvent }) =>
        logClientEvent({
          level: 'error',
          message: event.message || 'Client runtime error',
          meta: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        })
      )
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void import('@/lib/client-telemetry').then(({ logClientEvent }) =>
        logClientEvent({
          level: 'error',
          message: 'Unhandled promise rejection',
          meta: {
            reason:
              typeof event.reason === 'string'
                ? event.reason
                : (event.reason as { message?: string })?.message || 'unknown',
          },
        })
      )
    }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      reload: applySession,
      signOut: async () => {
        if (e2eBypass) {
          setStatus('authenticated')
          return
        }
        if (!isSupabaseConfigured()) {
          setUser(null)
          setStatus('unauthenticated')
          return
        }
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
        setUser(null)
        setStatus('unauthenticated')
      },
      updateProfile: async ({ name, phone }) => {
        if (!isSupabaseConfigured()) {
          throw new Error('Missing Supabase environment variables')
        }
        const { getSupabaseBrowserClient } = await import('@/lib/supabase-browser')
        const supabase = getSupabaseBrowserClient()
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: name,
            phone: phone,
          },
        })
        if (error) {
          throw error
        }
        await applySession()
      },
    }),
    [status, user, e2eBypass, applySession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within SupabaseAuthProvider')
  }
  return ctx
}
