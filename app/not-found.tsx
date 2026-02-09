import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16">
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-primary-600 mb-2">Erreur 404</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Page introuvable</h1>
          <p className="text-gray-600 mb-6">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
          <Link href="/" className="btn-primary">
            Retour à l'accueil
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
