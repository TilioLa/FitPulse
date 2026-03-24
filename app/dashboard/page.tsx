'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Sidebar from '@/components/dashboard/Sidebar'
import Footer from '@/components/Footer'
import { useAuth } from '@/components/SupabaseAuthProvider'
import SectionSkeleton from '@/components/dashboard/SectionSkeleton'
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'
import { readLocalCurrentWorkout } from '@/lib/user-state-store'
import { programsById } from '@/data/programs'
import {
  DashboardSection,
  sectionToView,
  viewToSection,
} from '@/lib/dashboard-navigation'

const Feed = dynamic(() => import('@/components/dashboard/Feed'), {
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

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du dashboard...
      </div>
    )
  }

  return <DashboardPageContent />
}

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<DashboardSection>(
    () => viewToSection(searchParams.get('view')) || 'feed'
  )
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [resumeSessionHref, setResumeSessionHref] = useState<string | null>(null)
  const [resumeSessionLabel, setResumeSessionLabel] = useState<string>('Reprendre la séance')
  const { status, reload } = useAuth()
  const localBypass =
    typeof window !== 'undefined' && window.localStorage.getItem('fitpulse_e2e_bypass') === 'true'
  const wantsTour =
    searchParams.get('tour') === '1' ||
    (typeof window !== 'undefined' && window.localStorage.getItem('fitpulse_tour_pending') === 'true')
  const e2eBypass =
    process.env.NEXT_PUBLIC_E2E_BYPASS_AUTH === 'true' ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'e2e-anon-key' ||
    localBypass
  const forceE2EMode = e2eBypass && searchParams.get('e2e') === '1'
  const effectiveStatus =
    forceE2EMode || (e2eBypass && status === 'unauthenticated') || (wantsTour && status === 'unauthenticated')
      ? 'authenticated'
      : status

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

      if (active) {
        router.replace('/connexion')
      }
    }, 900)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [router, effectiveStatus, reload, searchParams])

  const scheduleSection = (section: DashboardSection) => {
    queueMicrotask(() => {
      setActiveSection((prev) => (prev !== section ? section : prev))
    })
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem('fitpulse_last_dashboard_view', sectionToView(activeSection))
  }, [activeSection])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const view =
      searchParams.get('view') ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('view')
        : null)
    if (view) {
      const directSection = viewToSection(view)
      if (directSection) scheduleSection(directSection)
      return
    }
    if (typeof window === 'undefined') return
    const lastView = localStorage.getItem('fitpulse_last_dashboard_view')
    const lastSection = lastView ? viewToSection(lastView) : null
    if (lastSection) scheduleSection(lastSection)
  }, [effectiveStatus, searchParams])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const forcedTour = searchParams.get('tour') === '1'
    const pending = typeof window !== 'undefined' && localStorage.getItem('fitpulse_tour_pending') === 'true'
    if (!forcedTour && !pending) return
    if (typeof window !== 'undefined') {
      localStorage.setItem('fitpulse_tour_pending', 'false')
    }
    setTourStep(1)
  }, [effectiveStatus, searchParams])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const apply = () => {
      const currentWorkout = readLocalCurrentWorkout() as {
        status?: string
        programId?: string
        id?: string
        name?: string
      } | null
      if (currentWorkout?.status === 'in_progress') {
        const program = currentWorkout.programId ? programsById[currentWorkout.programId] : null
        const sessionId = typeof currentWorkout.id === 'string' ? currentWorkout.id : null
        const href =
          program && sessionId
            ? `/programmes/${program.slug}/seances/${sessionId}`
            : '/dashboard?view=session'
        setResumeSessionHref(href)
        setResumeSessionLabel(
          currentWorkout.name ? `Reprendre : ${currentWorkout.name}` : 'Reprendre la séance'
        )
      } else {
        setResumeSessionHref(null)
        setResumeSessionLabel('Reprendre la séance')
      }
    }
    apply()
    window.addEventListener('storage', apply)
    window.addEventListener('fitpulse-current-workout', apply)
    return () => {
      window.removeEventListener('storage', apply)
      window.removeEventListener('fitpulse-current-workout', apply)
    }
  }, [effectiveStatus])

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
    if (activeSection !== 'session') return
    const currentWorkout = readLocalCurrentWorkout() as { status?: string } | null
    if (currentWorkout?.status === 'in_progress') return
    scheduleSection('feed')
  }, [activeSection, effectiveStatus])

  useEffect(() => {
    if (effectiveStatus !== 'authenticated') return
    const view =
      searchParams.get('view') ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('view')
        : null)
    if (view) return
    if (typeof window !== 'undefined') {
      const lastView = localStorage.getItem('fitpulse_last_dashboard_view')
      if (lastView) return
    }

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
      case 'session':
        return <MySessions />
      case 'programs':
        return <ProgramsList />
      case 'routines':
        return <CustomRoutines />
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
          {resumeSessionHref && (
            <div className="mb-6 rounded-2xl border border-primary-200 bg-gradient-to-r from-primary-50 to-white px-5 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                    Séance en cours
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{resumeSessionLabel}</div>
                  <div className="text-sm text-gray-600">Continue exactement là où tu t&apos;es arrêté.</div>
                </div>
                <Link href={resumeSessionHref} className="btn-primary px-4 py-2 text-sm">
                  Reprendre la séance
                </Link>
              </div>
            </div>
          )}
          {renderSection()}
        </main>
      </div>
      <Footer />
      {tourStep != null && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-end lg:items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Visite guidée {tourStep}/3
            </div>
            {tourStep === 1 && (
              <>
                <div className="mt-2 text-xl font-semibold text-gray-900">Naviguer rapidement</div>
                <p className="mt-2 text-sm text-gray-600">
                  Utilise la barre latérale pour passer entre Dashboard, recommandations, programmes et routines.
                </p>
              </>
            )}
            {tourStep === 2 && (
              <>
                <div className="mt-2 text-xl font-semibold text-gray-900">Lancer une séance</div>
                <p className="mt-2 text-sm text-gray-600">
                  Démarre ou reprends une séance pour activer le timer de repos et le suivi.
                </p>
              </>
            )}
            {tourStep === 3 && (
              <>
                <div className="mt-2 text-xl font-semibold text-gray-900">Créer ta routine</div>
                <p className="mt-2 text-sm text-gray-600">
                  Compose une routine personnalisée et démarre-la en un clic.
                </p>
              </>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <button
                className="text-sm font-semibold text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setTourStep(null)
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('fitpulse_tour_seen_v1', 'true')
                  }
                }}
              >
                Passer
              </button>
              <div className="flex gap-2">
                {tourStep === 2 && (
                  <button
                    className="btn-secondary text-sm px-4 py-2"
                    onClick={() => scheduleSection('session')}
                  >
                    Aller aux séances
                  </button>
                )}
                {tourStep === 3 && (
                  <button
                    className="btn-secondary text-sm px-4 py-2"
                    onClick={() => scheduleSection('routines')}
                  >
                    Voir les routines
                  </button>
                )}
                <button
                  className="btn-primary text-sm px-4 py-2"
                  onClick={() => {
                    const next = tourStep + 1
                    if (next > 3) {
                      setTourStep(null)
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('fitpulse_tour_seen_v1', 'true')
                      }
                    } else {
                      setTourStep(next)
                      if (next === 2) scheduleSection('session')
                      if (next === 3) scheduleSection('routines')
                    }
                  }}
                >
                  {tourStep === 3 ? 'Terminer' : 'Suivant'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
