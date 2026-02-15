'use client'

import Link from 'next/link'
import { Check, ArrowRight, Zap } from 'lucide-react'

const features = [
  'Tous les programmes (poids du corps, élastiques, haltères, machines)',
  'Dashboard complet et statistiques',
  'Historique illimité',
  'Routines personnalisées illimitées',
  'Partage public de séances et profil',
  'Rappels et notifications',
]

export default function PricingPlans() {
  return (
    <div className="max-w-3xl mx-auto mb-16">
      <div className="card relative reveal ring-2 ring-primary-500">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
            Accès complet gratuit
          </span>
        </div>

        <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-xl -m-6 mb-6"></div>

        <div className="text-center mb-6">
          <div className="inline-block mb-4 text-primary-600">
            <Zap className="h-8 w-8" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">FitPulse</h3>
          <p className="text-gray-600 mb-4">Toutes les fonctionnalités sont disponibles gratuitement.</p>
          <div className="mb-2">
            <span className="text-5xl font-bold text-gray-900">0€</span>
            <span className="text-gray-600 ml-2">pour tous</span>
          </div>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((feature) => (
            <li key={feature} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href="/inscription"
          className="w-full py-3 rounded-lg font-semibold transition-all text-center inline-flex items-center justify-center space-x-2 active:scale-[0.98] bg-primary-600 text-white hover:bg-primary-700"
        >
          <span>Commencer gratuitement</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
