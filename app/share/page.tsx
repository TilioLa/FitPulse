import { Suspense } from 'react'
import Footer from '@/components/Footer'
import ShareSessionView from '@/components/share/ShareSessionView'

export default function SharePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12 px-4">
        <Suspense
          fallback={
            <div className="max-w-3xl mx-auto">
              <div className="card-soft">
                <div className="skeleton-line h-7 w-1/3 mb-3" />
                <div className="skeleton-line w-2/3 mb-2" />
                <div className="skeleton-line w-1/2" />
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="skeleton h-20" />
                  <div className="skeleton h-20" />
                  <div className="skeleton h-20" />
                </div>
              </div>
            </div>
          }
        >
          <ShareSessionView />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
