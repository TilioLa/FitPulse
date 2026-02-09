import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Mentions légales</h1>

          <div className="card space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Éditeur</h2>
              <p>FitPulse SAS, 10 rue de la Santé, 75014 Paris.</p>
              <p>SIRET : 123 456 789 00010.</p>
              <p>Responsable de publication : Équipe FitPulse.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hébergement</h2>
              <p>Ce site est hébergé par un prestataire cloud conforme aux standards européens.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Contact</h2>
              <p>Email : contact@fitpulse.fr</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
