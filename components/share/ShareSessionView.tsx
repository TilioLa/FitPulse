'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { decodeSharedSession, type SharedSessionPayload } from '@/lib/session-share'
import { muscleLabel } from '@/lib/muscles'
import PublicLeaderboard from '@/components/share/PublicLeaderboard'

export default function ShareSessionView() {
  const params = useSearchParams()
  const id = params.get('id') || ''
  const token = params.get('s') || ''
  const fallbackSession = useMemo(() => decodeSharedSession(token), [token])
  const [session, setSession] = useState<SharedSessionPayload | null>(fallbackSession)
  const [loading, setLoading] = useState(Boolean(id))

  useEffect(() => {
    if (!id) {
      setSession(fallbackSession)
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/share/${encodeURIComponent(id)}`)
        if (!response.ok) {
          if (active) setSession(fallbackSession)
          return
        }
        const data = (await response.json().catch(() => ({}))) as { session?: SharedSessionPayload }
        if (active) {
          setSession(data?.session || fallbackSession)
        }
      } catch {
        if (active) setSession(fallbackSession)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [id, fallbackSession])

  const isDiscoveryMode = !id && !token

  if (isDiscoveryMode) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card-soft">
          <h1 className="section-title mb-2">Partages FitPulse</h1>
          <p className="text-gray-600">Découvre les profils les plus actifs et leurs séances partagées.</p>
        </div>
        <PublicLeaderboard />
      </div>
    )
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto text-gray-600">Chargement du partage...</div>
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card-soft max-w-xl text-center mx-auto">
          <h1 className="section-title mb-3">Lien invalide</h1>
          <p className="text-gray-600 mb-6">Ce partage n&apos;est pas disponible.</p>
          <Link href="/" className="btn-primary">
            Retour à FitPulse
          </Link>
        </div>
        <PublicLeaderboard />
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
        {session.authorSlug && (
          <div className="mt-2">
            <Link href={`/u/${session.authorSlug}`} className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Voir le profil public
            </Link>
          </div>
        )}
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
