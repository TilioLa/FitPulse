<<<<<<< HEAD
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
=======
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b

export default function CgvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
<<<<<<< HEAD
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Conditions generales de vente</h1>
            <p className="text-gray-700">
              Cette page est un placeholder a completer avec les CGV officielles.
            </p>
          </div>
        </div>
      </main>
=======
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
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
      <Footer />
    </div>
  )
}
