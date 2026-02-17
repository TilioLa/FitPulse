'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/dashboard/Sidebar'
import Footer from '@/components/Footer'
import { useAuth } from '@/components/SupabaseAuthProvider'
import SectionSkeleton from '@/components/dashboard/SectionSkeleton'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'
import {
  DashboardSection,
  sectionToView,
  viewToSection,
} from '@/lib/dashboard-navigation'

const Feed = dynamic(() => import('@/components/dashboard/Feed'), {
  loading: () => <SectionSkeleton />,
})
const History = dynamic(() => import('@/components/dashboard/History'), {
  loading: () => <SectionSkeleton />,
})
const MySessions = dynamic(() => import('@/components/dashboard/MySessions'), {
  loading: () => <SectionSkeleton />,
})
const ProgramsList = dynamic(() => import('@/components/programmes/ProgramsList'), {
  loading: () => <SectionSkeleton />,
})
const CustomRoutines = dynamic(() => import('@/components/dashboard/CustomRoutines'), {
  loading: () => <SectionSkeleton />,
})
const Settings = dynamic(() => import('@/components/dashboard/Settings'), {
  loading: () => <SectionSkeleton />,
})

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Chargement du dashboard...</div>}>
      <DashboardPageContent />
    </Suspense>
  )
}

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const forceE2EMode = searchParams.get('e2e') === '1'
  const [activeSection, setActiveSection] = useState<DashboardSection>(
    () => viewToSection(searchParams.get('view')) || 'feed'
  )
  const { status, reload } = useAuth()
  const localBypass =
    typeof window !== 'undefined' && window.localStorage.getItem('fitpulse_e2e_bypass') === 'true'
  const e2eBypass =
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'e2e-anon-key' ||
    localBypass
  const effectiveStatus = forceE2EMode || (e2eBypass && status === 'unauthenticated') ? 'authenticated' : status

  useEffect(() => {
    if (effectiveStatus !== 'unauthenticated') return
    let active = true
    const timer = setTimeout(async () => {
      if (!active) return
      const justSignedInAtRaw = localStorage.getItem('fitpulse_login_just_signed_in_at')
      const justSignedInAt = Number(justSignedInAtRaw || 0)
      const withinLoginGrace = Number.isFinite(justSignedInAt) && Date.now() - justSignedInAt < 15_000

      if (withinLoginGrace) {
        for (let attempt = 0; attempt < 6; attempt += 1) {
          if (!active) return
          await reload()
          if (isSupabaseConfigured()) {
            try {
              const { data } = await getSupabaseBrowserClient().auth.getSession()
              if (data.session) {
                localStorage.removeItem('fitpulse_login_just_signed_in_at')
                return
              }
            } catch {
              // ignore and retry
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 250))
        }
      } else {
        try {
          if (isSupabaseConfigured()) {
            const { data } = await getSupabaseBrowserClient().auth.getSession()
            if (data.session) return
          }
        } catch {
          // ignore and continue redirect
        }
      }

      if (active) router.replace('/connexion')
    }, 900)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [router, effectiveStatus, reload])

  const scheduleSection = (section: DashboardSection) => {
    queueMicrotask(() => {
      setActiveSection((prev) => (prev !== section ? section : prev))
    })
  }

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const currentView = searchParams.get('view')
    const targetView = sectionToView(activeSection)
    const urlSection = viewToSection(currentView)

    // If URL already points to another valid section, wait for state sync
    // instead of forcing a replace and creating a navigation bounce.
    if (urlSection && urlSection !== activeSection) return
    if (currentView === targetView) return

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('view', targetView)
    router.replace(`/dashboard?${nextParams.toString()}`, { scroll: false })
  }, [activeSection, effectiveStatus, router, searchParams])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const directSection = viewToSection(searchParams.get('view'))
    if (directSection) {
      scheduleSection(directSection)
      return
    }
    try {
      const stored = localStorage.getItem('fitpulse_current_workout')
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (parsed?.status === 'in_progress') {
        scheduleSection('session')
      }
    } catch {
      // ignore
    }
  }, [effectiveStatus, searchParams])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const view = searchParams.get('view')
    if (view) return

    try {
      const currentWorkoutRaw = localStorage.getItem('fitpulse_current_workout')
      if (currentWorkoutRaw) {
        const parsedWorkout = JSON.parse(currentWorkoutRaw)
        if (parsedWorkout?.status === 'in_progress') return
      }

      const historyRaw = localStorage.getItem('fitpulse_history')
      const history = historyRaw ? JSON.parse(historyRaw) : []
      const isNewUser = !Array.isArray(history) || history.length === 0
      if (!isNewUser) return

      const alreadyGuided = localStorage.getItem('fitpulse_smart_start_seen_v1') === 'true'
      if (alreadyGuided) return

      scheduleSection('programs')
      localStorage.setItem('fitpulse_smart_start_seen_v1', 'true')
    } catch {
      // ignore smart-start errors
    }
  }, [effectiveStatus, searchParams])

  if (effectiveStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du dashboard...
      </div>
    )
  }

  if (effectiveStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Redirection vers la connexion...
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'feed':
        return <Feed />
      case 'history':
        return <History />
      case 'session':
        return <MySessions />
      case 'programs':
        return <ProgramsList />
      case 'routines':
        return <CustomRoutines />
      case 'settings':
        return <Settings />
      case 'exercises':
        return <div />
      default:
        return <Feed />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-col lg:flex-row flex-grow">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {renderSection()}
        </main>
      </div>
      <Footer />
    </div>
  )
}
