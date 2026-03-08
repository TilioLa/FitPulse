<<<<<<< HEAD
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
=======
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
<<<<<<< HEAD
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Mentions legales</h1>
            <p className="text-gray-700">
              Cette page est un placeholder a completer avec les mentions legales officielles.
            </p>
          </div>
        </div>
      </main>
=======
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-6">Mentions légales</h1>

          <div className="card space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Éditeur</h2>
              <p>FitPulse SAS, 10 rue de la Santé, 75014 Paris.</p>
              <p>SIRET : 123 456 789 00010.</p>
              <p>Responsable de publication : Équipe FitPulse.</p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Hébergement</h2>
              <p>Ce site est hébergé par un prestataire cloud conforme aux standards européens.</p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Contact</h2>
              <p>Email : fitpulset@gmail.com</p>
            </section>
          </div>
          </div>
        </main>
      </WithSidebar>
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
      <Footer />
    </div>
  )
}
