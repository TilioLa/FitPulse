'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import MySessions from '@/components/dashboard/MySessions'
import History from '@/components/dashboard/History'
import RecommendedPrograms from '@/components/dashboard/RecommendedPrograms'
import Settings from '@/components/dashboard/Settings'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type DashboardSection = 'sessions' | 'history' | 'programs' | 'settings'

export default function DashboardPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<DashboardSection>('sessions')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('fitpulse_user')
    if (!user) {
      router.push('/connexion')
      return
    }
    setIsLoggedIn(true)
  }, [router])

  if (!isLoggedIn) {
    return null
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'sessions':
        return <MySessions />
      case 'history':
        return <History />
      case 'programs':
        return <RecommendedPrograms />
      case 'settings':
        return <Settings />
      default:
        return <MySessions />
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-grow">
        <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
        <main className="flex-grow p-6 lg:p-8">{renderSection()}</main>
      </div>
      <Footer />
    </div>
  )
}
