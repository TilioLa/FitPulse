'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AppUser = {
  id: string
  email: string
  name?: string | null
  phone?: string | null
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
  return {
    id: user.id,
    email: user.email,
    name: meta.full_name ?? null,
    phone: meta.phone ?? null,
  }
}

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [user, setUser] = useState<AppUser | null>(null)

  const applySession = async () => {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      setStatus('unauthenticated')
      setUser(null)
      return
    }
    const mapped = mapUser(data.session?.user ?? null)
    setUser(mapped)
    setStatus(mapped ? 'authenticated' : 'unauthenticated')
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    void applySession()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const mapped = mapUser(session?.user ?? null)
      setUser(mapped)
      setStatus(mapped ? 'authenticated' : 'unauthenticated')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    reload: applySession,
    signOut: async () => {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      setStatus('unauthenticated')
    },
    updateProfile: async ({ name, phone }) => {
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
  }), [status, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within SupabaseAuthProvider')
  }
  return ctx
}
