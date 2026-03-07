'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Mail } from 'lucide-react'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    website: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketId, setTicketId] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitted(false)
    setError(null)
    setTicketId(null)
    setIsSending(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'contact_form',
          ...form,
        }),
      })
      const data = (await response.json().catch(() => ({}))) as { ticketId?: string }
      if (!response.ok) throw new Error('send_failed')
      setIsSubmitted(true)
      setTicketId(data.ticketId || null)
      setForm({ name: '', email: '', subject: '', message: '', website: '' })
    } catch {
      setError('Envoi impossible pour le moment. Écris-nous à fitpulset@gmail.com.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
            <div className="mb-8">
              <h1 className="section-title mb-3">Nous contacter</h1>
              <p className="section-subtitle">
                Une question sur FitPulse ? Écrivez-nous et notre équipe vous répond rapidement.
              </p>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card-soft">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Envoyer un message</h2>
                <p className="text-sm text-gray-500 mb-6">Réponse moyenne sous 24 à 48h ouvrées.</p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                    value={form.website}
                    onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
                  />
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="votre.email@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      value={form.subject}
                      onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Comment pouvons-nous aider ?"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Décrivez votre besoin"
                    />
                  </div>
                  <button type="submit" disabled={isSending} className="btn-primary disabled:opacity-60">
                    {isSending ? 'Envoi en cours...' : 'Envoyer le message'}
                  </button>
                  {isSubmitted && (
                    <p className="text-sm text-green-600" role="status" aria-live="polite">
                      Merci ! Votre ticket a bien été envoyé à fitpulset@gmail.com. Référence: {ticketId || 'FP-XXXX'}.
                    </p>
                  )}
                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-soft">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Coordonnées</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <a href="mailto:fitpulset@gmail.com" className="hover:text-primary-700">
                      fitpulset@gmail.com
                    </a>
                  </div>
                </div>
              </div>

              <div className="card-soft bg-gradient-to-br from-primary-50 to-accent-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Support</h3>
                <p className="text-gray-600">
                  Notre équipe répond généralement sous 24 à 48 heures ouvrées.
                </p>
              </div>
            </div>
          </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
