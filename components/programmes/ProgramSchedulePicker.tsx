'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarCheck, Timer } from 'lucide-react'

function clampSessions(value: number) {
  if (value < 1) return 1
  if (value > 7) return 7
  return value
}

export default function ProgramSchedulePicker({
  programId,
  baseWeeks,
  baseSessionsPerWeek,
}: {
  programId: string
  baseWeeks: number
  baseSessionsPerWeek: number
}) {
  const storageKey = `fitpulse_sessions_per_week_${programId}`
  const [sessionsPerWeek, setSessionsPerWeek] = useState(baseSessionsPerWeek)
  const totalSessions = baseWeeks * baseSessionsPerWeek

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null
    if (!saved) return
    const parsed = Number(saved)
    if (Number.isFinite(parsed)) {
      setSessionsPerWeek(clampSessions(parsed))
    }
  }, [storageKey])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, String(sessionsPerWeek))
  }, [sessionsPerWeek, storageKey])

  const computedWeeks = useMemo(() => {
    const safeSessions = clampSessions(sessionsPerWeek || baseSessionsPerWeek)
    return Math.max(1, Math.ceil(totalSessions / safeSessions))
  }, [sessionsPerWeek, baseSessionsPerWeek, totalSessions])

  return (
    <div className="space-y-4">
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Timer className="h-4 w-4 mr-2" />
        Durée estimée
      </div>
      <div className="text-lg font-semibold text-gray-900">{computedWeeks} semaines</div>

      <div className="flex items-center text-sm text-gray-600 mb-2">
        <CalendarCheck className="h-4 w-4 mr-2" />
        Séances / semaine
      </div>
      <div className="text-lg font-semibold text-gray-900">{sessionsPerWeek}</div>

      <div className="mt-2">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          Choisir votre rythme (1 à 7)
        </label>
        <input
          type="range"
          min={1}
          max={7}
          value={sessionsPerWeek}
          onChange={(event) => setSessionsPerWeek(clampSessions(Number(event.target.value)))}
          className="w-full accent-primary-600"
        />
      </div>

      <div className="text-xs text-gray-500">
        Total séances dans le programme : <span className="font-semibold text-gray-700">{totalSessions}</span>
      </div>
    </div>
  )
}
