import { Suspense } from 'react'
import Footer from '@/components/Footer'
import PublicProfileView from '@/components/share/PublicProfileView'

export default function PublicProfilePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12 px-4">
        <Suspense fallback={<div className="max-w-4xl mx-auto text-gray-600">Chargement du profil...</div>}>
          <PublicProfileView />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
