import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function CgvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-3">Conditions générales de vente</h1>
          <p className="section-subtitle mb-6">Version simplifiée de nos conditions d&apos;utilisation commerciale.</p>

          <div className="card mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">Sommaire</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="#cgv-objet" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Objet</a>
              <a href="#cgv-tarification" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Tarification</a>
              <a href="#cgv-paiements" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Paiements</a>
              <a href="#cgv-support" className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">Support</a>
            </div>
          </div>

          <div className="card space-y-6 text-gray-700">
            <section id="cgv-objet">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Objet</h2>
              <p>
                Les présentes conditions encadrent l&apos;accès aux services FitPulse.
              </p>
            </section>

            <section id="cgv-tarification">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Tarification</h2>
              <p>
                À ce jour, FitPulse est accessible gratuitement. Si une offre payante est proposée plus tard, ces
                conditions seront mises à jour.
              </p>
            </section>

            <section id="cgv-paiements">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Paiements</h2>
              <p>
                Aucun paiement n&apos;est requis pour utiliser l&apos;application actuellement.
              </p>
            </section>

            <section id="cgv-support">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Support</h2>
              <p>
                Notre équipe reste disponible pour toute question à l&apos;adresse fitpulset@gmail.com.
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
