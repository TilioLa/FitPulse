'use client'

import { useState } from 'react'
import { ExerciseMuscle, inferMuscles } from '@/lib/muscles'

const regionOrder = [
  'chest',
  'shoulders',
  'biceps',
  'triceps',
  'back',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
] as const

const regionLabels: Record<string, string> = {
  chest: 'Pectoraux',
  shoulders: 'Epaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  back: 'Dos',
  core: 'Abdominaux',
  glutes: 'Fessiers',
  quads: 'Quadriceps',
  hamstrings: 'Ischios',
  calves: 'Mollets',
}

function intensityColor(intensity: number) {
  if (intensity >= 3) return 'rgba(239, 68, 68, 0.95)'
  if (intensity === 2) return 'rgba(239, 68, 68, 0.6)'
  return 'rgba(239, 68, 68, 0.35)'
}

function intensityPercent(intensity: number) {
  if (intensity >= 3) return 70
  if (intensity === 2) return 40
  return 20
}

function MuscleOverlayFront({ intensity }: { intensity: Map<string, number> }) {
  return (
    <>
      <rect x="52" y="48" width="56" height="25" rx="12" fill={intensityColor(intensity.get('chest') || 0)} />
      <rect x="40" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="95" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="12" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('biceps') || 0)} />
      <rect x="125" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('biceps') || 0)} />
      <rect x="12" y="115" width="23" height="15" rx="6" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="125" y="115" width="23" height="15" rx="6" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="50" y="78" width="60" height="26" rx="12" fill={intensityColor(intensity.get('core') || 0)} />
      <rect x="48" y="110" width="64" height="28" rx="12" fill={intensityColor(intensity.get('glutes') || 0)} />
      <rect x="28" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('quads') || 0)} />
      <rect x="88" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('quads') || 0)} />
      <rect x="28" y="200" width="44" height="26" rx="10" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="88" y="200" width="44" height="26" rx="10" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="28" y="230" width="44" height="20" rx="8" fill={intensityColor(intensity.get('calves') || 0)} />
      <rect x="88" y="230" width="44" height="20" rx="8" fill={intensityColor(intensity.get('calves') || 0)} />
    </>
  )
}

function MuscleOverlayBack({ intensity }: { intensity: Map<string, number> }) {
  return (
    <>
      <rect x="46" y="48" width="68" height="38" rx="12" fill={intensityColor(intensity.get('back') || 0)} />
      <rect x="40" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="95" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="12" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="125" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="48" y="110" width="64" height="28" rx="12" fill={intensityColor(intensity.get('glutes') || 0)} />
      <rect x="28" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="88" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="28" y="205" width="44" height="26" rx="10" fill={intensityColor(intensity.get('calves') || 0)} />
      <rect x="88" y="205" width="44" height="26" rx="10" fill={intensityColor(intensity.get('calves') || 0)} />
    </>
  )
}

function MuscleFigure({
  src,
  label,
  overlay,
  onError,
}: {
  src: string
  label: string
  overlay: React.ReactNode
  onError: () => void
}) {
  return (
    <div className="relative mx-auto w-full max-w-[220px]" style={{ aspectRatio: '4 / 7' }}>
      <svg viewBox="0 0 160 260" className="h-full w-full">
        <defs>
          <mask id={`${label}-mask`}>
            <rect width="160" height="260" fill="black" />
            <image href={src} x="0" y="0" width="160" height="260" preserveAspectRatio="xMidYMid meet" />
          </mask>
        </defs>
        <image
          href={src}
          x="0"
          y="0"
          width="160"
          height="260"
          preserveAspectRatio="xMidYMid meet"
          onError={onError}
        />
        <g mask={`url(#${label}-mask)`}>{overlay}</g>
      </svg>
    </div>
  )
}

