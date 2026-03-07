'use client'

import { useEffect, useState } from 'react'
import { Flame, Trophy } from 'lucide-react'
import { computeHistoryStats, type WorkoutHistoryItem } from '@/lib/history'

export default function StreakBadge() {
  const [streak, setStreak] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('fitpulse_history')
        const history = raw ? (JSON.parse(raw) as WorkoutHistoryItem[]) : []
        const stats = computeHistoryStats(history)
        setStreak(stats.streak)
        setTotal(stats.totalWorkouts)
      } catch {
        setStreak(0)
        setTotal(0)
      }
    }
    load()
    window.addEventListener('fitpulse-history', load)
    window.addEventListener('storage', load)
    return () => {
      window.removeEventListener('fitpulse-history', load)
      window.removeEventListener('storage', load)
    }
  }, [])

  return (
    <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-left">
      <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-3">
        <div className="inline-flex items-center gap-2 text-xs text-primary-100">
          <Flame className="h-4 w-4" /> Streak
        </div>
        <div className="mt-1 text-2xl font-bold text-white">{streak}</div>
      </div>
      <div className="rounded-xl border border-white/30 bg-white/10 px-3 py-3">
        <div className="inline-flex items-center gap-2 text-xs text-primary-100">
          <Trophy className="h-4 w-4" /> Séances
        </div>
        <div className="mt-1 text-2xl font-bold text-white">{total}</div>
      </div>
    </div>
  )
}
