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
                Les présentes conditions encadrent l'accès aux services FitPulse et les modalités d'abonnement aux
                offres payantes.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Abonnements</h2>
              <p>
                Les abonnements sont sans engagement et peuvent être annulés à tout moment. Les tarifs affichés sont
                exprimés en euros et peuvent évoluer.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Paiements</h2>
              <p>
                Dans cette version démo, les paiements sont simulés et aucune transaction réelle n'est effectuée.
              </p>
            </section>

            <section>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Support</h2>
              <p>
                Notre équipe reste disponible pour toute question à l'adresse fitpulset@gmail.com.
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
