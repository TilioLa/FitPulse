'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, X, Zap, Crown, ArrowRight } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { ensureTrialStarted, getEntitlement, setStoredPlan } from '@/lib/subscription'

const plans = [
  {
    id: 'free',
    name: 'Gratuit',
    icon: <Zap className="h-8 w-8" />,
    price: '0',
    period: 'Toujours gratuit',
    description: 'Parfait pour commencer votre parcours fitness',
    features: [
      { text: '1 programme complet', included: true },
      { text: 'Accès au dashboard de base', included: true },
      { text: 'Suivi des séances', included: true },
      { text: 'Historique limité (10 séances)', included: true },
      { text: 'Programmes premium', included: false },
      { text: 'Statistiques avancées', included: false },
      { text: 'Support prioritaire', included: false },
      { text: 'Accès illimité à tous les programmes', included: false },
    ],
    cta: 'Commencer gratuitement',
    popular: false,
    color: 'from-gray-400 to-gray-500',
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: <Crown className="h-8 w-8" />,
    price: '9.99',
    period: 'par mois',
    description: 'Pour ceux qui veulent aller plus loin',
    features: [
      { text: 'Tous les programmes disponibles', included: true },
      { text: 'Dashboard complet et avancé', included: true },
      { text: 'Historique illimité', included: true },
      { text: 'Statistiques détaillées', included: true },
      { text: 'Programmes personnalisés', included: true },
      { text: 'Support par email', included: true },
      { text: 'Export des données', included: true },
      { text: 'Support prioritaire 24/7', included: false },
    ],
    cta: 'Commencer Pro',
    popular: true,
    color: 'from-primary-500 to-primary-600',
  },
  {
    id: 'proplus',
    name: 'Pro+',
    icon: <Crown className="h-8 w-8" />,
    price: '19.99',
    period: 'par mois',
    description: 'Pour les plus motivés',
    features: [
      { text: 'Tout ce qui est inclus dans Pro', included: true },
      { text: 'Coaching personnalisé 1 à 1', included: true },
      { text: 'Support prioritaire 24/7', included: true },
      { text: 'Programmes exclusifs', included: true },
      { text: 'Analyses nutritionnelles', included: true },
      { text: 'Vidéos HD en exclusivité', included: true },
      { text: 'Communauté privée', included: true },
      { text: 'Sessions live avec coachs', included: true },
    ],
    cta: 'Commencer Pro+',
    popular: false,
    color: 'from-accent-500 to-accent-600',
  },
]

export default function PricingPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { push } = useToast()

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId)

    if (planId === 'free') {
      setStoredPlan('free')
      ensureTrialStarted()
      push('Plan gratuit sélectionné. Créez un compte pour commencer.', 'info')
      return
    }

    if (process.env.NEXT_PUBLIC_ENABLE_BILLING !== 'true') {
      setStoredPlan(planId === 'proplus' ? 'proplus' : 'pro')
      ensureTrialStarted()
      const entitlement = getEntitlement()
      push(
        entitlement.isTrialActive
          ? `Mode démo activé. Essai premium: ${entitlement.trialDaysLeft} jour(s) restant(s).`
          : 'Mode démo activé. Plan premium local appliqué.',
        'success'
      )
      return
    }

    try {
      setIsLoading(planId)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erreur serveur')
      }

      const data = await response.json()
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'initier le paiement. Réessayez."
      push(message, 'error')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {plans.map((plan, index) => (
        <div
          key={plan.id}
          className={`card relative reveal ${plan.popular ? 'ring-4 ring-primary-500 scale-105' : ''} ${
            selectedPlan === plan.id ? 'ring-4 ring-primary-500' : ''
          }`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Le plus populaire
              </span>
            </div>
          )}

          <div className={`h-2 bg-gradient-to-r ${plan.color} rounded-t-xl -m-6 mb-6`}></div>

          <div className="text-center mb-6">
            <div className="inline-block mb-4 text-primary-600">{plan.icon}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-4">{plan.description}</p>
            <div className="mb-2">
              <span className="text-5xl font-bold text-gray-900">{plan.price}€</span>
              {plan.period && <span className="text-gray-600 ml-2">{plan.period}</span>}
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                {feature.included ? (
                  <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                )}
                <span className={feature.included ? 'text-gray-700' : 'text-gray-400 line-through'}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {plan.id === 'free' ? (
            <Link
              href="/inscription"
              className={`w-full py-3 rounded-lg font-semibold transition-all text-center inline-flex items-center justify-center space-x-2 active:scale-[0.98] ${
                plan.popular
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              <span>{plan.cta}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={() => handleSelectPlan(plan.id)}
              disabled={isLoading === plan.id}
              className={`w-full py-3 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] ${
                plan.popular
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {isLoading === plan.id ? 'Redirection...' : plan.cta}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
