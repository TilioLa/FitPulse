'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { muscleLabel } from '@/lib/muscles'

type PublicSession = {
  id: string
  date: string
  workoutName: string
  duration: number
  volume: number
  calories: number
  bestPrKg: number
  muscleUsage: { id: string; percent: number }[]
}

type PublicProfile = {
  slug: string
  author: string
  totalShares: number
  totalVolume: number
  totalDuration: number
  bestPrKg: number
  sessions: PublicSession[]
}

export default function PublicProfileView() {
  const params = useParams<{ slug?: string }>()
  const slug = decodeURIComponent(params?.slug || '').trim()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/profile/public/${encodeURIComponent(slug)}`)
        if (!response.ok) {
          if (active) setProfile(null)
          return
        }
        const data = (await response.json().catch(() => ({}))) as { profile?: PublicProfile }
        if (active) setProfile(data?.profile || null)
      } catch {
        if (active) setProfile(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [slug])

  if (loading) {
    return <div className="max-w-4xl mx-auto text-gray-600">Chargement du profil public...</div>
  }

  if (!profile) {
    return (
      <div className="card-soft max-w-xl text-center">
        <h1 className="section-title mb-3">Profil introuvable</h1>
        <p className="text-gray-600 mb-6">Aucune séance partagée pour ce profil.</p>
        <Link href="/" className="btn-primary">
          Retour à FitPulse
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card-soft">
        <h1 className="section-title mb-2">{profile.author}</h1>
        <p className="text-gray-600">Profil public FitPulse</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-soft">
          <div className="text-xs text-gray-500">Séances partagées</div>
          <div className="text-2xl font-semibold text-gray-900">{profile.totalShares}</div>
        </div>
        <div className="card-soft">
          <div className="text-xs text-gray-500">Poids total</div>
          <div className="text-2xl font-semibold text-gray-900">{profile.totalVolume} kg</div>
        </div>
        <div className="card-soft">
          <div className="text-xs text-gray-500">Durée totale</div>
          <div className="text-2xl font-semibold text-gray-900">{profile.totalDuration} min</div>
        </div>
        <div className="card-soft">
          <div className="text-xs text-gray-500">Meilleur PR</div>
          <div className="text-2xl font-semibold text-gray-900">{profile.bestPrKg || 0} kg</div>
        </div>
      </div>

      <div className="space-y-4">
        {profile.sessions.map((session) => (
          <div key={session.id} className="card-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-900">{session.workoutName}</div>
                <div className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className="text-sm text-gray-600">
                {session.duration} min · {session.volume} kg · {session.calories} kcal
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              PR: {session.bestPrKg || 0} kg
            </div>
            <div className="mt-3 space-y-2">
              {session.muscleUsage
                .slice()
                .sort((a, b) => b.percent - a.percent)
                .slice(0, 3)
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
        ))}
      </div>
    </div>
  )
}
