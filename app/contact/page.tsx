import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact</h1>
            <p className="text-gray-700 mb-2">Email: contact@fitpulse.fr</p>
            <p className="text-gray-700">Nous repondons sous 24h ouvrables.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
