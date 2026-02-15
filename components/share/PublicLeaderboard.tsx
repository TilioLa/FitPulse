'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { readFollowedProfiles, toggleFollowProfile } from '@/lib/public-profile-follow'

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
  const [sort, setSort] = useState<'sessions' | 'volume' | 'pr'>('sessions')
  const [items, setItems] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/profile/public/leaderboard?period=${period}&sort=${sort}&limit=10`)
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
  }, [period, sort])

  useEffect(() => {
    const apply = () => setFollowedSlugs(readFollowedProfiles())
    apply()
    window.addEventListener('fitpulse-followed-profiles', apply)
    return () => window.removeEventListener('fitpulse-followed-profiles', apply)
  }, [])

  const followedItems = items.filter((item) => followedSlugs.includes(item.slug))
  const followedOnlySlugs = followedSlugs.filter((slug) => !followedItems.some((item) => item.slug === slug))

  return (
    <div className="card-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Top profils {period === 'week' ? 'de la semaine' : 'du mois'}</h2>
        <div className="flex flex-wrap items-center gap-2">
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
          <button
            type="button"
            onClick={() => setSort('sessions')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              sort === 'sessions' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            Séances
          </button>
          <button
            type="button"
            onClick={() => setSort('volume')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              sort === 'volume' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            Volume
          </button>
          <button
            type="button"
            onClick={() => setSort('pr')}
            className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
              sort === 'pr' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-300 text-gray-600'
            }`}
          >
            PR
          </button>
        </div>
      </div>

      {(followedItems.length > 0 || followedOnlySlugs.length > 0) && (
        <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50 p-3">
          <div className="text-sm font-semibold text-primary-800 mb-2">Profils suivis</div>
          <div className="flex flex-wrap gap-2">
            {followedItems.map((item) => (
              <Link key={item.slug} href={`/u/${item.slug}`} className="px-3 py-1 rounded-full bg-white border border-primary-200 text-primary-700 text-xs font-semibold">
                {item.author}
              </Link>
            ))}
            {followedOnlySlugs.map((slug) => (
              <Link key={slug} href={`/u/${slug}`} className="px-3 py-1 rounded-full bg-white border border-primary-200 text-primary-700 text-xs font-semibold">
                {slug}
              </Link>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Chargement du classement...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Aucune séance partagée pour le moment.</div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.slug} className="rounded-lg border border-gray-200 bg-white px-3 py-3 hover:border-primary-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link href={`/u/${item.slug}`} className="text-sm font-semibold text-gray-900 hover:text-primary-700">
                    #{index + 1} {item.author}
                  </Link>
                  <div className="text-xs text-gray-500">
                    {item.sessions} séances · {item.duration} min
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600">
                  <div>Volume: {item.volume} kg</div>
                  <div>PR: {item.bestPrKg} kg</div>
                </div>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleFollowProfile(item.slug)
                    setFollowedSlugs(readFollowedProfiles())
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    followedSlugs.includes(item.slug)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {followedSlugs.includes(item.slug) ? 'Suivi' : 'Suivre'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
