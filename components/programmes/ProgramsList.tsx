'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Timer, Target, Filter, ArrowRight, Star, Scale, Sparkles, CheckCircle2 } from 'lucide-react'
import { programs as allPrograms } from '@/data/programs'
import { routineTemplates } from '@/data/routine-templates'
import { labelize } from '@/lib/labels'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { readLocalSettings } from '@/lib/user-state-store'
import { readLocalHistory } from '@/lib/history-store'
import { rankPrograms, recommendProgram } from '@/lib/recommendation'
import { useSearchParams } from 'next/navigation'
import { readLocalProgramFavorites, writeLocalProgramFavorites } from '@/lib/favorites-store'
import type { SharedSessionPayload } from '@/lib/session-share'

type CommunityProgramHighlight = {
  slug: string
  name: string
  count: number
}

export default function ProgramsList() {
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [recommendationCards, setRecommendationCards] = useState<
    Array<{ id: string; title: string; subtitle: string; href: string; reasons: string[] }>
  >([])
  const [routinePicks, setRoutinePicks] = useState<typeof routineTemplates>([])
  const uniquePrograms = useMemo(() => {
    const bySlug = new Map<string, (typeof allPrograms)[number]>()
    allPrograms.forEach((program) => {
      if (!bySlug.has(program.slug)) {
        bySlug.set(program.slug, program)
      }
    })
    return Array.from(bySlug.values())
  }, [])

  const levels = ['all', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']
  const equipments = ['all', 'Poids du corps', 'Machines', 'Haltères', 'Barres', 'Aucun matériel']
  const bodyParts = ['all', 'Tout le corps', 'Haut du corps', 'Jambes', 'Bras', 'Cardio', 'Fessiers', 'Abdos', 'Mobilité']

  useEffect(() => {
    setMounted(true)
    const term = searchParams.get('q') || ''
    setQuery(term)
  }, [searchParams])

  useEffect(() => {
    const apply = () => setFavorites(readLocalProgramFavorites())
    apply()
    window.addEventListener('fitpulse-program-favorites', apply)
    window.addEventListener('storage', apply)
    return () => {
      window.removeEventListener('fitpulse-program-favorites', apply)
      window.removeEventListener('storage', apply)
    }
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const settings = readLocalSettings() as {
      level?: string
      goals?: string[]
      equipment?: string[]
      sessionsPerWeek?: number
    }
    const history = readLocalHistory() as { programId?: string }[]
    const historyProgramIds = history.map((item) => item.programId).filter(Boolean) as string[]
    const ranked = rankPrograms(uniquePrograms, {
      level: settings.level,
      goals: settings.goals,
      equipment: settings.equipment,
      sessionsPerWeek: settings.sessionsPerWeek,
      historyProgramIds,
      recentProgramId: historyProgramIds[0] || null,
    })
    setRecommendationCards(
      ranked.slice(0, 3).map((item) => ({
        id: item.program.id,
        title: item.program.name,
        subtitle: item.program.description,
        href: `/programmes/${item.program.slug}`,
        reasons: item.reasons,
      }))
    )

    const equipment = (settings.equipment || [])[0]
    const routines = routineTemplates.filter((tpl) =>
      equipment ? tpl.equipment.toLowerCase().includes(String(equipment).toLowerCase()) : true
    )
    setRoutinePicks(routines.slice(0, 2))
  }, [mounted, uniquePrograms])

  const filteredPrograms = uniquePrograms.filter(program => {
    const levelMatch = selectedLevel === 'all' || program.level === selectedLevel
    const equipmentMatch = selectedEquipment === 'all' || program.equipment === selectedEquipment
    const bodyPartMatch = selectedBodyPart === 'all' || program.bodyParts.includes(selectedBodyPart)
    const term = query.trim().toLowerCase()
    const queryMatch =
      !term ||
      program.name.toLowerCase().includes(term) ||
      program.description.toLowerCase().includes(term) ||
      program.goals.some((goal) => goal.toLowerCase().includes(term))
    const favMatch = !onlyFavorites || favorites.includes(program.id)
    return levelMatch && equipmentMatch && bodyPartMatch && queryMatch && favMatch
  })
  const hasActiveFilters =
    selectedLevel !== 'all' ||
    selectedEquipment !== 'all' ||
    selectedBodyPart !== 'all' ||
    query.trim().length > 0 ||
    onlyFavorites

  const { recommendedProgram, showQuickStart } = useMemo(() => {
    if (!mounted || typeof window === 'undefined') {
      return { recommendedProgram: null as (typeof allPrograms)[number] | null, showQuickStart: false }
    }
    try {
      const settings = readLocalSettings() as {
        level?: string
        goals?: string[]
        equipment?: string[]
        sessionsPerWeek?: number
      }
      const history = readLocalHistory() as { programId?: string }[]
      const historyProgramIds = history.map((item) => item.programId).filter(Boolean) as string[]
      const recommendation = recommendProgram(uniquePrograms, {
        level: settings.level,
        goals: settings.goals,
        equipment: settings.equipment,
        sessionsPerWeek: settings.sessionsPerWeek,
        historyProgramIds,
        recentProgramId: historyProgramIds[0] || null,
      })
      return {
        recommendedProgram: recommendation?.program || null,
        showQuickStart: !Array.isArray(history) || history.length === 0,
      }
    } catch {
      return { recommendedProgram: null as (typeof allPrograms)[number] | null, showQuickStart: false }
    }
  }, [mounted, uniquePrograms])
  const [communityHighlights, setCommunityHighlights] = useState<CommunityProgramHighlight[]>([])

  const userProfile = useMemo(() => {
    const settings = readLocalSettings() as {
      level?: string
      goals?: string[]
      goal?: string
      equipment?: string[]
      sessionsPerWeek?: number
    }
    const goals = Array.isArray(settings.goals) && settings.goals.length > 0
      ? settings.goals
      : settings.goal
      ? [settings.goal]
      : []
    return {
      level: settings.level,
      goals,
      equipment: Array.isArray(settings.equipment) ? settings.equipment : [],
      sessionsPerWeek: Number(settings.sessionsPerWeek || 0),
    }
  }, [])

  const comparePrograms = compareIds
    .map((id) => uniquePrograms.find((program) => program.id === id))
    .filter(Boolean) as (typeof uniquePrograms)[number][]

  const getWhyItFits = (program: (typeof uniquePrograms)[number]) => {
    const reasons: string[] = []
    if (userProfile.level && program.level.toLowerCase().includes(String(userProfile.level).toLowerCase())) {
      reasons.push('niveau cohérent')
    }
    if (userProfile.goals.some((goal) => program.goals.some((item) => item.toLowerCase().includes(goal.toLowerCase())))) {
      reasons.push('objectif aligné')
    }
    if (userProfile.equipment.some((equipment) => program.equipment.toLowerCase().includes(equipment.toLowerCase()))) {
      reasons.push('matériel compatible')
    }
    const weeklyMinutes = program.sessions.reduce((sum, session) => sum + session.duration, 0)
    if (userProfile.sessionsPerWeek > 0 && Math.abs(program.sessionsPerWeek - userProfile.sessionsPerWeek) <= 1) {
      reasons.push('rythme réaliste')
    }
    if (weeklyMinutes <= 160) {
      reasons.push('volume gérable')
    }
    return reasons.slice(0, 3)
  }

  const toggleCompare = (programId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(programId)) return prev.filter((id) => id !== programId)
      return [...prev.slice(-1), programId]
    })
  }

  useEffect(() => {
    let active = true
    const loadShareHighlights = async () => {
      try {
        const response = await fetch('/api/share/recent')
        if (!response.ok) throw new Error('fetch_failed')
        const data = (await response.json().catch(() => ({}))) as { shares?: { payload?: SharedSessionPayload }[] }
        if (!active) return
        const shares = Array.isArray(data?.shares) ? data.shares : []
        const map = new Map<string, { name: string; count: number }>()
        shares.forEach((share) => {
          const slug = share?.payload?.programSlug || 'share'
          const name = share?.payload?.programName || share?.payload?.workoutName || 'Séance partagée'
          const entry = map.get(slug) || { name, count: 0 }
          entry.count += 1
          map.set(slug, entry)
        })
        const highlights = Array.from(map.entries())
          .filter(([slug]) => slug !== 'share')
          .map(([slug, info]) => ({ slug, name: info.name, count: info.count }))
        setCommunityHighlights(highlights.slice(0, 3))
      } catch {
        if (!active) return
        setCommunityHighlights([])
      }
    }
    void loadShareHighlights()
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      {!hasActiveFilters && showQuickStart && recommendedProgram && (
        <div className="card-soft mb-8 border border-primary-200 bg-primary-50/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-primary-700">
            Démarrage rapide
          </div>
          <div className="mt-1 text-xl font-semibold text-gray-900">{recommendedProgram.name}</div>
          <div className="mt-1 text-sm text-gray-700">
            Programme recommandé selon ton profil actuel.
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <StartProgramButton
              program={recommendedProgram}
              label="Commencer ma 1ère séance"
              className="btn-primary w-full sm:w-auto"
            />
            <Link href={`/programmes/${recommendedProgram.slug}`} className="btn-secondary w-full sm:w-auto text-center">
              Voir le détail
            </Link>
          </div>
        </div>
      )}
      {comparePrograms.length > 0 && (
        <div className="card-soft mb-8 border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comparateur</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">
                {comparePrograms.length === 1 ? 'Choisis un second programme à comparer' : 'Comparaison rapide'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Réinitialiser
            </button>
          </div>
          <div className={`mt-4 grid gap-4 ${comparePrograms.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
            {comparePrograms.map((program) => (
              <div key={program.slug} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{program.name}</div>
                    <div className="text-sm text-gray-500">{program.level} · {program.equipment}</div>
                  </div>
                  <Link href={`/programmes/${program.slug}`} className="text-sm font-semibold text-primary-700">
                    Ouvrir
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Temps hebdo</div>
                    <div className="font-semibold text-gray-900">
                      {program.sessions.reduce((sum, session) => sum + session.duration, 0)} min
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">Séances / semaine</div>
                    <div className="font-semibold text-gray-900">{program.sessionsPerWeek}</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {getWhyItFits(program).map((reason) => (
                    <div key={reason} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!hasActiveFilters && communityHighlights.length > 0 && (
        <div className="card-soft mb-8 border border-primary-100 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Communauté</p>
              <h3 className="text-lg font-semibold text-gray-900">Programmes partagés</h3>
            </div>
            <Link href="/share" className="text-sm font-semibold text-primary-600">
              Voir le mur
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {communityHighlights.map((highlight) => (
              <div key={highlight.slug} className="rounded-xl border border-gray-100 bg-primary-50/40 p-4 flex flex-col">
                <div className="text-sm font-semibold text-gray-900">{highlight.name}</div>
                <div className="text-xs text-gray-500">Partages récents</div>
                <div className="mt-3 text-2xl font-bold text-primary-600">{highlight.count}</div>
                <Link
                  href={`/programmes/${highlight.slug}`}
                  className="mt-3 text-xs font-semibold text-primary-700"
                >
                  Voir le programme
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasActiveFilters && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card-soft">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Recommandations programmes</div>
          {recommendationCards.length === 0 ? (
            <div className="text-sm text-gray-500">Aucune recommandation pour le moment.</div>
          ) : (
            <div className="space-y-3">
              {recommendationCards.map((card) => (
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

        <div className="card-soft">
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
      )}

      {/* Filtres */}
      <div className="card-soft mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Nom, objectif ou niveau"
              />
              <p className="text-xs text-gray-500 mt-2">
                Astuce : les filtres te permettent de garder ton objectif en vue et l&apos;étoile marque un programme à relancer facilement.
              </p>
            </div>
          <div className="md:col-span-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOnlyFavorites((prev) => !prev)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                onlyFavorites ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-600'
              }`}
            >
              Favoris uniquement
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {levels.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'Tous les niveaux' : labelize(level)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Matériel</label>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {equipments.map(equipment => (
                <option key={equipment} value={equipment}>
                  {equipment === 'all' ? 'Tous les équipements' : labelize(equipment)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone du corps</label>
            <select
              value={selectedBodyPart}
              onChange={(e) => setSelectedBodyPart(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {bodyParts.map(bodyPart => (
                <option key={bodyPart} value={bodyPart}>
                  {bodyPart === 'all' ? 'Toutes les zones' : labelize(bodyPart)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des programmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPrograms.map((program, index) => {
          const programHref = `/programmes/${program.slug}`
          const isFav = favorites.includes(program.id)
          return (
          <div
            key={program.slug}
            className="card-soft group hover:shadow-md transition-transform duration-300 reveal border border-transparent hover:border-primary-200"
            style={{ animationDelay: `${index * 60}ms` }}
          >
          <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 mb-4`}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-primary-600" />
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                  {labelize(program.level)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = isFav
                    ? favorites.filter((id) => id !== program.id)
                    : [...favorites, program.id]
                  writeLocalProgramFavorites(next)
                  setFavorites(next)
                }}
                className={`rounded-full p-2 ${isFav ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                aria-pressed={isFav}
                aria-label="Favori"
                title="Installe ce programme parmi tes favoris"
              >
                <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400' : ''}`} />
              </button>
            </div>

            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
              <Link href={programHref} className="hover:text-primary-700">
                {program.name}
              </Link>
            </h3>
            <p className="text-gray-600 mb-4">{program.description}</p>

            <div className="space-y-2 mb-6">
              {recommendedProgram?.id === program.id && (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Recommandé pour toi
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <Timer className="h-4 w-4 mr-2" />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="h-4 w-4 mr-2" />
                <span>{labelize(program.equipment)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Dumbbell className="h-4 w-4 mr-2" />
                <span>{program.exercises} exercices</span>
              </div>
              <div className="text-sm text-gray-600">
                {program.sessionsPerWeek} séances / semaine
              </div>
              <div className="text-sm text-gray-600">
                {program.sessions.reduce((sum, session) => sum + session.duration, 0)} min / semaine
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {program.goals.map((goal) => (
                <span key={goal} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                  {goal}
                </span>
              ))}
            </div>

            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Target className="h-3.5 w-3.5 text-primary-600" />
                Pourquoi ce programme peut te convenir
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {getWhyItFits(program).map((reason) => (
                  <span key={reason} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                    {reason}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => toggleCompare(program.id)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${
                  compareIds.includes(program.id)
                    ? 'border-primary-300 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-700 hover:border-primary-200'
                }`}
              >
                <Scale className="h-4 w-4" />
                {compareIds.includes(program.id) ? 'Retirer du comparatif' : 'Comparer'}
              </button>
              <Link
                href={programHref}
                className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 group-hover:translate-x-1 transition-transform"
              >
                Voir le détail
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <StartProgramButton
                program={program}
                label="Démarrer la prochaine séance"
                className="btn-primary w-full flex items-center justify-center space-x-2 shadow-md"
              />
            </div>
          </div>
        )})}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 card-soft">
          <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucun programme ne correspond à vos filtres</p>
        </div>
      )}
      <div className="md:hidden">
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white/95 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur">
          {recommendedProgram && (
            <StartProgramButton
              program={recommendedProgram}
              label="Démarrer la séance recommandée"
              className="btn-primary w-full justify-center"
            />
          )}
          <Link href="/dashboard" className="btn-secondary w-full text-center">
            Accéder au dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
