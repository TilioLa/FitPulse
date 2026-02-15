import Footer from '@/components/Footer'
import PricingPlans from '@/components/pricing/PricingPlans'
import PricingFeatures from '@/components/pricing/PricingFeatures'
import PricingBackButton from '@/components/pricing/PricingBackButton'

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <PricingBackButton />
          </div>
          <div className="mb-8 rounded-2xl border border-primary-200 bg-primary-50 px-6 py-4 text-center">
            <div className="text-sm font-semibold uppercase tracking-wide text-primary-700">Modèle actuel</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">Accès complet gratuit</div>
            <p className="text-sm text-gray-700 mt-1">
              Aucun plan payant actif pour le moment. Toutes les fonctionnalités sont incluses.
            </p>
          </div>
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              FitPulse est gratuit
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tu as accès à tous les programmes et à toutes les stats sans abonnement.
            </p>
          </div>
          <PricingPlans />
          <PricingFeatures />
        </div>
      </main>
      <Footer />
    </div>
  )
}
