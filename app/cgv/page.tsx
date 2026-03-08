import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CgvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Conditions generales de vente</h1>
            <p className="text-gray-700">
              Cette page est un placeholder a completer avec les CGV officielles.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
