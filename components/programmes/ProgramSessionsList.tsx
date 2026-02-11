'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import EquipmentBadge from '@/components/exercises/EquipmentBadge'
import { Program } from '@/data/programs'

export default function ProgramSessionsList({ program }: { program: Program }) {
  const { nextSessionId, completedIds } = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('fitpulse_history') || '[]') as {
        programId?: string
        workoutId?: string
      }[]
      const completed = new Set(
        history.filter((item) => item.programId === program.id).map((item) => item.workoutId)
      )
      const next = program.sessions.find((session) => !completed.has(session.id)) || program.sessions[0]
      return { nextSessionId: next?.id, completedIds: completed }
    } catch {
      return { nextSessionId: program.sessions[0]?.id, completedIds: new Set<string>() }
    }
  }, [program])

  const nextSession = program.sessions.find((session) => session.id === nextSessionId) || program.sessions[0]
  const completedCount = completedIds.size
  const totalCount = program.sessions.length
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div>
      <div className="mb-6 card-soft border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-white reveal">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">Prochaine séance</div>
              <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mt-2">{nextSession.name}</h3>
              <div className="text-sm text-gray-600 mt-1">{nextSession.focus}</div>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              {nextSession.duration} min
              <EquipmentBadge equipment={program.equipment} />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Progression</span>
                <span>{completedCount}/{totalCount} séances</span>
              </div>
              <div className="h-2 mt-1 bg-white/70 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/programmes/${program.slug}/seances/${nextSession.id}`}
              className="btn-secondary hover:shadow-sm"
            >
              Voir la séance
            </Link>
            <StartProgramButton
              program={program}
              label="Démarrer la prochaine séance"
              className="btn-primary shadow-lg hover:shadow-xl"
            />
          </div>
        </div>
      </div>

      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 reveal reveal-1">Séances du programme</h2>
      <div className="space-y-4">
        {program.sessions.map((session) => {
          const isNext = session.id === nextSessionId
          const isDone = completedIds.has(session.id)
          return (
            <div
              key={session.id}
              className={`border rounded-lg p-4 transition hover:shadow-md ${
                isNext ? 'border-primary-500 bg-primary-50/40' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">{session.name}</h3>
                    {isNext && (
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-primary-600 text-white">
                        Prochaine
                      </span>
                    )}
                    {isDone && (
                      <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Terminée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{session.focus}</p>
                  <div className="text-sm text-gray-600 mt-2">
                    Durée : {session.duration} min · {session.exercises.length} exercices
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href={`/programmes/${program.slug}/seances/${session.id}`} className="btn-secondary">
                    Voir le détail
                  </Link>
                  <StartProgramButton
                    program={program}
                    sessionId={session.id}
                    label="Démarrer cette séance"
                    className="btn-primary"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
