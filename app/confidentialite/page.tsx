import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-6">Politique de confidentialité</h1>

          <div className="card space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Données collectées</h2>
              <p>
                Nous collectons uniquement les informations nécessaires à la création de votre compte et au suivi de
                vos entraînements (nom, email, préférences, historique de séances).
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Utilisation</h2>
              <p>
                Les données sont utilisées pour personnaliser vos programmes, mesurer vos progrès et améliorer
                l&apos;expérience FitPulse.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Sécurité</h2>
              <p>
                Nous appliquons des mesures de sécurité adaptées pour protéger vos données. Dans cette démo, les données
                sont stockées localement dans votre navigateur via localStorage.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Vos droits</h2>
              <p>
                Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en nous contactant.
              </p>
            </section>
          </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
