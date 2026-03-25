import { readLocalHistory } from '@/lib/history-store'
import { readLocalSettings } from '@/lib/user-state-store'

export type SmartNotification = {
  id: string
  priority: 'high' | 'medium' | 'low'
  title: string
  body: string
  href: string
}

export function buildSmartNotifications(): SmartNotification[] {
  const settings = readLocalSettings() as { sessionsPerWeek?: number; goal?: string; goals?: string[] }
  const history = readLocalHistory()
  const target = Math.max(1, Math.min(7, Number(settings.sessionsPerWeek) || 3))
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const done = history.filter((item) => new Date(item.date).getTime() >= weekAgo).length
  const remaining = Math.max(0, target - done)
  const last = history.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const daysSince = last ? Math.floor((Date.now() - new Date(last.date).getTime()) / (24 * 60 * 60 * 1000)) : null
  const goal = settings.goal || settings.goals?.[0] || 'ton objectif'

  const notifications: SmartNotification[] = []
  if (daysSince == null || daysSince >= 3) {
    notifications.push({
      id: 'inactive',
      priority: 'high',
      title: 'Relance séance',
      body: daysSince == null
        ? 'Tu n’as pas encore commencé. Lance une première séance maintenant.'
        : `Tu es inactif depuis ${daysSince} jours. Reprends aujourd’hui pour relancer ta streak.`,
      href: '/dashboard?view=session',
    })
  }
  if (remaining > 0) {
    notifications.push({
      id: 'weekly_goal',
      priority: 'medium',
      title: 'Objectif hebdo en retard',
      body: `Il reste ${remaining} séance(s) cette semaine pour rester aligné sur ${goal}.`,
      href: '/dashboard?view=session',
    })
  }
  notifications.push({
    id: 'program',
    priority: 'low',
    title: 'Prochaine amélioration',
    body: 'Ajuste ton plan ou lance un nouveau programme pour continuer à progresser.',
    href: '/dashboard?view=programs',
  })

  const weight = { high: 0, medium: 1, low: 2 } as const
  return notifications.sort((a, b) => weight[a.priority] - weight[b.priority])
}
