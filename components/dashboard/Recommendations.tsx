'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Star, Sparkles, ArrowRight } from 'lucide-react'
import { programs } from '@/data/programs'
import { routineTemplates } from '@/data/routine-templates'
import { rankPrograms } from '@/lib/recommendation'
import { readLocalHistory } from '@/lib/history-store'
import { readLocalSettings } from '@/lib/user-state-store'

type RecommendationCard = {
  id: string
  title: string
  subtitle: string
  href: string
  reasons: string[]
}

export default function Recommendations() {
  const [cards, setCards] = useState<RecommendationCard[]>([])
  const [routinePicks, setRoutinePicks] = useState<typeof routineTemplates>([])

  useEffect(() => {
    const settings = readLocalSettings() as {
      level?: string
      goals?: string[]
      equipment?: string[]
      sessionsPerWeek?: number
    }
    const history = readLocalHistory() as { programId?: string }[]
    const historyProgramIds = history.map((item) => item.programId).filter(Boolean) as string[]
    const ranked = rankPrograms(programs, {
      level: settings.level,
      goals: settings.goals,
      equipment: settings.equipment,
      sessionsPerWeek: settings.sessionsPerWeek,
      historyProgramIds,
      recentProgramId: historyProgramIds[0] || null,
    })
    const nextCards = ranked.slice(0, 3).map((item) => ({
      id: item.program.id,
      title: item.program.name,
      subtitle: item.program.description,
      href: `/programmes/${item.program.slug}`,
      reasons: item.reasons,
    }))
    setCards(nextCards)

    const equipment = (settings.equipment || [])[0]
    const routines = routineTemplates.filter((tpl) =>
      equipment ? tpl.equipment.toLowerCase().includes(String(equipment).toLowerCase()) : true
    )
    setRoutinePicks(routines.slice(0, 2))
  }, [])

  const hasRecommendations = cards.length > 0

  return (
    <div className="page-wrap">
      <div className="mb-8">
        <h1 className="section-title mb-2">Recommandations</h1>
        <p className="section-subtitle">Programmes et routines adaptés à ton profil.</p>
      </div>

      <div className="card-compact mb-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="flex items-center gap-2 text-primary-700 text-xs font-semibold uppercase tracking-wide">
          <Sparkles className="h-4 w-4" />
          Suggestion du moment
        </div>
        <div className="mt-2 text-lg font-semibold text-gray-900">
          {hasRecommendations ? cards[0].title : 'Complète ton profil pour une recommandation précise.'}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {hasRecommendations ? cards[0].subtitle : 'Ajoute ton niveau, tes objectifs et ton matériel.'}
        </div>
        {hasRecommendations && (
          <Link href={cards[0].href} className="mt-4 inline-flex btn-primary">
            Voir le programme
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-compact">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Programmes</div>
          {cards.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune recommandation pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="rounded-lg border border-gray-200 px-3 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{card.title}</div>
                    <Link href={card.href} className="text-xs font-semibold text-primary-700">
                      Voir →
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">{card.subtitle}</div>
                  {card.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {card.reasons.map((reason) => (
                        <span key={reason} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-compact">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Routines suggérées</div>
          {routinePicks.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune routine suggérée.</div>
          ) : (
            <div className="space-y-3">
              {routinePicks.map((routine) => (
                <div key={routine.name} className="rounded-lg border border-gray-200 px-3 py-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-gray-900">{routine.name}</div>
                    <span className="text-xs text-gray-500">{routine.sessionsPerWeek} / semaine</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {routine.equipment} · {routine.exercises.length} exercices
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Link href="/dashboard?view=routines" className="text-xs font-semibold text-primary-700 inline-flex items-center gap-1">
                      Créer une routine
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-compact">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          <Star className="h-4 w-4 text-amber-500" />
          Astuce
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Mets en favori tes programmes et routines préférés pour les retrouver en un clic.
        </div>
      </div>
    </div>
  )
}
