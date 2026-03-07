'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const FAQ_ITEMS = [
  { q: 'Je n’arrive pas à me connecter', a: 'Vérifie ton email/mot de passe puis essaie la page de réinitialisation.' },
  { q: 'Mes séries ne se sauvegardent pas', a: 'La sauvegarde est automatique. Si tu es hors ligne, la sync se fait au retour réseau.' },
  { q: 'Comment démarrer rapidement ?', a: 'Va sur Dashboard > Séance et lance “Valider la prochaine série”.' },
  { q: 'Comment envoyer un ticket ?', a: 'Utilise le formulaire contact ou le widget feedback du dashboard.' },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQ_ITEMS
    return FAQ_ITEMS.filter((item) => `${item.q} ${item.a}`.toLowerCase().includes(q))
  }, [query])

  const suggestions = useMemo(() => {
    const q = `${subject} ${message}`.toLowerCase()
    return FAQ_ITEMS.filter((item) => q && item.q.toLowerCase().includes(q.slice(0, 24)))
  }, [subject, message])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setStatus('sending')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'help_center',
          subject: subject.trim(),
          message: message.trim(),
        }),
      })
      if (!response.ok) throw new Error('send_failed')
      setStatus('sent')
      setSubject('')
      setMessage('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-wrap py-10">
        <h1 className="section-title mb-2">Centre d’aide</h1>
        <p className="mb-6 text-sm text-gray-500">FAQ + création de ticket en un seul endroit.</p>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="card-soft">
            <label className="text-sm font-semibold text-gray-700">Recherche FAQ</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ex: connexion, sauvegarde..."
            />
            <div className="mt-4 space-y-3">
              {filtered.map((item) => (
                <article key={item.q} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <h2 className="text-sm font-semibold text-gray-900">{item.q}</h2>
                  <p className="mt-1 text-sm text-gray-600">{item.a}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="card-soft">
            <h2 className="text-lg font-semibold text-gray-900">Créer un ticket</h2>
            <p className="mt-1 text-xs text-gray-500">Envoyé directement à fitpulset@gmail.com</p>
            <form className="mt-4 space-y-3" onSubmit={submit}>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Sujet"
                required
              />
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Décris ton problème..."
                required
              />
              {suggestions.length > 0 && (
                <div className="rounded-lg bg-primary-50 px-3 py-2 text-xs text-primary-800">
                  Suggestion: <Link href="/aide" className="font-semibold underline">consulte aussi la FAQ ci-contre</Link>
                </div>
              )}
              <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-60">
                {status === 'sending' ? 'Envoi...' : 'Envoyer le ticket'}
              </button>
              {status === 'sent' && <p className="text-sm text-emerald-700">Ticket envoyé.</p>}
              {status === 'error' && (
                <p className="text-sm text-red-700">
                  Envoi impossible. Utilise <a href="mailto:fitpulset@gmail.com" className="underline">fitpulset@gmail.com</a>.
                </p>
              )}
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
