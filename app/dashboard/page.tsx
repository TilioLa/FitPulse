'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/dashboard/Sidebar'
import Footer from '@/components/Footer'
import { useAuth } from '@/components/SupabaseAuthProvider'
import SectionSkeleton from '@/components/dashboard/SectionSkeleton'

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

type DashboardSection = 'feed' | 'history' | 'session' | 'programs' | 'routines' | 'settings' | 'exercises'

export default function DashboardPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<DashboardSection>('feed')
  const { status } = useAuth()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [router, status])

  const scheduleSection = (section: DashboardSection) => {
    queueMicrotask(() => {
      setActiveSection((prev) => (prev !== section ? section : prev))
    })
  }

  useEffect(() => {
    if (status !== 'authenticated') return
    const view = new URLSearchParams(window.location.search).get('view')
    if (view === 'session') {
      scheduleSection('session')
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
  }, [status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement du dashboard...
      </div>
    )
  }

  if (status === 'unauthenticated') {
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Chargement du dashboard...</div>}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex flex-col lg:flex-row flex-grow">
          <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
          <main className="flex-grow min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
            {renderSection()}
          </main>
        </div>
        <Footer />
      </div>
    </Suspense>
  )
}
