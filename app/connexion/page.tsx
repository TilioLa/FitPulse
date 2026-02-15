'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { LogIn, Mail, Lock } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { useEffect } from 'react'

export default function ConnexionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const signupStatus = searchParams.get('signup')

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail || !password) {
      setError('Email ou mot de passe incorrect')
      setIsSubmitting(false)
      return
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInError) {
        setError('Email ou mot de passe incorrect')
        return
      }

      let hasSession = false
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data } = await supabase.auth.getSession()
        if (data.session) {
          hasSession = true
          break
        }
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      if (!hasSession) {
        setError('Connexion en cours. Réessaie dans quelques secondes.')
        return
      }

      router.replace('/dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card-soft">
            <div className="text-center mb-8">
              <LogIn className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                Connexion
              </h1>
              <p className="text-gray-600">
                Connectez-vous à votre compte FitPulse
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {signupStatus === 'check-email' && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg">
                  Compte créé. Vérifie ton email pour confirmer ton compte, puis connecte-toi.
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="votre.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre mot de passe"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3"
              >
                {isSubmitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Pas encore de compte ?{' '}
                <Link href="/inscription" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <Link href="/reset" className="text-sm text-primary-600 hover:text-primary-700">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
