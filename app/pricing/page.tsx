<<<<<<< HEAD
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PricingPlans from '@/components/pricing/PricingPlans'
import PricingFeatures from '@/components/pricing/PricingFeatures'

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center rounded-full bg-primary-100 px-4 py-1 text-sm font-semibold text-primary-700">
              Tarifs
            </span>
            <h1 className="mt-4 text-5xl font-bold text-gray-900">
              Choisis le plan adapte a ton rythme
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-xl text-gray-600">
              Commence gratuitement puis passe a une formule plus complete
              quand tu veux plus de programmes, de suivi et de personnalisation.
            </p>
          </div>

          <PricingPlans />
          <PricingFeatures />
        </div>
      </main>
      <Footer />
    </div>
  )
=======
import { redirect } from 'next/navigation'

export default function PricingPage() {
  redirect('/programmes')
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
}
