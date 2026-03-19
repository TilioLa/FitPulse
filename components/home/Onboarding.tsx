'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Target, CalendarCheck, Rocket, Sparkles } from 'lucide-react'
import { programs } from '@/data/programs'
import { recommendProgram } from '@/lib/recommendation'
import { readLocalSettings } from '@/lib/user-state-store'

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const personalizedPick = useMemo(() => {
    if (!mounted) return null
    const settings = readLocalSettings() as {
      level?: string
      goals?: string[]
      goal?: string
      equipment?: string[]
      sessionsPerWeek?: number
    }
    const goals = Array.isArray(settings.goals) && settings.goals.length > 0
      ? settings.goals
      : settings.goal
      ? [settings.goal]
      : []
    return recommendProgram(programs, {
      level: settings.level,
      goals,
      equipment: settings.equipment,
      sessionsPerWeek: settings.sessionsPerWeek,
    })?.program || null
  }, [mounted])

  return (
    <section className="py-14 sm:py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 reveal">
              Un parcours simple, des résultats visibles
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl reveal reveal-1">
              Pas de jargon, pas de confusion. Tu sais quoi faire dès aujourd&apos;hui.
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

        {personalizedPick && (
          <div className="mt-8 rounded-3xl border border-primary-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommandation immédiate
                </div>
                <h3 className="mt-3 text-xl font-semibold text-gray-900">{personalizedPick.name}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {personalizedPick.sessionsPerWeek} séances par semaine, {personalizedPick.equipment.toLowerCase()}.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={`/programmes/${personalizedPick.slug}`} className="btn-secondary text-center">
                  Voir pourquoi
                </Link>
                <Link href="/dashboard?view=programs" className="btn-primary text-center">
                  Lancer ce parcours
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
