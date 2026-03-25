'use client'

import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { UserPlus, Mail, Lock, User, Check, Dumbbell, Building2, CircleDot } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { persistSettingsForUser } from '@/lib/user-state-store'
import { programs } from '@/data/programs'
import { recommendProgram } from '@/lib/recommendation'
import { generateWeeklyPlan } from '@/lib/weekly-plan'
import { ensureTrialStarted, setStoredPlan } from '@/lib/subscription'
import { trackEvent } from '@/lib/analytics-client'

const focusZoneOptions = [
  { label: 'Bras', details: 'Biceps • Triceps' },
  { label: 'Poitrine', details: 'Pectoraux' },
  { label: 'Dos', details: 'Lats • Trapèzes' },
  { label: 'Abdos', details: 'Core' },
  { label: 'Jambes', details: 'Quadriceps • Ischios' },
  { label: 'Bas du corps', details: 'Jambes • Fessiers' },
]

const equipmentOptions = [
  { label: 'Poids du corps', details: 'Sans matériel', icon: User },
  { label: 'Haltères', details: 'Paire simple ou ajustable', icon: Dumbbell },
  { label: 'Barres', details: 'Barre droite / EZ', icon: CircleDot },
  { label: 'Machines de salle', details: 'Poulies • guidées', icon: Building2 },
]

function InscriptionPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [goals, setGoals] = useState<string[]>(['Cardio'])
  const [focusZones, setFocusZones] = useState<string[]>([])
  const [avoidZones, setAvoidZones] = useState<string[]>([])
  const [level, setLevel] = useState('debutant')
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [equipment, setEquipment] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fromTour = searchParams.get('from') === 'tour'
  const goalsOptions = ['Cardio', 'Perte de poids', 'Prise de masse', 'Force', 'Sèche', 'Souplesse']
  const weeklyPlanPreview = useMemo(() => generateWeeklyPlan(sessionsPerWeek), [sessionsPerWeek])
  const recommended = useMemo(
    () =>
      recommendProgram(programs, {
        level,
        goals,
        equipment,
        sessionsPerWeek,
      }),
    [level, goals, equipment, sessionsPerWeek]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    trackEvent('signup_submit_start', { fromTour })

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setIsSubmitting(false)
      return
    }

    if (goals.length === 0) {
      setError('Sélectionne au moins un objectif pour personnaliser ton plan')
      setIsSubmitting(false)
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    const safeName = name || normalizedEmail.split('@')[0]
    const normalizedGoals = goals.length > 0 ? goals : ['Cardio']
    const weeklyPlan = generateWeeklyPlan(sessionsPerWeek)
    const initialSettings = {
      level,
      goals: normalizedGoals,
      goal: normalizedGoals[0],
      equipment,
      recommendedProgramId: recommended?.program.id,
      recommendedProgramSlug: recommended?.program.slug,
      weeklyPlan,
      reminderEmailsEnabled: true,
      pushRemindersEnabled: true,
      restTime: 60,
      weightUnit: 'kg',
      sessionsPerWeek,
      focusZones,
      avoidZones,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
    }

    try {
      const supabase = getSupabaseBrowserClient()
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (typeof window !== 'undefined' ? window.location.origin : '')
      const emailRedirectTo = appUrl ? `${appUrl.replace(/\/$/, '')}/connexion` : undefined
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: safeName,
            phone: phone || null,
            fitpulse_plan: 'free',
            fitpulse_trial_started_at: new Date().toISOString(),
          },
        },
      })
      if (signUpError) {
        throw signUpError
      }

      // Fire-and-forget: account creation should not fail if SMTP is temporarily unavailable.
      void fetch('/api/signup-confirmation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: normalizedEmail,
          name: safeName,
        }),
      }).catch(() => {})

      localStorage.setItem('fitpulse_settings', JSON.stringify(initialSettings))
      setStoredPlan('free')
      ensureTrialStarted()
      if (signUpData.user?.id) {
        void persistSettingsForUser(signUpData.user.id, initialSettings)
      }

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInError) {
        const message = (signInError.message || '').toLowerCase()
        if (message.includes('email not confirmed') || message.includes('email_not_confirmed')) {
          router.replace('/connexion?signup=check-email')
          return
        }
        throw signInError
      }
      if (signInData.user?.id) {
        void persistSettingsForUser(signInData.user.id, initialSettings)
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('fitpulse_login_just_signed_in_at', String(Date.now()))
      }
      trackEvent('signup_success', {
        fromTour,
        level,
        sessionsPerWeek,
        goalsCount: normalizedGoals.length,
      })
    } catch (err) {
      trackEvent('signup_error', { fromTour })
      setError(err instanceof Error ? err.message : 'Impossible de créer le compte pour le moment')
      setIsSubmitting(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="card-soft">
            <div className="text-center mb-8">
              <UserPlus className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                Créer un compte
              </h1>
              <p className="text-gray-600">
                Commencez votre parcours fitness dès aujourd&apos;hui
              </p>
            </div>
            {fromTour && (
              <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-800">
                Tu viens de la visite guidée: crée ton compte pour sauvegarder ton plan et ton historique.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet (optionnel)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
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
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone (optionnel)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Répétez le mot de passe"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Profil fitness</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Poids (kg)</label>
                    <input
                      type="number"
                      min={30}
                      max={250}
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taille (cm)</label>
                    <input
                      type="number"
                      min={120}
                      max={230}
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="175"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Objectifs (plusieurs choix possibles)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {goalsOptions.map((goalOption) => (
                      <button
                        type="button"
                        key={goalOption}
                        onClick={() =>
                          setGoals((prev) =>
                            prev.includes(goalOption)
                              ? prev.filter((item) => item !== goalOption)
                              : [...prev, goalOption]
                          )
                        }
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          goals.includes(goalOption)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                        }`}
                      >
                        {goalOption}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Zones ciblées</label>
                      <p className="text-xs text-gray-500 mt-1">
                        Sélectionne les zones que tu veux prioriser.
                      </p>
                    </div>
                    <span className="text-xs font-semibold rounded-full bg-primary-50 text-primary-700 px-2.5 py-1">
                      {focusZones.length} sélectionnée(s)
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {focusZoneOptions.map((zone) => {
                      const active = focusZones.includes(zone.label)
                      return (
                        <button
                          type="button"
                          key={zone.label}
                          onClick={() =>
                            setFocusZones((prev) =>
                              active ? prev.filter((item) => item !== zone.label) : [...prev, zone.label]
                            )
                          }
                          className={`relative rounded-xl border p-3 text-left transition ${
                            active
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                              : 'border-gray-200 bg-white hover:border-primary-300'
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div className="text-sm font-semibold text-gray-900">{zone.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{zone.details}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zone à éviter</label>
                  <div className="flex flex-wrap gap-2">
                    {['Dos', 'Genoux', 'Épaules', 'Hanches'].map((zone) => (
                      <button
                        type="button"
                        key={zone}
                        onClick={() =>
                          setAvoidZones((prev) =>
                            prev.includes(zone) ? prev.filter((item) => item !== zone) : [...prev, zone]
                          )
                        }
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          avoidZones.includes(zone)
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="avance">Avancé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Séances par semaine</label>
                  <input
                    type="range"
                    min={1}
                    max={7}
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                  <div className="text-sm text-gray-600 mt-2">{sessionsPerWeek} séance(s) / semaine</div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900">Équipement disponible</label>
                      <p className="text-xs text-gray-500 mt-1">Ajoute le matériel que tu as vraiment.</p>
                    </div>
                    <span className="text-xs font-semibold rounded-full bg-primary-50 text-primary-700 px-2.5 py-1">
                      {equipment.length} sélectionné(s)
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {equipmentOptions.map((item) => {
                      const active = equipment.includes(item.label)
                      const Icon = item.icon
                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() =>
                            setEquipment((prev) =>
                              active ? prev.filter((value) => value !== item.label) : [...prev, item.label]
                            )
                          }
                          className={`relative rounded-xl border p-3 text-left transition ${
                            active
                              ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                              : 'border-gray-200 bg-white hover:border-primary-300'
                          }`}
                        >
                          {active && (
                            <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                              <div className="text-xs text-gray-500">{item.details}</div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {recommended && (
                  <div className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                      Plan de départ recommandé
                    </div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{recommended.program.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Première séance: {recommended.program.sessions[0]?.name || 'Séance 1'}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Pourquoi: {recommended.reasons.length > 0 ? recommended.reasons.join(' • ') : 'adapté à ton profil'}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                    Aperçu de ta semaine
                  </div>
                  <div className="mt-2 text-sm text-gray-700">
                    {weeklyPlanPreview
                      .filter((day) => day.type === 'training')
                      .map((day) => day.label)
                      .join(' • ')}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {sessionsPerWeek} séance(s) répartie(s) automatiquement.
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3"
              >
                {isSubmitting ? 'Création du compte...' : 'Créer mon compte'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Déjà un compte ?{' '}
                <Link href="/connexion" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <InscriptionPageContent />
    </Suspense>
  )
}
