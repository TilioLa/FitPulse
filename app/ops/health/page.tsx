'use client'

import { useMemo } from 'react'
import Link from 'next/link'

type EventRow = {
  name?: string
  at?: string
}

function readEvents(): EventRow[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('fitpulse_analytics_events_v1')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function OpsHealthPage() {
  const events = useMemo(() => readEvents(), [])
  const counters = useMemo(() => {
    const count = (name: string) => events.filter((event) => event.name === name).length
    return {
      videoPlay: count('video_play'),
      tourStart: count('tour_start_click'),
      tourComplete: count('tour_complete') + count('tour_complete_signup_click'),
      signupSuccess: count('signup_success'),
    }
  }, [events])
  const conversionTourToSignup =
    counters.tourStart > 0 ? Math.round((counters.signupSuccess / counters.tourStart) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900">Ops Health Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">
          Vue rapide qualité produit et funnel local (analytics client).
        </p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="Events stockés" value={events.length} />
          <Metric label="Video play" value={counters.videoPlay} />
          <Metric label="Tour starts" value={counters.tourStart} />
          <Metric label="Signups" value={counters.signupSuccess} />
          <Metric label="Conv. Tour → Signup" value={`${conversionTourToSignup}%`} />
        </div>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">Derniers événements</div>
          <div className="space-y-2 text-sm">
            {events.slice(-20).reverse().map((event, index) => (
              <div key={`${event.name || 'event'}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="font-semibold text-gray-800">{event.name || 'unknown'}</div>
                <div className="text-xs text-gray-500">{event.at || 'no-date'}</div>
              </div>
            ))}
            {events.length === 0 && <div className="text-sm text-gray-500">Aucun événement local pour le moment.</div>}
          </div>
        </div>
        <Link href="/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary-700">
          Retour dashboard →
        </Link>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  )
}
