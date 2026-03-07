'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { UserPlus, Mail, Lock, User } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import { persistSettingsForUser } from '@/lib/user-state-store'
import { programs } from '@/data/programs'
import { recommendProgram } from '@/lib/recommendation'
import { generateWeeklyPlan } from '@/lib/weekly-plan'
import { ensureTrialStarted, setStoredPlan } from '@/lib/subscription'
import { trackUxEvent } from '@/lib/ux-events'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const getPasswordStrength = (value: string) => {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value) || /[^A-Za-z0-9]/.test(value)) score += 1

  if (score <= 1) return { label: 'Faible', color: 'bg-red-500', score }
  if (score === 2) return { label: 'Moyen', color: 'bg-amber-500', score }
  return { label: 'Fort', color: 'bg-emerald-500', score }
}

export default function InscriptionPage() {
  const router = useRouter()
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
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const alertRef = useRef<HTMLDivElement | null>(null)
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
  const normalizedEmail = email.trim().toLowerCase()
  const isEmailValid = normalizedEmail.length > 0 && emailPattern.test(normalizedEmail)
  const isPasswordLongEnough = password.length >= 6
  const isConfirmPasswordValid = confirmPassword.length > 0 && password === confirmPassword
  const hasAtLeastOneGoal = goals.length > 0
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])
  const canSubmit =
    !isSubmitting &&
    isEmailValid &&
    isPasswordLongEnough &&
    isConfirmPasswordValid &&
    hasAtLeastOneGoal
  const accountStepDone = isEmailValid && isPasswordLongEnough && isConfirmPasswordValid
  const profileStepDone = goals.length > 0 && (weight.length > 0 || height.length > 0 || focusZones.length > 0)
  const planStepDone = equipment.length > 0 && sessionsPerWeek > 0

  useEffect(() => {
    if (!error) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
    window.setTimeout(() => {
      alertRef.current?.focus()
    }, 150)
  }, [error])

  useEffect(() => {
    try {
      const localSettings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{}') as {
        level?: string
        goals?: string[]
        equipment?: string[]
        sessionsPerWeek?: number
        focusZones?: string[]
        avoidZones?: string[]
        weight?: number
        height?: number
      }
      if (Array.isArray(localSettings.goals) && localSettings.goals.length > 0) setGoals(localSettings.goals)
      if (Array.isArray(localSettings.equipment) && localSettings.equipment.length > 0) setEquipment(localSettings.equipment)
      if (Array.isArray(localSettings.focusZones)) setFocusZones(localSettings.focusZones)
      if (Array.isArray(localSettings.avoidZones)) setAvoidZones(localSettings.avoidZones)
      if (localSettings.level) setLevel(localSettings.level)
      if (Number.isFinite(localSettings.sessionsPerWeek)) setSessionsPerWeek(Number(localSettings.sessionsPerWeek))
      if (Number.isFinite(localSettings.weight)) setWeight(String(localSettings.weight))
      if (Number.isFinite(localSettings.height)) setHeight(String(localSettings.height))
    } catch {
      // ignore
    }
    if (navigator.language.startsWith('fr') && goals.length === 1 && goals[0] === 'Cardio') {
      setGoals(['Perte de poids', 'Cardio'])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!accountStepDone) setStep(1)
    else if (!profileStepDone) setStep(2)
    else setStep(3)
  }, [accountStepDone, profileStepDone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    trackUxEvent('cta_click', { location: 'inscription', cta: 'signup_submit' })

    if (password !== confirmPassword) {
      trackUxEvent('auth_validation_error', { page: 'inscription', reason: 'password_mismatch' })
      setError('Les mots de passe ne correspondent pas')
      setIsSubmitting(false)
      return
    }

    if (password.length < 6) {
      trackUxEvent('auth_validation_error', { page: 'inscription', reason: 'password_too_short' })
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setIsSubmitting(false)
      return
    }

    if (goals.length === 0) {
      trackUxEvent('auth_validation_error', { page: 'inscription', reason: 'missing_goal' })
      setError('Sélectionne au moins un objectif pour personnaliser ton plan')
      setIsSubmitting(false)
      return
    }

    if (!emailPattern.test(normalizedEmail)) {
      trackUxEvent('auth_validation_error', { page: 'inscription', reason: 'invalid_email' })
      setError('Renseigne une adresse email valide')
      setIsSubmitting(false)
      return
    }

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

      localStorage.setItem('fitpulse_settings', JSON.stringify(initialSettings))
      localStorage.setItem('fitpulse_signup_at', new Date().toISOString())
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
          trackUxEvent('auth_pending_confirmation', { page: 'inscription' })
          router.replace(`/connexion?signup=check-email&email=${encodeURIComponent(normalizedEmail)}`)
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
      trackUxEvent('auth_success', { method: 'password', page: 'inscription' })
    } catch (err) {
      trackUxEvent('auth_error', { page: 'inscription' })
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
              <p className="mt-2 text-xs text-gray-500">
                Gratuit, sans engagement. Ton plan est prêt en quelques minutes.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                <button type="button" onClick={() => setStep(1)} className={`rounded-lg px-2 py-1 font-semibold ${step === 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  1. Compte
                </button>
                <button type="button" onClick={() => setStep(2)} className={`rounded-lg px-2 py-1 font-semibold ${step === 2 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  2. Profil
                </button>
                <button type="button" onClick={() => setStep(3)} className={`rounded-lg px-2 py-1 font-semibold ${step === 3 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                  3. Plan
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div
                  id="inscription-error"
                  ref={alertRef}
                  tabIndex={-1}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              <div className={step === 1 ? '' : 'opacity-70'}>
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
                    onBlur={() => setName((prev) => prev.trim())}
                    autoComplete="name"
                    aria-describedby={error ? 'inscription-error' : undefined}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className={step === 1 ? '' : 'opacity-70'}>
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
                    onBlur={() => setEmail((prev) => prev.trim())}
                    required
                    autoComplete="email"
                    inputMode="email"
                    aria-invalid={Boolean(error)}
                    aria-describedby={`${error ? 'inscription-error ' : ''}${email && !isEmailValid ? 'inscription-email-error' : ''}`.trim() || undefined}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="votre.email@example.com"
                  />
                </div>
                {email && !isEmailValid && (
                  <p id="inscription-email-error" className="mt-2 text-sm text-red-600">
                    Adresse email invalide.
                  </p>
                )}
              </div>

              <div className={step === 1 ? '' : 'opacity-70'}>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro de téléphone (optionnel)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhone((prev) => prev.trim())}
                  autoComplete="tel"
                  inputMode="tel"
                  aria-describedby={error ? 'inscription-error' : undefined}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+33 6 12 34 56 78"
                />
              </div>

              <div className={step === 1 ? '' : 'opacity-70'}>
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
                    autoComplete="new-password"
                    aria-invalid={Boolean(error) || (password.length > 0 && !isPasswordLongEnough)}
                    aria-describedby={`${error ? 'inscription-error ' : ''}${password.length > 0 ? 'inscription-password-hint' : ''}`.trim() || undefined}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Minimum 6 caractères"
                  />
                </div>
                {password.length > 0 && (
                  <div id="inscription-password-hint" className="mt-2">
                    <div className="mb-1 text-xs text-gray-600">
                      Force du mot de passe: <span className="font-semibold">{passwordStrength.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={`pwd-strength-${index}`}
                          className={`h-1.5 rounded ${passwordStrength.score > index ? passwordStrength.color : 'bg-gray-200'}`}
                        />
                      ))}
                    </div>
                    {!isPasswordLongEnough && (
                      <p className="mt-2 text-sm text-red-600">Le mot de passe doit contenir au moins 6 caractères.</p>
                    )}
                  </div>
                )}
              </div>

              <div className={step === 1 ? '' : 'opacity-70'}>
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
                    autoComplete="new-password"
                    aria-invalid={Boolean(error) || (confirmPassword.length > 0 && !isConfirmPasswordValid)}
                    aria-describedby={`${error ? 'inscription-error ' : ''}${confirmPassword.length > 0 && !isConfirmPasswordValid ? 'inscription-confirm-error' : ''}`.trim() || undefined}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Répétez le mot de passe"
                  />
                </div>
                {confirmPassword.length > 0 && !isConfirmPasswordValid && (
                  <p id="inscription-confirm-error" className="mt-2 text-sm text-red-600">
                    Les mots de passe ne correspondent pas.
                  </p>
                )}
              </div>

              <div className={`border-t pt-6 space-y-4 ${step === 2 ? '' : 'opacity-70'}`}>
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
                        aria-pressed={goals.includes(goalOption)}
                      >
                        {goalOption}
                      </button>
                    ))}
                  </div>
                  {!hasAtLeastOneGoal && (
                    <p className="mt-2 text-sm text-red-600">Sélectionne au moins un objectif.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Zone à muscler</label>
                  <div className="flex flex-wrap gap-2">
                    {['Pectoraux', 'Dos', 'Bras', 'Jambes', 'Épaules', 'Abdos', 'Fessiers'].map((zone) => (
                      <button
                        type="button"
                        key={zone}
                        onClick={() =>
                          setFocusZones((prev) =>
                            prev.includes(zone) ? prev.filter((item) => item !== zone) : [...prev, zone]
                          )
                        }
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          focusZones.includes(zone)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                        }`}
                        aria-pressed={focusZones.includes(zone)}
                      >
                        {zone}
                      </button>
                    ))}
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
                        aria-pressed={avoidZones.includes(zone)}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={step === 3 ? '' : 'opacity-70'}>
                  <label htmlFor="inscription-level" className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                  <select
                    id="inscription-level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="debutant">Débutant</option>
                    <option value="intermediaire">Intermédiaire</option>
                    <option value="avance">Avancé</option>
                  </select>
                </div>

                <div className={step === 3 ? '' : 'opacity-70'}>
                  <label htmlFor="inscription-sessions" className="block text-sm font-medium text-gray-700 mb-2">Séances par semaine</label>
                  <input
                    id="inscription-sessions"
                    type="range"
                    min={1}
                    max={7}
                    value={sessionsPerWeek}
                    onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                  <div className="text-sm text-gray-600 mt-2">{sessionsPerWeek} séance(s) / semaine</div>
                </div>

                <div className={step === 3 ? '' : 'opacity-70'}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Équipement disponible</label>
                  <div className="flex flex-wrap gap-2">
                    {['Poids du corps', 'Élastiques', 'Haltères', 'Barres', 'Machines de salle'].map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() =>
                          setEquipment((prev) =>
                            prev.includes(item) ? prev.filter((value) => value !== item) : [...prev, item]
                          )
                        }
                        className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                          equipment.includes(item)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                        }`}
                        aria-pressed={equipment.includes(item)}
                      >
                        {item}
                      </button>
                    ))}
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

                <div className={`rounded-xl border border-gray-200 bg-white p-4 ${step === 3 ? '' : 'opacity-70'}`}>
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
                disabled={!canSubmit}
                className="w-full btn-primary py-3"
                aria-busy={isSubmitting}
                data-cta-id="signup_submit"
              >
                {isSubmitting ? 'Création du compte...' : 'Créer mon compte'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Déjà un compte ?{' '}
                <Link
                  href="/connexion"
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                  data-cta-id="signup_to_login"
                  onClick={() => trackUxEvent('cta_click', { location: 'inscription', cta: 'to_login' })}
                >
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
