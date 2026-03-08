'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { muscleLabel } from '@/lib/muscles'
import { isProfileFollowed, toggleFollowProfile } from '@/lib/public-profile-follow'
import { readPublicGoal, writePublicGoal, type PublicGoalMetric } from '@/lib/public-goal'

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
  const [isFollowed, setIsFollowed] = useState(false)
  const [goalMetric, setGoalMetric] = useState<PublicGoalMetric>('volume')
  const [goalTargetInput, setGoalTargetInput] = useState('')
  const [exportFormat, setExportFormat] = useState<'post' | 'story'>('post')
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>('light')

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

  useEffect(() => {
    if (!slug) return
    setIsFollowed(isProfileFollowed(slug))
    const onFollowChange = () => setIsFollowed(isProfileFollowed(slug))
    window.addEventListener('fitpulse-followed-profiles', onFollowChange)
    return () => window.removeEventListener('fitpulse-followed-profiles', onFollowChange)
  }, [slug])

  useEffect(() => {
    if (!slug) return
    const stored = readPublicGoal(slug)
    if (stored) {
      setGoalMetric(stored.metric)
      setGoalTargetInput(String(stored.target))
      return
    }
    setGoalMetric('volume')
    setGoalTargetInput('')
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

  const badges = [
    profile.totalShares >= 12 ? 'Régulier' : null,
    profile.totalVolume >= 10000 ? 'Machine à volume' : null,
    profile.bestPrKg >= 120 ? 'PR Elite' : profile.bestPrKg >= 80 ? 'PR Solide' : null,
  ].filter(Boolean) as string[]

  const weeklyTrend = (() => {
    const now = new Date()
    const buckets = Array.from({ length: 4 }).map((_, idx) => {
      const start = new Date(now)
      start.setDate(now.getDate() - (3 - idx) * 7)
      const key = `${start.getFullYear()}-W${Math.ceil((start.getDate() + 6) / 7)}`
      return {
        key,
        label: `S-${4 - idx}`,
        startTs: start.getTime(),
        endTs: start.getTime() + 7 * 24 * 60 * 60 * 1000,
        volume: 0,
        pr: 0,
        sessions: 0,
      }
    })

    profile.sessions.forEach((session) => {
      const ts = new Date(session.date).getTime()
      const bucket = buckets.find((item) => ts >= item.startTs && ts < item.endTs)
      if (!bucket) return
      bucket.sessions += 1
      bucket.volume += Number(session.volume) || 0
      bucket.pr = Math.max(bucket.pr, Number(session.bestPrKg) || 0)
    })

    const maxVolume = Math.max(...buckets.map((item) => item.volume), 1)
    const maxPr = Math.max(...buckets.map((item) => item.pr), 1)
    return buckets.map((item) => ({
      ...item,
      volumeWidth: Math.round((item.volume / maxVolume) * 100),
      prWidth: Math.round((item.pr / maxPr) * 100),
      volume: Math.round(item.volume),
      pr: Math.round(item.pr),
    }))
  })()
  const monthlyObjective = (() => {
    const first = weeklyTrend[0]
    const last = weeklyTrend[weeklyTrend.length - 1]
    const volumeDeltaPct =
      first?.volume > 0 ? Math.round(((last.volume - first.volume) / first.volume) * 100) : 0
    const activeWeeks = weeklyTrend.filter((item) => item.sessions > 0).length
    const bestWeeklyPr = Math.max(...weeklyTrend.map((item) => item.pr), 0)

    if (activeWeeks >= 3 && volumeDeltaPct >= 10) {
      return {
        title: 'Objectif du mois: Progression validée',
        subtitle: `Volume +${volumeDeltaPct}% avec ${activeWeeks}/4 semaines actives.`,
        tone: 'success' as const,
      }
    }
    if (activeWeeks >= 2 || bestWeeklyPr >= 80) {
      return {
        title: 'Objectif du mois: En cours',
        subtitle: `Base solide. Vise 3 semaines actives et +10% de volume.`,
        tone: 'info' as const,
      }
    }
    return {
      title: 'Objectif du mois: À relancer',
      subtitle: 'Lance 2 séances cette semaine pour redémarrer la progression.',
      tone: 'warning' as const,
    }
  })()
  const currentWeeklyValue = goalMetric === 'pr' ? weeklyTrend[weeklyTrend.length - 1]?.pr || 0 : weeklyTrend[weeklyTrend.length - 1]?.volume || 0
  const goalTarget = Number(goalTargetInput)
  const hasGoal = Number.isFinite(goalTarget) && goalTarget > 0
  const goalProgressPct = hasGoal ? Math.min(100, Math.max(0, Math.round((currentWeeklyValue / goalTarget) * 100))) : 0

  const buildShareCardDataUrl = (): string | null => {
    const width = 1080
    const height = exportFormat === 'story' ? 1920 : 1350
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const isDark = exportTheme === 'dark'
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    if (isDark) {
      bgGradient.addColorStop(0, '#0b1220')
      bgGradient.addColorStop(1, '#111827')
    } else {
      bgGradient.addColorStop(0, '#eff6ff')
      bgGradient.addColorStop(1, '#ffffff')
    }
    const textPrimary = isDark ? '#f8fafc' : '#111827'
    const textSecondary = isDark ? '#cbd5e1' : '#334155'
    const cardBg = isDark ? '#1f2937' : '#ffffff'
    const cardStroke = isDark ? '#334155' : '#dbeafe'
    const accent = isDark ? '#60a5fa' : '#1d4ed8'

    // Background
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Header
    ctx.fillStyle = textPrimary
    ctx.font = 'bold 64px Arial'
    ctx.fillText('FitPulse', 72, 110)
    ctx.fillStyle = textSecondary
    ctx.font = '40px Arial'
    ctx.fillText('Profil public', 72, 160)

    // Profile name
    ctx.fillStyle = textPrimary
    ctx.font = 'bold 58px Arial'
    ctx.fillText(profile.author, 72, 250)

    // Stats cards
    const cards = [
      `Séances: ${profile.totalShares}`,
      `Volume: ${profile.totalVolume} kg`,
      `Durée: ${profile.totalDuration} min`,
      `PR: ${profile.bestPrKg} kg`,
    ]
    ctx.font = 'bold 32px Arial'
    cards.forEach((text, index) => {
      const x = 72 + (index % 2) * 470
      const y = 320 + Math.floor(index / 2) * 120
      ctx.fillStyle = cardBg
      ctx.fillRect(x, y, 430, 90)
      ctx.strokeStyle = cardStroke
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, 430, 90)
      ctx.fillStyle = textPrimary
      ctx.fillText(text, x + 20, y + 56)
    })

    // Badges
    if (badges.length > 0) {
      ctx.fillStyle = textSecondary
      ctx.font = 'bold 30px Arial'
      ctx.fillText('Badges', 72, 610)
      ctx.font = 'bold 28px Arial'
      badges.forEach((badge, index) => {
        const x = 72 + (index % 2) * 350
        const y = 650 + Math.floor(index / 2) * 70
        ctx.fillStyle = isDark ? '#1e3a8a' : '#dbeafe'
        ctx.fillRect(x, y, 300, 50)
        ctx.fillStyle = isDark ? '#bfdbfe' : accent
        ctx.fillText(badge, x + 14, y + 34)
      })
    }

    // Objective
    ctx.fillStyle = textSecondary
    ctx.font = 'bold 30px Arial'
    ctx.fillText('Objectif du mois', 72, 860)
    ctx.fillStyle = textPrimary
    ctx.font = '32px Arial'
    ctx.fillText(monthlyObjective.title, 72, 910)
    ctx.fillStyle = textSecondary
    ctx.font = '24px Arial'
    ctx.fillText(monthlyObjective.subtitle.slice(0, 64), 72, 950)

    // Footer
    ctx.fillStyle = textSecondary
    ctx.font = '24px Arial'
    ctx.fillText('fitpulse', 72, height - 70)
    ctx.fillText(new Date().toLocaleDateString('fr-FR'), 860, height - 70)

    return canvas.toDataURL('image/png')
  }

  const handleDownloadShareCard = () => {
    const dataUrl = buildShareCardDataUrl()
    if (!dataUrl) return
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `fitpulse-profile-${profile.slug}-${exportFormat}-${exportTheme}.png`
    link.click()
  }

  const handleCopyCaption = async () => {
    const profileUrl = `${window.location.origin}/u/${profile.slug}`
    const caption =
      `Progression FitPulse de ${profile.author}\n` +
      `- Séances partagées: ${profile.totalShares}\n` +
      `- Volume total: ${profile.totalVolume} kg\n` +
      `- Meilleur PR: ${profile.bestPrKg} kg\n` +
      `Voir le profil: ${profileUrl}\n` +
      `#FitPulse #Fitness #Progression`
    try {
      await navigator.clipboard.writeText(caption)
    } catch {
      // ignore
    }
  }

  const previewDataUrl = buildShareCardDataUrl() || ''

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="section-title mb-2">{profile.author}</h1>
            <p className="text-gray-600">Profil public FitPulse</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={exportFormat}
              onChange={(event) => setExportFormat(event.target.value === 'story' ? 'story' : 'post')}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700"
            >
              <option value="post">Format Post (4:5)</option>
              <option value="story">Format Story (9:16)</option>
            </select>
            <select
              value={exportTheme}
              onChange={(event) => setExportTheme(event.target.value === 'dark' ? 'dark' : 'light')}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700"
            >
              <option value="light">Thème Clair</option>
              <option value="dark">Thème Sombre</option>
            </select>
            <button
              type="button"
              onClick={handleDownloadShareCard}
              className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700"
            >
              Télécharger carte
            </button>
            <button
              type="button"
              onClick={() => setIsFollowed(toggleFollowProfile(profile.slug))}
              className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                isFollowed
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700'
              }`}
            >
              {isFollowed ? 'Suivi' : 'Suivre'}
            </button>
          </div>
        </div>
        {previewDataUrl && (
          <div className="mt-4">
            <div className="text-xs text-gray-500 mb-2">Aperçu de la carte</div>
            <Image
              src={previewDataUrl}
              alt="Aperçu carte profil"
              width={400}
              height={500}
              unoptimized
              className="w-full max-w-xs rounded-lg border border-gray-200 shadow-sm"
            />
          </div>
        )}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleCopyCaption}
            className="px-3 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700"
          >
            Copier la légende
          </button>
        </div>
        {badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                {badge}
              </span>
            ))}
          </div>
        )}
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

      <div className="card-soft">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Activité récente (4 semaines)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-2">Volume hebdo (kg)</div>
            <div className="space-y-2">
              {weeklyTrend.map((item) => (
                <div key={`v-${item.key}`}>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.volume} kg</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-600" style={{ width: `${item.volumeWidth}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-2">PR max hebdo (kg)</div>
            <div className="space-y-2">
              {weeklyTrend.map((item) => (
                <div key={`pr-${item.key}`}>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{item.label}</span>
                    <span>{item.pr} kg</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${item.prWidth}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`card-soft ${
          monthlyObjective.tone === 'success'
            ? 'border border-emerald-200 bg-emerald-50'
            : monthlyObjective.tone === 'warning'
            ? 'border border-amber-200 bg-amber-50'
            : 'border border-primary-200 bg-primary-50'
        }`}
      >
        <h2 className="text-lg font-semibold text-gray-900">{monthlyObjective.title}</h2>
        <p className="text-sm text-gray-700 mt-1">{monthlyObjective.subtitle}</p>
      </div>

      <div className="card-soft">
        <h2 className="text-lg font-semibold text-gray-900">Objectif personnalisé</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure ton objectif local pour ce profil public.
        </p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={goalMetric}
            onChange={(event) => setGoalMetric(event.target.value === 'pr' ? 'pr' : 'volume')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="volume">Volume hebdo (kg)</option>
            <option value="pr">PR hebdo (kg)</option>
          </select>
          <input
            type="number"
            min={1}
            step={1}
            value={goalTargetInput}
            onChange={(event) => setGoalTargetInput(event.target.value)}
            placeholder={goalMetric === 'pr' ? 'Ex: 100' : 'Ex: 3000'}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              const nextTarget = Number(goalTargetInput)
              if (!Number.isFinite(nextTarget) || nextTarget <= 0) return
              writePublicGoal(profile.slug, { metric: goalMetric, target: nextTarget })
            }}
            className="btn-secondary"
          >
            Enregistrer
          </button>
        </div>
        {hasGoal && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Actuel: {currentWeeklyValue} {goalMetric === 'pr' ? 'kg (PR)' : 'kg'}</span>
              <span>Cible: {goalTarget} kg</span>
            </div>
            <div className="mt-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600" style={{ width: `${goalProgressPct}%` }} />
            </div>
            <div className="mt-1 text-xs font-semibold text-primary-700">{goalProgressPct}% atteint</div>
          </div>
        )}
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
