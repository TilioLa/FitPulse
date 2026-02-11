'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Mail } from 'lucide-react'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ResetRequestPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch('/api/auth/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erreur serveur')
      }

      setStatus('success')
      setMessage('Si un compte existe, un email de réinitialisation a été envoyé.')
    } catch (error) {
      setStatus('error')
      setMessage("Impossible d'envoyer l'email pour le moment.")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
          <div className="card-soft">
            <div className="text-center mb-8">
              <Mail className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Réinitialiser le mot de passe</h1>
              <p className="text-gray-600">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="votre.email@example.com"
                />
              </div>

              <button type="submit" className="w-full btn-primary py-3" disabled={status === 'loading'}>
                {status === 'loading' ? 'Envoi...' : 'Envoyer le lien'}
              </button>
            </form>

            {message && (
              <p
                className={`mt-6 text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}
                role="status"
                aria-live="polite"
              >
                {message}
              </p>
            )}
          </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
