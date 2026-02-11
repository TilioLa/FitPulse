'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import ProgramsList from '@/components/programmes/ProgramsList'
// Social feed removed for now
import Footer from '@/components/Footer'
import { useSession } from 'next-auth/react'
import CustomRoutines from '@/components/dashboard/CustomRoutines'
import Feed from '@/components/dashboard/Feed'
import History from '@/components/dashboard/History'
import MySessions from '@/components/dashboard/MySessions'
import Settings from '@/components/dashboard/Settings'

type DashboardSection = 'feed' | 'history' | 'session' | 'programs' | 'routines' | 'settings' | 'exercises'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeSection, setActiveSection] = useState<DashboardSection>('feed')
  const { status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/connexion')
    }
  }, [router, status])

  useEffect(() => {
    if (status !== 'authenticated') return
    const view = searchParams?.get('view')
    if (view === 'session') {
      setActiveSection('session')
      return
    }
    try {
      const stored = localStorage.getItem('fitpulse_current_workout')
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (parsed?.status === 'in_progress') {
        setActiveSection('session')
      }
    } catch {
      // ignore
    }
  }, [searchParams, status])

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex flex-grow">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-grow p-6 lg:p-8">
          {renderSection()}
        </main>
      </div>
      <Footer />
    </div>
  )
}
