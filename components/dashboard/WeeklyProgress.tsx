'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, TrendingUp, Clock3, Dumbbell } from 'lucide-react'
import type { WorkoutHistoryItem } from '@/lib/history'

type WeekSummary = {
  label: string
  sessions: number
  minutes: number
  volume: number
}

function mondayStart(input: Date) {
  const d = new Date(input)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diff)
  return d
}

export default function WeeklyProgress() {
  const [history, setHistory] = useState<WorkoutHistoryItem[]>([])

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem('fitpulse_history')
        const data = raw ? (JSON.parse(raw) as WorkoutHistoryItem[]) : []
        setHistory(Array.isArray(data) ? data : [])
      } catch {
        setHistory([])
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

  const summaries = useMemo(() => {
    const currentStart = mondayStart(new Date())
    const previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - 7)

    const inWeek = (date: string, start: Date) => {
      const d = new Date(date)
      const end = new Date(start)
      end.setDate(start.getDate() + 7)
      return d >= start && d < end
    }

    const build = (start: Date): WeekSummary => {
      const items = history.filter((item) => inWeek(item.date, start))
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return {
        label: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        sessions: items.length,
        minutes: items.reduce((sum, item) => sum + (Number(item.duration) || 0), 0),
        volume: Math.round(items.reduce((sum, item: any) => sum + (Number(item.volume) || 0), 0)),
      }
    }

    return {
      current: build(currentStart),
      previous: build(previousStart),
    }
  }, [history])

  const sessionsDelta = summaries.current.sessions - summaries.previous.sessions
  const minutesDelta = summaries.current.minutes - summaries.previous.minutes
  const volumeDelta = summaries.current.volume - summaries.previous.volume

  return (
    <div className="page-wrap">
      <h1 className="section-title mb-2">Progression hebdomadaire</h1>
      <p className="mb-6 text-sm text-gray-500">Compare ta semaine en cours à la précédente.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-soft">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Semaine en cours</div>
          <div className="mt-1 text-sm text-gray-500">{summaries.current.label}</div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-500">Séances</div>
              <div className="text-2xl font-semibold text-gray-900">{summaries.current.sessions}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Minutes</div>
              <div className="text-2xl font-semibold text-gray-900">{summaries.current.minutes}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Volume</div>
              <div className="text-2xl font-semibold text-gray-900">{summaries.current.volume}</div>
            </div>
          </div>
        </div>
        <div className="card-soft">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variation vs semaine précédente</div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-gray-700"><Activity className="h-4 w-4" /> Séances</span>
              <strong className={sessionsDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'}>{sessionsDelta >= 0 ? '+' : ''}{sessionsDelta}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-gray-700"><Clock3 className="h-4 w-4" /> Minutes</span>
              <strong className={minutesDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'}>{minutesDelta >= 0 ? '+' : ''}{minutesDelta}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-gray-700"><Dumbbell className="h-4 w-4" /> Volume</span>
              <strong className={volumeDelta >= 0 ? 'text-emerald-700' : 'text-amber-700'}>{volumeDelta >= 0 ? '+' : ''}{volumeDelta}</strong>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
            <span className="inline-flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4" /> Conseil</span>
            <p className="mt-1">
              {volumeDelta > 15
                ? 'Progression forte: garde 1 journée de récupération active.'
                : volumeDelta < -15
                ? 'Semaine plus légère: reprends progressivement la charge.'
                : 'Progression stable: continue sur cette régularité.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
