'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { UserPlus, Mail, Lock, User } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'

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
  const [goal, setGoal] = useState('Cardio')
  const [focusZones, setFocusZones] = useState<string[]>([])
  const [avoidZones, setAvoidZones] = useState<string[]>([])
  const [level, setLevel] = useState('debutant')
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3)
  const [equipment, setEquipment] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    const safeName = name || normalizedEmail.split('@')[0]

    try {
      const supabase = getSupabaseBrowserClient()
      const { error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: safeName,
            phone: phone || null,
          },
        },
      })
      if (signUpError) {
        throw signUpError
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (signInError) {
        throw new Error("Compte créé. Vérifiez vos emails si la confirmation est activée, puis connectez-vous.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le compte pour le moment')
      return
    }

    // Initialiser les paramètres par défaut
    localStorage.setItem('fitpulse_settings', JSON.stringify({
      level,
      goals: [goal],
      equipment,
      restTime: 60,
      weightUnit: 'kg',
      sessionsPerWeek,
      focusZones,
      avoidZones,
      weight: weight ? Number(weight) : undefined,
      height: height ? Number(height) : undefined,
    }))

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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Objectif principal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option>Cardio</option>
                    <option>Perte de poids</option>
                    <option>Prise de masse</option>
                    <option>Force</option>
                    <option>Sèche</option>
                    <option>Souplesse</option>
                  </select>
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

                <div>
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
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3"
              >
                Créer mon compte
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
