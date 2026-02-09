import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function CgvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Conditions générales de vente</h1>

          <div className="card space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Objet</h2>
              <p>
                Les présentes conditions encadrent l'accès aux services FitPulse et les modalités d'abonnement aux
                offres payantes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Abonnements</h2>
              <p>
                Les abonnements sont sans engagement et peuvent être annulés à tout moment. Les tarifs affichés sont
                exprimés en euros et peuvent évoluer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Paiements</h2>
              <p>
                Dans cette version démo, les paiements sont simulés et aucune transaction réelle n'est effectuée.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Support</h2>
              <p>
                Notre équipe reste disponible pour toute question à l'adresse contact@fitpulse.fr.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
