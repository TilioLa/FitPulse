import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function CgvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
          <h1 className="section-title mb-6">Conditions générales de vente</h1>

          <div className="card space-y-6 text-gray-700">
            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Objet</h2>
              <p>
                Les présentes conditions encadrent l&apos;accès aux services FitPulse.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Tarification</h2>
              <p>
                À ce jour, FitPulse est accessible gratuitement. Si une offre payante est proposée plus tard, ces
                conditions seront mises à jour.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Paiements</h2>
              <p>
                Aucun paiement n&apos;est requis pour utiliser l&apos;application actuellement.
              </p>
            </section>

            <section>
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
