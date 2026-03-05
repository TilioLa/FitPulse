import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-3">Mentions légales</h1>
          <p className="section-subtitle mb-6">Informations légales de l&apos;éditeur et de l&apos;hébergement FitPulse.</p>

          <div className="card space-y-6 text-gray-700">
            <section id="legal-editor">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Éditeur</h2>
              <p>FitPulse SAS, 10 rue de la Santé, 75014 Paris.</p>
              <p>SIRET : 123 456 789 00010.</p>
              <p>Responsable de publication : Équipe FitPulse.</p>
            </section>

            <section id="legal-hosting">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Hébergement</h2>
              <p>Ce site est hébergé par un prestataire cloud conforme aux standards européens.</p>
            </section>

            <section id="legal-contact">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Contact</h2>
              <p>Email : <a className="text-primary-700 hover:text-primary-800" href="mailto:fitpulset@gmail.com">fitpulset@gmail.com</a></p>
            </section>
          </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
