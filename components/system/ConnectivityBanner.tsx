'use client'

import { useEffect, useState } from 'react'
import { addNotification } from '@/lib/in-app-notifications'

const PENDING_SYNC_KEY = 'fitpulse_pending_sync_count'

function readPendingCount() {
  if (typeof window === 'undefined') return 0
  const parsed = Number(localStorage.getItem(PENDING_SYNC_KEY) || '0')
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export default function ConnectivityBanner() {
  const [online, setOnline] = useState(true)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine)
    const syncPending = () => setPendingSyncCount(readPendingCount())
    syncOnline()
    syncPending()

    const onOnline = () => {
      syncOnline()
      addNotification({
        level: 'success',
        title: 'Connexion rétablie',
        body: 'La synchronisation cloud reprend automatiquement.',
        href: '/dashboard?view=session',
      })
    }
    const onOffline = () => {
      syncOnline()
      addNotification({
        level: 'warning',
        title: 'Mode hors ligne',
        body: 'Tes changements sont gardés localement.',
        href: '/dashboard?view=session',
      })
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('fitpulse-sync-queue', syncPending)
    window.addEventListener('storage', syncPending)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('fitpulse-sync-queue', syncPending)
      window.removeEventListener('storage', syncPending)
    }
  }, [])

  if (online && pendingSyncCount === 0) return null

  return (
    <div
      className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
        online ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-red-200 bg-red-50 text-red-900'
      }`}
      role="status"
      aria-live="polite"
    >
      {!online
        ? 'Hors ligne: tes actions sont enregistrées localement. Synchronisation au retour du réseau.'
        : `${pendingSyncCount} synchronisation${pendingSyncCount > 1 ? 's' : ''} en attente.`}
    </div>
  )
}
