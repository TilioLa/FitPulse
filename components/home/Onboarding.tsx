import Link from 'next/link'
import { CheckCircle2, Target, CalendarCheck, Rocket } from 'lucide-react'

const steps = [
  {
    title: '1. Choisis ton objectif',
    description: 'Perte de poids, force, mobilité ou cardio. On te guide.',
    icon: Target,
  },
  {
    title: '2. Planifie tes séances',
    description: 'Programme clair, séances courtes et réalisables.',
    icon: CalendarCheck,
  },
  {
    title: '3. Exécute sans te poser de questions',
    description: 'Vidéos, reps, temps de repos et progression.',
    icon: CheckCircle2,
  },
]

export default function Onboarding() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3 reveal">
              Un parcours simple, des résultats visibles
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl reveal reveal-1">
              Pas de jargon, pas de confusion. Tu sais quoi faire dès aujourd'hui.
            </p>
          </div>
          <Link href="/inscription" className="btn-primary inline-flex items-center space-x-2 reveal reveal-2">
            <span>Commencer maintenant</span>
            <Rocket className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div
                key={step.title}
                className="card reveal"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="mb-4 inline-flex rounded-full bg-primary-100 p-3">
                  <Icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
