'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { decodeSharedSession } from '@/lib/session-share'
import { muscleLabel } from '@/lib/muscles'

export default function ShareSessionView() {
  const params = useSearchParams()
  const token = params.get('s') || ''
  const session = useMemo(() => decodeSharedSession(token), [token])

  if (!session) {
    return (
      <div className="card-soft max-w-xl text-center">
        <h1 className="section-title mb-3">Lien invalide</h1>
        <p className="text-gray-600 mb-6">Ce partage n&apos;est pas disponible.</p>
        <Link href="/" className="btn-primary">
          Retour à FitPulse
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card-soft">
        <h1 className="section-title mb-2">Séance partagée</h1>
        <p className="text-gray-600">
          Par <span className="font-semibold text-gray-900">{session.author}</span> · {new Date(session.date).toLocaleDateString('fr-FR')}
        </p>
      </div>

      <div className="card-soft">
        <h2 className="text-2xl font-semibold text-gray-900">{session.workoutName}</h2>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Durée</div>
            <div className="font-semibold text-gray-900">{session.duration} min</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Poids total</div>
            <div className="font-semibold text-gray-900">{session.volume} kg</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <div className="text-xs text-gray-500">Calories</div>
            <div className="font-semibold text-gray-900">{session.calories} kcal</div>
          </div>
        </div>
      </div>

      <div className="card-soft">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Muscles sollicités</h3>
        <div className="space-y-3">
          {session.muscleUsage
            .slice()
            .sort((a, b) => b.percent - a.percent)
            .map((muscle) => (
              <div key={muscle.id}>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>{muscleLabel(muscle.id, 'fr')}</span>
                  <span>{muscle.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-600" style={{ width: `${muscle.percent}%` }} />
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/" className="btn-primary">
          Rejoindre FitPulse
        </Link>
      </div>
    </div>
  )
}
