'use client'

import { useState, useEffect } from 'react'
import { User, Target, Dumbbell, Save } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/ToastProvider'

interface UserSettings {
  name: string
  email: string
  phone: string
  level: string
  goals: string[]
  equipment: string[]
}

export default function Settings() {
  const { data: session, update } = useSession()
  const { push } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    level: 'debutant',
    goals: [],
    equipment: [],
  })
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Charger les paramètres utilisateur
    const userSettings = JSON.parse(localStorage.getItem('fitpulse_settings') || '{"level": "debutant", "goals": [], "equipment": []}')
    
    setSettings({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
      phone: session?.user?.phone || '',
      level: userSettings.level || 'debutant',
      goals: userSettings.goals || [],
      equipment: userSettings.equipment || [],
    })
  }, [session?.user?.email, session?.user?.name, session?.user?.phone])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Erreur serveur')
      }

      await update({ name: settings.name, email: settings.email, phone: settings.phone })

      localStorage.setItem('fitpulse_settings', JSON.stringify({
        level: settings.level,
        goals: settings.goals,
        equipment: settings.equipment,
      }))

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      push("Impossible d'enregistrer les paramètres", 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleGoal = (goal: string) => {
    setSettings(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }))
  }

  const toggleEquipment = (equipment: string) => {
    setSettings(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }))
  }

  const goalsOptions = ['Perte de poids', 'Prise de masse', 'Endurance', 'Force', 'Souplesse']
  const equipmentOptions = ['Poids du corps', 'Élastiques', 'Haltères', 'Barres', 'Machines de salle']

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

      <div className="space-y-6">
        {/* Informations personnelles */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Informations personnelles</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="votre.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </div>

        {/* Niveau */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Niveau et objectifs</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre niveau
              </label>
              <select
                value={settings.level}
                onChange={(e) => setSettings({ ...settings, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vos objectifs (plusieurs choix possibles)
              </label>
              <div className="flex flex-wrap gap-2">
                {goalsOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      settings.goals.includes(goal)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Matériel */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Matériel disponible</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((equipment) => (
              <button
                key={equipment}
                onClick={() => toggleEquipment(equipment)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  settings.equipment.includes(equipment)
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                }`}
              >
                {equipment}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end items-center space-x-3">
          {saved && (
            <span className="text-sm text-green-600" role="status" aria-live="polite">
              Paramètres sauvegardés
            </span>
          )}
          <button
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder les paramètres'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
