import { Suspense } from 'react'
import Footer from '@/components/Footer'
import ShareSessionView from '@/components/share/ShareSessionView'

export default function SharePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12 px-4">
        <Suspense fallback={<div className="max-w-3xl mx-auto text-gray-600">Chargement du partage...</div>}>
          <ShareSessionView />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
