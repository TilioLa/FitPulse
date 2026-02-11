import Footer from '@/components/Footer'
import PricingPlans from '@/components/pricing/PricingPlans'
import PricingFeatures from '@/components/pricing/PricingFeatures'

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Tarifs simples et transparents
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Vous pouvez changer ou annuler à tout moment.
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
