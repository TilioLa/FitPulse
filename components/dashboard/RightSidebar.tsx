'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { useAuth } from '@/components/SupabaseAuthProvider'

type Activity = {
  title: string
  date: string
}

export default function RightSidebar() {
  const { user } = useAuth()
  const [latest, setLatest] = useState<Activity | null>(null)

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]')
    const last = history?.[history.length - 1]
    if (last) {
      setLatest({
        title: last.workoutName,
        date: new Date(last.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
          {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
        </div>
        <div className="text-lg font-semibold text-gray-900">
          {user?.name || 'Utilisateur FitPulse'}
        </div>
        <div className="text-sm text-gray-500 mb-4">{user?.email}</div>
        <button className="btn-secondary w-full">Voir votre profil</button>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Dernière activité</h3>
        {latest ? (
          <div className="text-sm text-gray-600">
            <div className="font-semibold text-gray-900">{latest.title}</div>
            <div>{latest.date}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Aucune activité enregistrée.</div>
        )}
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggestions</h3>
        <div className="space-y-3 text-sm text-gray-600">
          {['alex_fit', 'sara_training', 'coach_nico', 'mila_power'].map((name) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                </div>
                <div>{name}</div>
              </div>
              <button className="text-primary-600 font-semibold">Suivre</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
