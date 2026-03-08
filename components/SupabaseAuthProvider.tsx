'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'
import { syncHistoryForUser } from '@/lib/history-store'
import { syncUserStateForUser } from '@/lib/user-state-store'
import { logClientEvent } from '@/lib/client-telemetry'
import { maybeSendLifecycleEmails } from '@/lib/lifecycle-client'
import { maybeSendDailyWorkoutReminder } from '@/lib/reminder-client'
import { maybeSendBrowserWorkoutReminder } from '@/lib/web-notification-reminder'

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
      await Promise.all([syncHistoryForUser(mapped.id), syncUserStateForUser(mapped.id)])
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
        await Promise.all([syncHistoryForUser(mapped.id), syncUserStateForUser(mapped.id)])
        setUser(mapped)
        setStatus('authenticated')
      })()
    })
    return () => data.subscription.unsubscribe()
  }, [e2eBypass, applySession])

  useEffect(() => {
    if (status !== 'authenticated' || !user) return
    void maybeSendLifecycleEmails({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    })
    void maybeSendDailyWorkoutReminder({
      id: user.id,
      email: user.email,
      name: user.name,
    })
    maybeSendBrowserWorkoutReminder({
      userId: user.id,
      userName: user.name,
    })
  }, [status, user])

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      void logClientEvent({
        level: 'error',
        message: event.message || 'Client runtime error',
        meta: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      void logClientEvent({
        level: 'error',
        message: 'Unhandled promise rejection',
        meta: {
          reason:
            typeof event.reason === 'string'
              ? event.reason
              : (event.reason as { message?: string })?.message || 'unknown',
        },
      })
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
        const supabase = getSupabaseBrowserClient()
        await supabase.auth.signOut()
        setUser(null)
        setStatus('unauthenticated')
      },
      updateProfile: async ({ name, phone }) => {
        if (!isSupabaseConfigured()) {
          throw new Error('Missing Supabase environment variables')
        }
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
