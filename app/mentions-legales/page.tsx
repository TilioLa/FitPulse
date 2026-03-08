import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
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
      <Footer />
    </div>
  )
}
