'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type LeaderboardItem = {
  slug: string
  author: string
  sessions: number
  volume: number
  duration: number
  bestPrKg: number
}

export default function PublicLeaderboard() {
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/profile/public/leaderboard?period=${period}&limit=10`)
        if (!response.ok) {
          if (active) setItems([])
          return
        }
        const data = (await response.json().catch(() => ({}))) as { leaderboard?: LeaderboardItem[] }
        if (active) {
          setItems(Array.isArray(data?.leaderboard) ? data.leaderboard : [])
        }
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [period])

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Top profils {period === 'week' ? 'de la semaine' : 'du mois'}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              period === 'week' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            7 jours
          </button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              period === 'month' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            30 jours
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Chargement du classement...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Aucune séance partagée pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <Link key={item.slug} href={`/u/${item.slug}`} className="block">
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 hover:border-primary-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      #{index + 1} {item.author}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.sessions} séances · {item.duration} min
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div>Volume: {item.volume} kg</div>
                    <div>PR: {item.bestPrKg} kg</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
