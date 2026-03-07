'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

type Status = {
  emailConfigured: boolean
  hasWorkoutHistory: boolean
  hasInProgressWorkout: boolean
  notificationsEnabled: boolean
}

export default function AccountStatusPage() {
  const [status, setStatus] = useState<Status>({
    emailConfigured: false,
    hasWorkoutHistory: false,
    hasInProgressWorkout: false,
    notificationsEnabled: false,
  })

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}') as { email?: string }
      const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as unknown[]
      const workout = JSON.parse(localStorage.getItem('fitpulse_current_workout') || 'null') as { status?: string } | null
      const notificationsEnabled = typeof Notification !== 'undefined' && Notification.permission === 'granted'
      setStatus({
        emailConfigured: Boolean(settings.email && settings.email.includes('@')),
        hasWorkoutHistory: Array.isArray(history) && history.length > 0,
        hasInProgressWorkout: workout?.status === 'in_progress',
        notificationsEnabled,
      })
    } catch {
      // ignore
    }
  }, [])

  const rows = [
    { label: 'Email profil configuré', ok: status.emailConfigured },
    { label: 'Historique de séances', ok: status.hasWorkoutHistory },
    { label: 'Séance en cours détectée', ok: status.hasInProgressWorkout },
    { label: 'Notifications navigateur actives', ok: status.notificationsEnabled },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-wrap py-10">
        <h1 className="section-title mb-2">État du compte</h1>
        <p className="mb-6 text-sm text-gray-500">Contrôle rapide des points critiques expérience/utilisateur.</p>
        <div className="card-soft space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
              <span className="text-sm text-gray-700">{row.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {row.ok ? 'OK' : 'À vérifier'}
              </span>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
