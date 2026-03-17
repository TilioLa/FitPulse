'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
import Settings from '@/components/dashboard/Settings'
import { useAuth } from '@/components/SupabaseAuthProvider'

export default function SettingsPage() {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/connexion')
    }
  }, [router, status])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Chargement des paramètres...
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-6 lg:py-12">
          <Settings />
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}

