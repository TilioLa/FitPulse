import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProgramsList from '@/components/programmes/ProgramsList'

export default function ProgrammesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Tous nos programmes
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le programme qui correspond à votre niveau, vos objectifs et le matériel dont vous disposez
            </p>
          </div>
          <ProgramsList />
        </div>
      </main>
      <Footer />
    </div>
  )
}
