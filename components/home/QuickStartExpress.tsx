'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { applyOnboardingAnswers, getDefaultOnboardingAnswers, OnboardingAnswers } from '@/lib/onboarding'
import { trackEvent } from '@/lib/analytics-client'

const goals = ['Perte de poids', 'Prise de masse', 'Force', 'Cardio']
const levels = [
  { value: 'debutant', label: 'Débutant' },
  { value: 'intermediaire', label: 'Intermédiaire' },
  { value: 'avance', label: 'Avancé' },
]
const equipment = ['Poids du corps', 'Haltères', 'Barres', 'Machines de salle']

export default function QuickStartExpress() {
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    ...getDefaultOnboardingAnswers(),
    goal: 'Perte de poids',
  })

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          trackEvent('quickstart_open_click', { location: 'home' })
        }}
        className="btn-secondary inline-flex items-center gap-2"
      >
        <Zap className="h-4 w-4" />
        Plan express 10 sec
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4 flex items-end md:items-center justify-center">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Express</div>
            <h3 className="mt-1 text-xl font-semibold text-gray-900">Ton plan personnalisé en 3 choix</h3>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">Objectif</div>
                <div className="flex flex-wrap gap-2">
                  {goals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, goal }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        answers.goal === goal ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">Niveau</div>
                <div className="flex flex-wrap gap-2">
                  {levels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, level: level.value }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        answers.level === level.value ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800 mb-2">Matériel principal</div>
                <div className="flex flex-wrap gap-2">
                  {equipment.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, equipment: [item] }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        answers.equipment.includes(item)
                          ? 'border-primary-500 bg-primary-50 text-primary-800'
                          : 'border-gray-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <button
                type="button"
                className="text-sm font-semibold text-gray-500"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
              <button
                type="button"
                className="btn-primary text-sm px-4 py-2"
                onClick={() => {
                  applyOnboardingAnswers(answers)
                  trackEvent('quickstart_complete', {
                    goal: answers.goal,
                    level: answers.level,
                    equipment: answers.equipment[0] || 'Poids du corps',
                  })
                  setOpen(false)
                  window.location.href = '/dashboard?view=programs'
                }}
              >
                Générer mon plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
