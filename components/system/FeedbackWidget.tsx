'use client'

import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { addNotification } from '@/lib/in-app-notifications'

const DRAFT_KEY = 'fitpulse_feedback_draft'

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) setMessage(draft)
  }, [])

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, message)
  }, [message])

  const handleSubmit = () => {
    const body = message.trim()
    if (!body) return
    const subject = encodeURIComponent('Feedback FitPulse')
    const content = encodeURIComponent(body)
    window.location.href = `mailto:support@fitpulse.app?subject=${subject}&body=${content}`
    addNotification({
      level: 'success',
      title: 'Merci pour ton feedback',
      body: 'Ton client email a été ouvert pour envoyer le message.',
    })
    setMessage('')
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:bottom-6">
      {open && (
        <div className="mb-2 w-[min(92vw,340px)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
          <h3 className="text-sm font-semibold text-gray-900">Ton avis</h3>
          <p className="mt-1 text-xs text-gray-500">Signale un bug ou propose une idée.</p>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
            placeholder="Ex: je voudrais un timer plus visible..."
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary px-3 py-2 text-xs">
              Fermer
            </button>
            <button type="button" onClick={handleSubmit} className="btn-primary px-3 py-2 text-xs">
              Envoyer
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg hover:bg-primary-800"
        aria-label="Ouvrir le feedback"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    </div>
  )
}