function MuscleSilhouetteFallback({ intensity }: { intensity: Map<string, number> }) {
  return (
    <svg viewBox="0 0 160 260" className="w-full max-w-[220px] h-auto mx-auto">
      <rect x="55" y="15" width="50" height="25" rx="10" fill="#e5e7eb" />
      <rect x="45" y="40" width="70" height="70" rx="18" fill="#f3f4f6" />
      <rect x="35" y="110" width="90" height="50" rx="20" fill="#f3f4f6" />
      <rect x="25" y="160" width="50" height="80" rx="16" fill="#f3f4f6" />
      <rect x="85" y="160" width="50" height="80" rx="16" fill="#f3f4f6" />
      <rect x="12" y="70" width="23" height="60" rx="10" fill="#f3f4f6" />
      <rect x="125" y="70" width="23" height="60" rx="10" fill="#f3f4f6" />

      <rect x="52" y="48" width="56" height="25" rx="12" fill={intensityColor(intensity.get('chest') || 0)} />
      <rect x="40" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="95" y="40" width="25" height="18" rx="8" fill={intensityColor(intensity.get('shoulders') || 0)} />
      <rect x="12" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('biceps') || 0)} />
      <rect x="125" y="90" width="23" height="25" rx="8" fill={intensityColor(intensity.get('biceps') || 0)} />
      <rect x="12" y="115" width="23" height="15" rx="6" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="125" y="115" width="23" height="15" rx="6" fill={intensityColor(intensity.get('triceps') || 0)} />
      <rect x="50" y="78" width="60" height="26" rx="12" fill={intensityColor(intensity.get('core') || 0)} />
      <rect x="48" y="110" width="64" height="28" rx="12" fill={intensityColor(intensity.get('glutes') || 0)} />
      <rect x="28" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('quads') || 0)} />
      <rect x="88" y="165" width="44" height="36" rx="12" fill={intensityColor(intensity.get('quads') || 0)} />
      <rect x="28" y="200" width="44" height="26" rx="10" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="88" y="200" width="44" height="26" rx="10" fill={intensityColor(intensity.get('hamstrings') || 0)} />
      <rect x="28" y="230" width="44" height="20" rx="8" fill={intensityColor(intensity.get('calves') || 0)} />
      <rect x="88" y="230" width="44" height="20" rx="8" fill={intensityColor(intensity.get('calves') || 0)} />
    </svg>
  )
}

export default function MuscleMap({
  name,
  muscles,
}: {
  name: string
  muscles?: ExerciseMuscle[]
}) {
  const targets = muscles && muscles.length > 0 ? muscles : inferMuscles(name)
  const intensityMap = new Map(targets.map((item) => [item.id, item.intensity]))
  const primary = targets.filter((item) => item.intensity >= 3)
  const secondary = targets.filter((item) => item.intensity === 2)
  const tertiary = targets.filter((item) => item.intensity === 1)

  return (
    <div className="rounded-lg border border-gray-200 p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Muscles sollicités</h4>
        <span className="text-xs text-gray-500">Primaire / Secondaire</span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Muscles primaires</div>
          {primary.length === 0 && <p className="text-xs text-gray-500">Aucun</p>}
          {primary.map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{regionLabels[item.id]}</span>
                <span className="font-semibold text-red-600">{intensityPercent(item.intensity)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500"
                  style={{ width: `${intensityPercent(item.intensity)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-gray-100 p-3">
          <div className="text-xs font-semibold text-gray-500 mb-2">Muscles secondaires</div>
          {secondary.length === 0 && tertiary.length === 0 && (
            <p className="text-xs text-gray-500">Aucun</p>
          )}
          {[...secondary, ...tertiary].map((item) => (
            <div key={item.id} className="mb-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{regionLabels[item.id]}</span>
                <span className="font-semibold text-red-500">{intensityPercent(item.intensity)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-300"
                  style={{ width: `${intensityPercent(item.intensity)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {targets.length === 0 && (
        <p className="text-xs text-gray-500 mt-3">Muscles principaux a preciser.</p>
      )}
    </div>
  )
}
