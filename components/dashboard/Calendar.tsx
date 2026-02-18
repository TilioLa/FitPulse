'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { computeHistoryStats, toLocalDateKey, WorkoutHistoryItem } from '@/lib/history'

function buildMonthGrid(baseDate: Date) {
  const year = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = lastDay.getDate()

  const cells: Array<{ date: Date | null; key: string }> = []
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ date: null, key: `empty-${i}` })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    cells.push({ date, key: toLocalDateKey(date) })
  }

  const totalRows = Math.ceil(cells.length / 7)
  while (cells.length < totalRows * 7) {
    cells.push({ date: null, key: `empty-tail-${cells.length}` })
  }

  return cells
}

export default function DashboardCalendar() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const baseDate = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  }, [monthOffset])

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((prev) => prev + 1)
    window.addEventListener('storage', handleRefresh)
    window.addEventListener('fitpulse-history', handleRefresh)
    return () => {
      window.removeEventListener('storage', handleRefresh)
      window.removeEventListener('fitpulse-history', handleRefresh)
    }
  }, [])

  const completedDays = useMemo(() => {
    if (typeof window === 'undefined') return new Set<string>()
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const { deduped } = computeHistoryStats(history as WorkoutHistoryItem[])
    const dates = deduped.map((item) => toLocalDateKey(item.date))
    return new Set(dates)
  // refreshKey intentionally invalidates localStorage-backed cache.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  const cells = buildMonthGrid(baseDate)
  const locale = typeof navigator !== 'undefined' ? navigator.language || 'fr-FR' : 'fr-FR'
  const monthLabel = baseDate.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  const todayKey = toLocalDateKey(new Date())

  const labels = {
    title: locale.startsWith('fr') ? 'Calendrier' : 'Calendar',
    weekdays: locale.startsWith('fr') ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  }

  return (
    <div className="card-soft bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{labels.title}</h3>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full p-1.5 hover:bg-gray-100"
            onClick={() => setMonthOffset((prev) => prev - 1)}
            aria-label="Mois précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-gray-900 capitalize">{monthLabel}</span>
          <button
            className="rounded-full p-1.5 hover:bg-gray-100"
            onClick={() => setMonthOffset((prev) => prev + 1)}
            aria-label="Mois suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[11px] text-gray-400 mb-2">
        {labels.weekdays.map((label, idx) => (
          <div key={`${label}-${idx}`} className="text-center font-semibold">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => {
          if (!cell.date) {
            return <div key={cell.key} className="h-9" />
          }

          const dateKey = toLocalDateKey(cell.date)
          const isDone = completedDays.has(dateKey)
          const isToday = dateKey === todayKey

          return (
            <div
              key={cell.key}
              className="h-9 flex items-center justify-center text-sm font-medium text-gray-700"
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${
                  isDone ? 'bg-primary-600 text-white' : 'bg-transparent'
                } ${isToday ? 'ring-2 ring-primary-300' : ''}`}
              >
                {cell.date.getDate()}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
