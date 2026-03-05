import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-3">Politique de confidentialité</h1>
          <p className="section-subtitle mb-6">Transparence sur les données utilisées pour personnaliser ton expérience.</p>

          <div className="card mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Sommaire</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="#privacy-data" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Données</a>
              <a href="#privacy-usage" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Utilisation</a>
              <a href="#privacy-security" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Sécurité</a>
              <a href="#privacy-rights" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Vos droits</a>
            </div>
          </div>

          <div className="card space-y-6 text-gray-700">
            <section id="privacy-data">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Données collectées</h2>
              <p>
                Nous collectons uniquement les informations nécessaires à la création de votre compte et au suivi de
                vos entraînements (nom, email, préférences, historique de séances).
              </p>
            </section>

            <section id="privacy-usage">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Utilisation</h2>
              <p>
                Les données sont utilisées pour personnaliser vos programmes, mesurer vos progrès et améliorer
                l&apos;expérience FitPulse.
              </p>
            </section>

            <section id="privacy-security">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Sécurité</h2>
              <p>
                Nous appliquons des mesures de sécurité adaptées pour protéger vos données. Dans cette démo, les données
                sont stockées localement dans votre navigateur via localStorage.
              </p>
            </section>

            <section id="privacy-rights">
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
