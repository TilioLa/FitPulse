'use client'

import { useEffect } from 'react'
import { addNotification } from '@/lib/in-app-notifications'

const LAST_NUDGE_KEY = 'fitpulse_last_smart_nudge_day'
const LAST_SIGNUP_NUDGE_KEY = 'fitpulse_last_signup_nudge_day'

function todayKey() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function SmartNudges() {
  useEffect(() => {
    const key = todayKey()
    const last = localStorage.getItem(LAST_NUDGE_KEY)
    if (last === key) return

    try {
      const historyRaw = localStorage.getItem('fitpulse_history')
      const history = historyRaw ? (JSON.parse(historyRaw) as { date?: string }[]) : []
      const latest = history
        .map((item) => new Date(item.date || '').getTime())
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => b - a)[0]

      if (!latest) {
        addNotification({
          level: 'info',
          title: 'Bienvenue sur FitPulse',
          body: 'Lance ta première séance pour débloquer ton suivi.',
          href: '/dashboard?view=session',
        })
      } else {
        const days = Math.floor((Date.now() - latest) / (24 * 60 * 60 * 1000))
        if (days >= 3) {
          addNotification({
            level: 'warning',
            title: 'Relance ta routine',
            body: `Dernière séance il y a ${days} jour(s). Un bloc court aujourd’hui suffit.`,
            href: '/dashboard?view=session',
          })
        }
      }
      localStorage.setItem(LAST_NUDGE_KEY, key)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const key = todayKey()
    const last = localStorage.getItem(LAST_SIGNUP_NUDGE_KEY)
    if (last === key) return

    try {
      const signupAtRaw = localStorage.getItem('fitpulse_signup_at')
      if (!signupAtRaw) return
      const signupAt = new Date(signupAtRaw).getTime()
      if (!Number.isFinite(signupAt)) return

      const daysSinceSignup = Math.floor((Date.now() - signupAt) / (24 * 60 * 60 * 1000))
      const historyRaw = localStorage.getItem('fitpulse_history')
      const history = historyRaw ? (JSON.parse(historyRaw) as unknown[]) : []
      const sessionsCount = Array.isArray(history) ? history.length : 0

      if (daysSinceSignup >= 1 && sessionsCount === 0) {
        addNotification({
          level: 'warning',
          title: 'Ton plan t’attend',
          body: 'Tu peux lancer ta première séance en moins de 2 minutes.',
          href: '/dashboard?view=session',
        })
        localStorage.setItem(LAST_SIGNUP_NUDGE_KEY, key)
        return
      }

      if (daysSinceSignup >= 3 && sessionsCount > 0 && sessionsCount < 3) {
        addNotification({
          level: 'info',
          title: 'Objectif 3 séances',
          body: 'Encore quelques séances cette semaine pour installer une vraie routine.',
          href: '/dashboard?view=progress',
        })
        localStorage.setItem(LAST_SIGNUP_NUDGE_KEY, key)
      }
    } catch {
      // ignore
    }
  }, [])

  return null
}
