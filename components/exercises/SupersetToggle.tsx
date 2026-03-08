'use client'

import { useState } from 'react'

type SupersetMap = Record<string, string>

function readSupersetMap(storageKey: string): SupersetMap {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}')
  } catch {
    return {}
  }
}

function writeSupersetMap(storageKey: string, map: SupersetMap) {
  localStorage.setItem(storageKey, JSON.stringify(map))
}

export default function SupersetToggle({
  storageKey,
  exerciseId,
  nextExerciseId,
  label = 'Superset',
  onChange,
}: {
  storageKey: string
  exerciseId: string
  nextExerciseId?: string
  label?: string
  onChange?: (map: SupersetMap) => void
}) {
  const [refreshKey, setRefreshKey] = useState(0)
  const groupId = (() => {
    const map = readSupersetMap(storageKey)
    return map[exerciseId] || null
  })()

  const toggle = () => {
    if (!nextExerciseId) return
    const map = readSupersetMap(storageKey)
    const existing = map[exerciseId]
    if (existing) {
      Object.keys(map).forEach((key) => {
        if (map[key] === existing) delete map[key]
      })
      writeSupersetMap(storageKey, map)
      setRefreshKey((value) => value + 1)
      onChange?.(map)
      return
    }
    const newGroupId = `${exerciseId}-${nextExerciseId}`
    map[exerciseId] = newGroupId
    map[nextExerciseId] = newGroupId
    writeSupersetMap(storageKey, map)
    setRefreshKey((value) => value + 1)
    onChange?.(map)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!nextExerciseId}
      className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
        groupId
          ? 'bg-red-500 text-white border-red-500'
          : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
      }`}
      title={nextExerciseId ? 'Associer avec l’exercice suivant' : 'Pas d’exercice suivant'}
    >
      {label}
    </button>
  )
}
