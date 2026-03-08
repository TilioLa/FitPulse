//
//  Settings.tsx
//  
//
//  Created by Tilio Lave on 18/01/2026.
//

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { parseJsonWithFallback } from '@/lib/safeStorage'
import { User, Target, Dumbbell, Save } from 'lucide-react'

interface UserSettings {
  name: string
  email: string
  level: string
  goals: string[]
  equipment: string[]
}

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  email: '',
  level: 'debutant',
  goals: [],
  equipment: [],
}

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const areSameStringArrays = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((value, index) => value === sortedB[index])
}

const areSettingsEqual = (a: UserSettings, b: UserSettings) =>
  a.name === b.name &&
  a.email === b.email &&
  a.level === b.level &&
  areSameStringArrays(a.goals, b.goals) &&
  areSameStringArrays(a.equipment, b.equipment)

const getChangedFieldCount = (current: UserSettings, initial: UserSettings) => {
  let count = 0
  if (current.name !== initial.name) count += 1
  if (current.email.trim() !== initial.email.trim()) count += 1
  if (current.level !== initial.level) count += 1
  if (!areSameStringArrays(current.goals, initial.goals)) count += 1
  if (!areSameStringArrays(current.equipment, initial.equipment)) count += 1
  return count
}

const goalsOptions = ['Perte de poids', 'Prise de masse', 'Endurance', 'Force', 'Souplesse']
const equipmentOptions = ['Poids du corps', 'Élastiques', 'Haltères', 'Barres', 'Machines de salle']

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const hasChanges = !areSettingsEqual(settings, initialSettings)
  const changedFieldCount = useMemo(
    () => getChangedFieldCount(settings, initialSettings),
    [settings, initialSettings]
  )
  const trimmedEmail = settings.email.trim()
  const hasEmail = trimmedEmail.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  const canSave = hasChanges && hasEmail && isEmailValid
  const saveBlockedReason = !hasChanges
    ? 'Aucune modification à sauvegarder.'
    : !hasEmail
      ? 'Ajoute une adresse email pour sauvegarder.'
      : !isEmailValid
        ? 'Renseigne une adresse email valide.'
        : null

  useEffect(() => {
    // Charger les paramètres utilisateur
    const user = parseJsonWithFallback(localStorage.getItem('fitpulse_user'), {
      name: '',
      email: '',
    }, isObjectRecord)
    const userSettings = parseJsonWithFallback(localStorage.getItem('fitpulse_settings'), {
      level: 'debutant',
      goals: [],
      equipment: [],
    }, isObjectRecord)

    const name = typeof user.name === 'string' ? user.name : ''
    const email = typeof user.email === 'string' ? user.email : ''
    const level = typeof userSettings.level === 'string' ? userSettings.level : 'debutant'
    const goals = Array.isArray(userSettings.goals) && userSettings.goals.every((goal) => typeof goal === 'string')
      ? userSettings.goals
      : []
    const equipment = Array.isArray(userSettings.equipment) && userSettings.equipment.every((item) => typeof item === 'string')
      ? userSettings.equipment
      : []
    
    const loadedSettings: UserSettings = {
      name,
      email,
      level,
      goals,
      equipment,
    }
    setSettings(loadedSettings)
    setInitialSettings(loadedSettings)
  }, [])

  useEffect(() => {
    if (!hasChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleSave = useCallback(() => {
    if (!canSave) return

    // Sauvegarder les paramètres
    try {
      setSaveError(null)
      const user = parseJsonWithFallback<Record<string, unknown>>(
        localStorage.getItem('fitpulse_user'),
        {},
        isObjectRecord
      )
      user.name = settings.name
      user.email = trimmedEmail
      localStorage.setItem('fitpulse_user', JSON.stringify(user))
      localStorage.setItem('fitpulse_settings', JSON.stringify({
        level: settings.level,
        goals: settings.goals,
        equipment: settings.equipment,
      }))

      setSettings((prev) => ({ ...prev, email: trimmedEmail }))
      setInitialSettings({ ...settings, email: trimmedEmail })
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError("Impossible de sauvegarder pour l'instant. Réessaie.")
    }
  }, [canSave, settings, trimmedEmail])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleSave])

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

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>
      <p
        className={`mb-6 text-sm ${saveError ? 'text-red-700' : saved ? 'text-green-700' : hasChanges ? 'text-amber-700' : 'text-gray-600'}`}
        aria-live="polite"
      >
        {saveError || (saved ? 'Paramètres sauvegardés.' : hasChanges ? 'Modifications non enregistrées.' : 'Tous les changements sont sauvegardés.')}
      </p>
      <p className="mb-6 text-xs text-gray-500">
        Raccourci: <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px]">Cmd/Ctrl + S</kbd>
        {lastSavedAt ? ` · Dernière sauvegarde: ${lastSavedAt}` : ''}
      </p>
      <p className={`mb-6 text-sm ${hasChanges ? 'text-amber-700' : 'text-gray-600'}`}>
        {hasChanges
          ? `${changedFieldCount} section${changedFieldCount > 1 ? 's' : ''} modifiée${changedFieldCount > 1 ? 's' : ''}.`
          : 'Aucune section modifiée.'}
      </p>

      <div className="space-y-6">
        {/* Informations personnelles */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Informations personnelles</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="settings-name"
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="settings-email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  !hasEmail || isEmailValid
                    ? 'border-gray-300 focus:ring-primary-500'
                    : 'border-red-400 focus:ring-red-500'
                }`}
                placeholder="votre.email@example.com"
                aria-invalid={hasEmail && !isEmailValid}
                aria-describedby={hasEmail && !isEmailValid ? 'settings-email-error' : undefined}
              />
              {hasEmail && !isEmailValid && (
                <p id="settings-email-error" className="mt-2 text-sm text-red-600">Adresse email invalide.</p>
              )}
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
              <label htmlFor="settings-level" className="block text-sm font-medium text-gray-700 mb-2">
                Votre niveau
              </label>
              <select
                id="settings-level"
                value={settings.level}
                onChange={(e) => setSettings({ ...settings, level: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Vos objectifs (plusieurs choix possibles)
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Objectifs">
                {goalsOptions.map((goal) => (
                  <button
                    type="button"
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    aria-pressed={settings.goals.includes(goal)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600 ${
                      settings.goals.includes(goal)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Matériel */}
        <div className="card">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-semibold text-gray-900">Matériel disponible</h2>
          </div>

          <fieldset>
            <legend className="sr-only">Matériel disponible</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Matériel disponible">
              {equipmentOptions.map((equipment) => (
                <button
                  type="button"
                  key={equipment}
                  onClick={() => toggleEquipment(equipment)}
                  aria-pressed={settings.equipment.includes(equipment)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600 ${
                    settings.equipment.includes(equipment)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {equipment}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="sticky bottom-0 z-10 -mx-2 rounded-xl border border-gray-200 bg-white/95 px-2 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:border-0">
          {saveBlockedReason && (
            <p className="mb-2 text-sm text-gray-600 sm:text-right">{saveBlockedReason}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSettings(initialSettings)
                setSaved(false)
                setSaveError(null)
              }}
              disabled={!hasChanges}
              className="btn-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Réinitialiser
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="btn-primary flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={saveBlockedReason ?? 'Sauvegarder les paramètres'}
              aria-keyshortcuts="Meta+S Control+S"
            >
              <Save className="h-5 w-5" />
              <span>{saved ? 'Sauvegardé !' : 'Sauvegarder les paramètres'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
