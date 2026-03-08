import Link from 'next/link'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow flex items-center justify-center py-16">
          <div className="text-center px-4">
          <p className="text-sm font-semibold text-primary-600 mb-2">Erreur 404</p>
          <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900 mb-4">
            Page introuvable
          </h1>
          <p className="text-gray-600 mb-6">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <Link href="/" className="btn-primary">
            Retour à l&apos;accueil
          </Link>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
