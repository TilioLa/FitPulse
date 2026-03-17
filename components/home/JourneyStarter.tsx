'use client'

import Link from 'next/link'
import { ArrowRight, CheckSquare, CalendarCheck, Compass, Play } from 'lucide-react'
import { useMemo } from 'react'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { programs } from '@/data/programs'
import { recommendProgram } from '@/lib/recommendation'
import { readLocalSettings } from '@/lib/user-state-store'

const steps = ['Choisir ton objectif', 'Planifier tes séances', 'Lancer la séance']

type LocalSettings = {
  level?: string
  goals?: string[]
  equipment?: string[]
  sessionsPerWeek?: number
}

export default function JourneyStarter() {
  const recommendedProgram = useMemo(() => {
    if (typeof window === 'undefined') {
      return programs[0]
    }
    try {
      const settings = readLocalSettings() as LocalSettings
      const recommendation = recommendProgram(programs, {
        level: settings?.level,
        goals: settings?.goals,
        equipment: settings?.equipment,
        sessionsPerWeek: settings?.sessionsPerWeek,
      })
      return recommendation?.program || programs[0]
    } catch {
      return programs[0]
    }
  }, [])

  const sessionCount = recommendedProgram.sessionsPerWeek
  const nextSessionName = recommendedProgram.sessions[0]?.name || 'Séance d&apos;introduction'
  const description = recommendedProgram.description

  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-primary-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8 mb-10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Starter kit</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-2xl">
              Ton parcours FitPulse en 3 étapes
            </h2>
            <p className="text-gray-600 max-w-2xl">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full lg:w-auto">
            <StartProgramButton
              program={recommendedProgram}
              label="Démarrer la séance"
              className="btn-primary w-full lg:w-auto"
            />
            <Link
              href={`/programmes/${recommendedProgram.slug}`}
              className="inline-flex items-center justify-center gap-2 btn-secondary w-full lg:w-auto border-white text-gray-900"
            >
              Voir le programme
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {steps.map((label, index) => (
            <div
              key={label}
              className="card bg-white shadow-sm border border-white"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-full bg-primary-100 text-primary-700 p-2">
                  {index === 0 && <Compass className="h-5 w-5" />}
                  {index === 1 && <CalendarCheck className="h-5 w-5" />}
                  {index === 2 && <Play className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
              </div>
              <p className="text-sm text-gray-600">
                {index === 0 && `Objectif : ${recommendedProgram.goals[0] || 'Programmes combinés'}`}
                {index === 1 && `${sessionCount} séances / semaine`}
                {index === 2 && `Séance recommandée : ${nextSessionName}`}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white shadow-sm border border-white flex items-center gap-3">
            <CheckSquare className="h-6 w-6 text-primary-600" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Planification</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{sessionCount} séances / semaine</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white shadow-sm border border-white flex items-center gap-3">
            <CheckSquare className="h-6 w-6 text-primary-600" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Durée</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{recommendedProgram.duration}</div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white shadow-sm border border-white flex items-center gap-3">
            <CheckSquare className="h-6 w-6 text-primary-600" />
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider">Matériel</div>
              <div className="text-base sm:text-lg font-semibold text-gray-900">{recommendedProgram.equipment}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
