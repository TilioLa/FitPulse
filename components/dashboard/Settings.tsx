'use client'

import { useState, useEffect, useMemo } from 'react'
import { User, Target, Dumbbell, Save } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { persistSettingsForUser, readLocalSettings, writeLocalSettings } from '@/lib/user-state-store'
import { generateWeeklyPlan, type WeeklyPlanDay } from '@/lib/weekly-plan'
import {
  canUseBrowserNotifications,
  requestBrowserNotificationPermission,
  sendTestBrowserNotification,
} from '@/lib/web-notification-reminder'

interface UserSettings {
  name: string
  email: string
  phone: string
  level: string
  goals: string[]
  equipment: string[]
  restTime: number
  restBetweenExercises: number
  autoRestAfterSet: boolean
  soundEnabled: boolean
  voiceEnabled: boolean
  reminderEmailsEnabled: boolean
  pushRemindersEnabled: boolean
  weightUnit: 'kg' | 'lbs'
  weight?: number
  height?: number
  goal?: string
  sessionsPerWeek?: number
  focusZones?: string[]
  avoidZones?: string[]
  weeklyPlan?: WeeklyPlanDay[]
}

const normalizeForComparison = (value: UserSettings) => ({
  ...value,
  email: value.email.trim(),
  goals: [...value.goals].sort(),
  equipment: [...value.equipment].sort(),
  focusZones: [...(value.focusZones ?? [])].sort(),
  avoidZones: [...(value.avoidZones ?? [])].sort(),
})

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const { push } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    name: '',
    email: '',
    phone: '',
    level: 'debutant',
    goals: [],
    equipment: [],
    restTime: 60,
    restBetweenExercises: 180,
    autoRestAfterSet: true,
    soundEnabled: true,
    voiceEnabled: false,
    reminderEmailsEnabled: true,
    pushRemindersEnabled: true,
    weightUnit: 'kg',
    goal: 'Cardio',
    sessionsPerWeek: 3,
    focusZones: [],
    avoidZones: [],
  })
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [initialSettings, setInitialSettings] = useState<UserSettings | null>(null)
  const previewWeeklyPlan = useMemo(
    () => generateWeeklyPlan(settings.sessionsPerWeek ?? 3),
    [settings.sessionsPerWeek]
  )
  const trimmedEmail = settings.email.trim()
  const hasEmail = trimmedEmail.length > 0
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)
  const hasChanges =
    initialSettings !== null &&
    JSON.stringify(normalizeForComparison(settings)) !== JSON.stringify(normalizeForComparison(initialSettings))
  const canSave = hasChanges && hasEmail && isEmailValid && !isSaving

  useEffect(() => {
    // Charger les paramètres utilisateur
    const userSettings = readLocalSettings() as Partial<UserSettings>
    
    const loadedSettings: UserSettings = {
      name: userSettings.name || user?.name || '',
      email: userSettings.email || user?.email || '',
      phone: userSettings.phone || user?.phone || '',
      level: userSettings.level || 'debutant',
      goals: Array.isArray(userSettings.goals) ? userSettings.goals : [],
      equipment: Array.isArray(userSettings.equipment) ? userSettings.equipment : [],
      restTime: Number.isFinite(userSettings.restTime) ? Number(userSettings.restTime) : 60,
      restBetweenExercises: Number.isFinite(userSettings.restBetweenExercises) ? Number(userSettings.restBetweenExercises) : 180,
      autoRestAfterSet:
        typeof userSettings.autoRestAfterSet === 'boolean' ? userSettings.autoRestAfterSet : true,
      soundEnabled: typeof userSettings.soundEnabled === 'boolean' ? userSettings.soundEnabled : true,
      voiceEnabled: typeof userSettings.voiceEnabled === 'boolean' ? userSettings.voiceEnabled : false,
      reminderEmailsEnabled:
        typeof userSettings.reminderEmailsEnabled === 'boolean' ? userSettings.reminderEmailsEnabled : true,
      pushRemindersEnabled:
        typeof userSettings.pushRemindersEnabled === 'boolean' ? userSettings.pushRemindersEnabled : true,
      weightUnit: userSettings.weightUnit === 'lbs' ? 'lbs' : 'kg',
      weight: Number.isFinite(userSettings.weight) ? Number(userSettings.weight) : undefined,
      height: Number.isFinite(userSettings.height) ? Number(userSettings.height) : undefined,
      goal: userSettings.goal || 'Cardio',
      sessionsPerWeek: Number.isFinite(userSettings.sessionsPerWeek) ? Number(userSettings.sessionsPerWeek) : 3,
      focusZones: Array.isArray(userSettings.focusZones) ? userSettings.focusZones : [],
      avoidZones: Array.isArray(userSettings.avoidZones) ? userSettings.avoidZones : [],
      weeklyPlan: Array.isArray(userSettings.weeklyPlan)
        ? userSettings.weeklyPlan
        : generateWeeklyPlan(Number.isFinite(userSettings.sessionsPerWeek) ? Number(userSettings.sessionsPerWeek) : 3),
    }
    setSettings(loadedSettings)
    setInitialSettings(loadedSettings)
  }, [user?.email, user?.name, user?.phone])

  useEffect(() => {
    if (!hasChanges) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const handleSave = async () => {
    if (!canSave) return

    setIsSaving(true)
    try {
      const previousSettings = readLocalSettings()
      const weeklyPlan = generateWeeklyPlan(settings.sessionsPerWeek ?? 3)
      const nextSettings = {
        ...previousSettings,
        name: settings.name,
        email: trimmedEmail,
        phone: settings.phone,
        level: settings.level,
        goals: settings.goals,
        equipment: settings.equipment,
        restTime: settings.restTime,
        restBetweenExercises: settings.restBetweenExercises,
        autoRestAfterSet: settings.autoRestAfterSet,
        soundEnabled: settings.soundEnabled,
        voiceEnabled: settings.voiceEnabled,
        reminderEmailsEnabled: settings.reminderEmailsEnabled,
        pushRemindersEnabled: settings.pushRemindersEnabled,
        weightUnit: settings.weightUnit,
        weight: settings.weight,
        height: settings.height,
        goal: settings.goal,
        sessionsPerWeek: settings.sessionsPerWeek,
        focusZones: settings.focusZones,
        avoidZones: settings.avoidZones,
        weeklyPlan,
      }

      // Always persist local settings first so user changes are not lost.
      writeLocalSettings(nextSettings)
      if (user?.id) {
        await persistSettingsForUser(user.id, nextSettings)
      }

      try {
        await updateProfile({ name: settings.name, phone: settings.phone })
      } catch {
        // Keep settings saved even if profile metadata update fails.
        push('Paramètres enregistrés, mais le profil Supabase n’a pas pu être mis à jour.', 'info')
      }

      setSettings((prev) => ({ ...prev, email: trimmedEmail }))
      setInitialSettings({ ...settings, email: trimmedEmail, weeklyPlan })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      push('Paramètres enregistrés.', 'success')
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
  const focusOptions = ['Pectoraux', 'Dos', 'Bras', 'Jambes', 'Épaules', 'Abdos', 'Fessiers']
  const avoidOptions = ['Dos', 'Genoux', 'Épaules', 'Hanches']
  const equipmentOptions = ['Poids du corps', 'Élastiques', 'Haltères', 'Barres', 'Machines de salle']
  const notificationsSupported = canUseBrowserNotifications()

  return (
    <div className="page-wrap">
      <h1 className="section-title mb-8">Paramètres</h1>
      <p
        className={`mb-4 text-sm ${saved ? 'text-green-700' : hasChanges ? 'text-amber-700' : 'text-gray-600'}`}
        aria-live="polite"
      >
        {saved ? 'Paramètres sauvegardés.' : hasChanges ? 'Modifications non enregistrées.' : 'Tous les changements sont sauvegardés.'}
      </p>

      <div className="space-y-6">
        <div className="card-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Accès</h2>
              <p className="text-sm text-gray-600 mt-1">
                Toutes les fonctionnalités FitPulse sont actuellement accessibles gratuitement.
              </p>
            </div>
          </div>
        </div>

        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Rappels</h2>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Recevoir les emails de rappel</div>
              <div className="text-xs text-gray-500">Séance planifiée et reprise de rythme</div>
            </div>
            <input
              type="checkbox"
              checked={settings.reminderEmailsEnabled}
              onChange={(e) => setSettings({ ...settings, reminderEmailsEnabled: e.target.checked })}
              className="h-5 w-5 accent-primary-600"
            />
          </label>
          <label className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Recevoir les notifications navigateur</div>
              <div className="text-xs text-gray-500">
                Rappel local sur cet appareil
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.pushRemindersEnabled}
              onChange={(e) => setSettings({ ...settings, pushRemindersEnabled: e.target.checked })}
              className="h-5 w-5 accent-primary-600"
            />
          </label>
          <label className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Auto repos après série</div>
              <div className="text-xs text-gray-500">
                Lance automatiquement le timer de repos après validation d&apos;une série
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoRestAfterSet}
              onChange={(e) => setSettings({ ...settings, autoRestAfterSet: e.target.checked })}
              className="h-5 w-5 accent-primary-600"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (!notificationsSupported) {
                  push('Notifications non supportées sur ce navigateur.', 'error')
                  return
                }
                const status = await requestBrowserNotificationPermission()
                if (status === 'granted') push('Notifications navigateur activées.', 'success')
                else if (status === 'denied') push('Notifications refusées par le navigateur.', 'error')
              }}
              className="btn-secondary"
            >
              Activer les notifications
            </button>
            <button
              type="button"
              onClick={() => {
                if (sendTestBrowserNotification()) push('Notification de test envoyée.', 'success')
                else push('Active d’abord les notifications navigateur.', 'error')
              }}
              className="btn-secondary"
            >
              Tester la notification
            </button>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <User className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Informations personnelles</h2>
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
                onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
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
                onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                  !hasEmail || isEmailValid
                    ? 'border-gray-300 focus:ring-primary-500'
                    : 'border-red-400 focus:ring-red-500'
                }`}
                placeholder="votre.email@example.com"
                aria-invalid={hasEmail && !isEmailValid}
              />
              {hasEmail && !isEmailValid && (
                <p className="mt-2 text-sm text-red-600">Adresse email invalide.</p>
              )}
            </div>

            <div>
              <label htmlFor="settings-phone" className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de téléphone
              </label>
              <input
                id="settings-phone"
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </div>

        {/* Niveau */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Niveau et objectifs</h2>
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
                    type="button"
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    aria-pressed={settings.goals.includes(goal)}
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

        {/* Profil fitness */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Target className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Profil fitness</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Poids ({settings.weightUnit})</label>
              <input
                type="number"
                min={30}
                max={250}
                value={settings.weight ?? ''}
                onChange={(e) => setSettings({ ...settings, weight: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Taille (cm)</label>
              <input
                type="number"
                min={120}
                max={230}
                value={settings.height ?? ''}
                onChange={(e) => setSettings({ ...settings, height: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Objectif principal</label>
            <select
              value={settings.goal}
              onChange={(e) => setSettings({ ...settings, goal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option>Cardio</option>
              <option>Perte de poids</option>
              <option>Prise de masse</option>
              <option>Force</option>
              <option>Sèche</option>
              <option>Souplesse</option>
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Séances par semaine</label>
            <input
              type="range"
              min={1}
              max={7}
              value={settings.sessionsPerWeek ?? 3}
              onChange={(e) => setSettings({ ...settings, sessionsPerWeek: Number(e.target.value) })}
              className="w-full accent-primary-600"
            />
            <div className="text-sm text-gray-600 mt-2">{settings.sessionsPerWeek ?? 3} séance(s) / semaine</div>
            <div className="mt-3">
              <div className="text-xs font-semibold text-gray-500 mb-2">Plan 7 jours auto</div>
              <div className="grid grid-cols-7 gap-1">
                {previewWeeklyPlan.map((day) => (
                  <div
                    key={day.date}
                    className={`text-center rounded-lg px-1 py-2 text-[11px] font-semibold ${
                      day.type === 'training'
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {day.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zones à muscler</label>
            <div className="flex flex-wrap gap-2">
              {focusOptions.map((zone) => (
                <button
                  type="button"
                  key={zone}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      focusZones: prev.focusZones?.includes(zone)
                        ? prev.focusZones.filter((item) => item !== zone)
                        : [...(prev.focusZones || []), zone],
                    }))
                  }
                  aria-pressed={settings.focusZones?.includes(zone)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    settings.focusZones?.includes(zone)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Zones à éviter</label>
            <div className="flex flex-wrap gap-2">
              {avoidOptions.map((zone) => (
                <button
                  type="button"
                  key={zone}
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      avoidZones: prev.avoidZones?.includes(zone)
                        ? prev.avoidZones.filter((item) => item !== zone)
                        : [...(prev.avoidZones || []), zone],
                    }))
                  }
                  aria-pressed={settings.avoidZones?.includes(zone)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    settings.avoidZones?.includes(zone)
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-red-300'
                  }`}
                >
                  {zone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matériel */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Matériel disponible</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {equipmentOptions.map((equipment) => (
              <button
                type="button"
                key={equipment}
                onClick={() => toggleEquipment(equipment)}
                aria-pressed={settings.equipment.includes(equipment)}
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

        {/* Temps de repos */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Temps de repos</h2>
          </div>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Choisissez votre temps de repos par défaut. Il sera appliqué aux séances et programmes.
            </div>
            <div className="text-2xl font-bold text-gray-900">{settings.restTime} secondes</div>
            <input
              type="range"
              min={30}
              max={180}
              step={5}
              value={settings.restTime}
              onChange={(e) => setSettings({ ...settings, restTime: Number(e.target.value) })}
              className="w-full accent-primary-600"
            />
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600 mb-2">
                Temps de repos entre exercices.
              </div>
              <div className="text-2xl font-bold text-gray-900">{settings.restBetweenExercises} secondes</div>
              <input
                type="range"
                min={30}
                max={300}
                step={15}
                value={settings.restBetweenExercises}
                onChange={(e) =>
                  setSettings({ ...settings, restBetweenExercises: Number(e.target.value) })
                }
                className="w-full accent-primary-600"
              />
            </div>
          </div>
        </div>

        {/* Son */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Son</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Bip de fin de repos</div>
              <div className="text-xs text-gray-500">Active ou désactive l’alerte sonore</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                settings.soundEnabled
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              {settings.soundEnabled ? 'Activé' : 'Désactivé'}
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="text-sm font-medium text-gray-700">Rappel vocal</div>
              <div className="text-xs text-gray-500">Annonce la fin du repos / exercice suivant</div>
            </div>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                settings.voiceEnabled
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              {settings.voiceEnabled ? 'Activé' : 'Désactivé'}
            </button>
          </div>
        </div>

        {/* Unité de poids */}
        <div className="card-soft">
          <div className="flex items-center space-x-2 mb-6">
            <Dumbbell className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">Unité de poids</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, weightUnit: 'kg' })}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                settings.weightUnit === 'kg'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              Kilogrammes (kg)
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, weightUnit: 'lbs' })}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                settings.weightUnit === 'lbs'
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
              }`}
            >
              Livres (lbs)
            </button>
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
            type="button"
            onClick={() => {
              if (!initialSettings) return
              setSettings(initialSettings)
              setSaved(false)
            }}
            className="btn-secondary disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!hasChanges || isSaving}
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!canSave}
          >
            <Save className="h-5 w-5" />
            <span>{isSaving ? 'Sauvegarde...' : saved ? 'Sauvegardé !' : 'Sauvegarder les paramètres'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
