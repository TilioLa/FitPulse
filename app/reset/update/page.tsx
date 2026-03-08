'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
import { Lock } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function ResetUpdatePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    if (password.length < 6) {
      setStatus('error')
      setMessage('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setStatus('success')
      setMessage('Mot de passe mis à jour. Redirection vers la connexion...')
      setTimeout(() => router.push('/connexion'), 1400)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Impossible de mettre à jour le mot de passe.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="card-soft">
              <div className="text-center mb-8">
                <Lock className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Nouveau mot de passe</h1>
                <p className="text-gray-600">Choisissez un nouveau mot de passe pour votre compte.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minimum 6 caractères"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Répétez le mot de passe"
                  />
                </div>

                <button type="submit" className="w-full btn-primary py-3" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Mise à jour...' : 'Mettre à jour'}
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
