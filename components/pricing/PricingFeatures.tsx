import { Shield, RefreshCw, Headphones } from 'lucide-react'

const guarantees = [
  {
    icon: <Shield className="h-10 w-10 text-primary-600" />,
    title: 'Accès gratuit',
    description: 'Toutes les fonctionnalités essentielles sont disponibles sans paiement.'
  },
  {
    icon: <RefreshCw className="h-10 w-10 text-primary-600" />,
    title: 'Évolutions continues',
    description: 'De nouvelles fonctionnalités sont ajoutées régulièrement sans changer ton accès.'
  },
  {
    icon: <Headphones className="h-10 w-10 text-primary-600" />,
    title: 'Support réactif',
    description: 'Notre équipe est là pour vous aider. Réponse garantie sous 24h.'
  }
]

export default function PricingFeatures() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
        Pourquoi choisir FitPulse ?
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {guarantees.map((guarantee, index) => (
          <div key={index} className="text-center">
            <div className="inline-block mb-4">{guarantee.icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {guarantee.title}
            </h3>
            <p className="text-gray-600">
              {guarantee.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center bg-primary-50 rounded-lg p-6">
        <p className="text-lg text-gray-700 mb-2">
          <strong>Utilisation 100% gratuite</strong>
        </p>
        <p className="text-gray-600">
          La monétisation pourra être ajoutée plus tard, mais pour l’instant FitPulse reste entièrement gratuit.
        </p>
      </div>
    </div>
  )
}
