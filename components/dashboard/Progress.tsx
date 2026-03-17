'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Flame, Trophy, TrendingUp, Target, RotateCcw, Star } from 'lucide-react'
import DashboardCalendar from '@/components/dashboard/Calendar'
import { computeHistoryStats, toLocalDateKey, WorkoutHistoryItem } from '@/lib/history'
import { applyHistoryLimit, getEntitlement } from '@/lib/subscription'
import { muscleLabel } from '@/lib/muscles'
import { readLocalHistory } from '@/lib/history-store'
import { readLocalSettings, writeLocalSettings, persistSettingsForUser } from '@/lib/user-state-store'
import { generateWeeklyPlan, type WeeklyPlanDay } from '@/lib/weekly-plan'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { useToast } from '@/components/ui/ToastProvider'
import { computeXp, getLevelInfo } from '@/lib/levels'

type ProgressProps = {
  compact?: boolean
}

type TrendDay = {
  day: string
  sessions: number
  minutes: number
}

export default function Progress({ compact = false }: ProgressProps) {
  const { user } = useAuth()
  const { push } = useToast()
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    streak: 0,
    bestPrKg: 0,
    totalVolume: 0,
  })
  const [weekTrend, setWeekTrend] = useState<TrendDay[]>([])
  const [topMuscles, setTopMuscles] = useState<{ id: string; percent: number }[]>([])
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanDay[]>([])
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [level, setLevel] = useState<{ name: string; level: number; progress: number; next?: string | null }>({
    name: 'Bronze',
    level: 1,
    progress: 0,
    next: null,
  })
  const [monthlyCompare, setMonthlyCompare] = useState({
    currentSessions: 0,
    previousSessions: 0,
    currentMinutes: 0,
    previousMinutes: 0,
    currentVolume: 0,
    previousVolume: 0,
  })

  const loadProgress = () => {
    try {
      const stored = applyHistoryLimit(readLocalHistory() as WorkoutHistoryItem[], getEntitlement())
      const { streak, totalWorkouts, totalMinutes, deduped } = computeHistoryStats(stored)
      const bestPrKg = stored
        .flatMap((item) => item.records || [])
        .reduce((max, record) => Math.max(max, record.bestOneRm || 0), 0)
      const totalVolume = stored.reduce((sum, item) => sum + (Number(item.volume) || 0), 0)
      setStats({
        totalWorkouts,
        totalMinutes,
        streak,
        bestPrKg: Math.round(bestPrKg),
        totalVolume: Math.round(totalVolume),
      })
      const xp = computeXp(totalMinutes, totalWorkouts)
      const levelInfo = getLevelInfo(xp)
      setLevel({
        name: levelInfo.current.name,
        level: levelInfo.current.level,
        progress: levelInfo.progress,
        next: levelInfo.next?.name || null,
      })

      const sevenDaySeries = Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        const dayKey = toLocalDateKey(date)
        const dayEntries = deduped.filter((item) => toLocalDateKey(item.date) === dayKey)
        return {
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          sessions: dayEntries.length,
          minutes: dayEntries.reduce((sum, item) => sum + (Number(item.duration) || 0), 0),
        }
      })
      setWeekTrend(sevenDaySeries)

      const now = new Date()
      const currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const previousEnd = currentStart

      const currentItems = stored.filter((item) => {
        const d = new Date(item.date)
        return d >= currentStart && d < currentEnd
      })
      const previousItems = stored.filter((item) => {
        const d = new Date(item.date)
        return d >= previousStart && d < previousEnd
      })
      setMonthlyCompare({
        currentSessions: currentItems.length,
        previousSessions: previousItems.length,
        currentMinutes: currentItems.reduce((sum, item) => sum + (Number(item.duration) || 0), 0),
        previousMinutes: previousItems.reduce((sum, item) => sum + (Number(item.duration) || 0), 0),
        currentVolume: currentItems.reduce((sum, item) => sum + (Number(item.volume) || 0), 0),
        previousVolume: previousItems.reduce((sum, item) => sum + (Number(item.volume) || 0), 0),
      })

      const muscleTotals = stored.reduce((acc: Record<string, number>, item) => {
        const muscles = item.muscleUsage || []
        muscles.forEach((muscle) => {
          acc[muscle.id] = (acc[muscle.id] || 0) + (Number(muscle.percent) || 0)
        })
        return acc
      }, {})
      const totalValue = Object.values(muscleTotals).reduce((sum, value) => sum + value, 0) || 1
      const top = Object.entries(muscleTotals)
        .map(([id, value]) => ({ id, percent: Math.round((value / totalValue) * 100) }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 4)
      setTopMuscles(top)
    } catch {
      setStats({
        totalWorkouts: 0,
        totalMinutes: 0,
        streak: 0,
        bestPrKg: 0,
        totalVolume: 0,
      })
      setWeekTrend([])
      setTopMuscles([])
    }
  }

  const loadPlan = () => {
    const settings = readLocalSettings() as { sessionsPerWeek?: number; weeklyPlan?: WeeklyPlanDay[] }
    const targetSessions = Number.isFinite(settings.sessionsPerWeek) ? Number(settings.sessionsPerWeek) : 3
    setSessionsPerWeek(targetSessions)
    if (Array.isArray(settings.weeklyPlan) && settings.weeklyPlan.length > 0) {
      setWeeklyPlan(settings.weeklyPlan)
    } else {
      setWeeklyPlan(generateWeeklyPlan(targetSessions))
    }
  }

  useEffect(() => {
    loadProgress()
    loadPlan()
    window.addEventListener('fitpulse-history', loadProgress)
    window.addEventListener('storage', loadProgress)
    window.addEventListener('fitpulse-settings', loadPlan)
    return () => {
      window.removeEventListener('fitpulse-history', loadProgress)
      window.removeEventListener('storage', loadProgress)
      window.removeEventListener('fitpulse-settings', loadPlan)
    }
  }, [])

  const planDays = useMemo(() => {
    if (weeklyPlan.length === 0) return generateWeeklyPlan(sessionsPerWeek)
    return weeklyPlan
  }, [weeklyPlan, sessionsPerWeek])

  const togglePlanDay = async (day: WeeklyPlanDay) => {
    const targetKey = toLocalDateKey(day.date)
    const next = planDays.map((entry) => {
      if (toLocalDateKey(entry.date) !== targetKey) return entry
      const updatedType: WeeklyPlanDay['type'] = entry.type === 'training' ? 'rest' : 'training'
      return { ...entry, type: updatedType }
    }) as WeeklyPlanDay[]
    setWeeklyPlan(next)
    const settings = readLocalSettings()
    const nextSettings = {
      ...settings,
      sessionsPerWeek,
      weeklyPlan: next,
    }
    writeLocalSettings(nextSettings)
    if (user?.id) {
      await persistSettingsForUser(user.id, nextSettings)
    }
    push('Planning mis à jour.', 'success')
  }

  const resetPlan = async () => {
    const next = generateWeeklyPlan(sessionsPerWeek)
    setWeeklyPlan(next)
    const settings = readLocalSettings()
    const nextSettings = {
      ...settings,
      sessionsPerWeek,
      weeklyPlan: next,
    }
    writeLocalSettings(nextSettings)
    if (user?.id) {
      await persistSettingsForUser(user.id, nextSettings)
    }
    push('Planning réinitialisé.', 'success')
  }

  const maxWeeklySessions = Math.max(1, ...weekTrend.map((item) => item.sessions))

  return (
    <div className="page-wrap">
      <div className="mb-8">
        <h1 className="section-title mb-2">Progrès</h1>
        <p className="section-subtitle">Tout ce qui compte pour suivre ta progression.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Streak</div>
          <div className="text-2xl font-bold text-gray-900">{stats.streak} j</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Séances</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Minutes</div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalMinutes}</div>
        </div>
        <div className="card-compact">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Best PR</div>
          <div className="text-2xl font-bold text-gray-900">{stats.bestPrKg} kg</div>
        </div>
      </div>

      <div className="card-compact mb-8">
        <div className="flex items-center justify-between">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Niveau</div>
          <div className="text-xs text-gray-500">Prochain: {level.next || '—'}</div>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
            {level.level}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{level.name}</div>
            <div className="text-xs text-gray-500">Progression {level.progress}%</div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full bg-amber-500" style={{ width: `${level.progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-compact">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Tendance 7 jours</div>
            <TrendingUp className="h-5 w-5 text-primary-500" />
          </div>
          <div className="grid grid-cols-7 gap-2 items-end h-24">
            {weekTrend.map((day) => {
              const barHeight = Math.max(8, Math.round((day.sessions / maxWeeklySessions) * 100))
              return (
                <div key={day.day} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500">{day.sessions}</span>
                  <div className="h-20 w-full rounded bg-primary-100 flex items-end overflow-hidden">
                    <div className="w-full bg-primary-600 rounded-t" style={{ height: `${barHeight}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase">{day.day.replace('.', '')}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">Barres basées sur le nombre de séances par jour.</p>
        </div>

        <div className="card-compact">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Groupes musculaires</div>
            <Flame className="h-5 w-5 text-amber-500" />
          </div>
          {topMuscles.length === 0 ? (
            <div className="text-sm text-gray-500">Pas encore de données.</div>
          ) : (
            <div className="space-y-3">
              {topMuscles.map((muscle) => (
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
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="card-compact">
          <div className="text-xs text-gray-500">Comparaison mensuelle</div>
          <div className="mt-2 text-sm text-gray-700">Séances ce mois</div>
          <div className="text-2xl font-bold text-gray-900">{monthlyCompare.currentSessions}</div>
          <div className="text-xs text-gray-500 mt-1">
            Mois précédent: {monthlyCompare.previousSessions}
          </div>
        </div>
        <div className="card-compact">
          <div className="text-xs text-gray-500">Minutes</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{Math.round(monthlyCompare.currentMinutes)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Mois précédent: {Math.round(monthlyCompare.previousMinutes)}
          </div>
        </div>
        <div className="card-compact">
          <div className="text-xs text-gray-500">Volume total</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{Math.round(monthlyCompare.currentVolume)} kg</div>
          <div className="text-xs text-gray-500 mt-1">
            Mois précédent: {Math.round(monthlyCompare.previousVolume)} kg
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-8">
        {!compact && (
          <div className="card-compact">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] uppercase tracking-wide text-gray-500">Calendrier mensuel</div>
              <CalendarDays className="h-5 w-5 text-primary-500" />
            </div>
            <DashboardCalendar />
          </div>
        )}

        <div className="card-compact">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Planning hebdo</div>
            <Target className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="space-y-2">
            {planDays.map((day) => (
              <button
                key={day.date}
                onClick={() => void togglePlanDay(day)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  day.type === 'training'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                <span className="font-semibold capitalize">{day.label}</span>
                <span>{day.type === 'training' ? 'Séance' : 'Repos'}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void resetPlan()}
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser selon objectif
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-compact">
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
            <Trophy className="h-4 w-4 text-amber-500" />
            Volume total
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.totalVolume} kg</div>
        </div>
        <div className="card-compact">
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
            <Flame className="h-4 w-4 text-orange-500" />
            Streak actuel
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.streak} jours</div>
        </div>
        <div className="card-compact">
          <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-wide">
            <TrendingUp className="h-4 w-4 text-primary-500" />
            Objectif hebdo
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{sessionsPerWeek} séances</div>
        </div>
      </div>
    </div>
  )
}
