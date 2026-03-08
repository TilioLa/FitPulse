'use client'

import { useMemo, useState } from 'react'
import { workoutTemplates } from '@/lib/workout-templates'

const STORAGE_KEY = 'fitpulse_weekly_planner_v1'

type PlannerItem = { id: string; name: string }
type PlannerState = Record<string, PlannerItem[]>

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

function readPlanner(): PlannerState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as PlannerState
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

export default function WeeklyPlanner() {
  const [planner, setPlanner] = useState<PlannerState>(() => readPlanner())
  const templates = useMemo(() => workoutTemplates.map((tpl) => ({ id: tpl.id, name: tpl.name })), [])
  const [dragItem, setDragItem] = useState<PlannerItem | null>(null)

  const persist = (next: PlannerState) => {
    setPlanner(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return (
    <section className="card-soft mb-8">
      <h2 className="text-lg font-semibold text-gray-900">Planificateur hebdo</h2>
      <p className="text-xs text-gray-500 mt-1">Glisse un template sur un jour pour planifier ta semaine.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            draggable
            onDragStart={() => setDragItem(template)}
            className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700"
          >
            {template.name}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DAYS.map((day) => (
          <div
            key={day}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!dragItem) return
              const current = planner[day] || []
              const next = {
                ...planner,
                [day]: [...current, dragItem],
              }
              persist(next)
              setDragItem(null)
            }}
            className="min-h-24 rounded-lg border border-gray-200 bg-white p-3"
          >
            <div className="text-sm font-semibold text-gray-900">{day}</div>
            <div className="mt-2 space-y-1">
              {(planner[day] || []).map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-center justify-between rounded-md bg-gray-50 px-2 py-1 text-xs">
                  <span>{item.name}</span>
                  <button
                    type="button"
                    className="text-red-600"
                    onClick={() => {
                      const nextList = (planner[day] || []).filter((_, idx) => idx !== index)
                      persist({ ...planner, [day]: nextList })
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
