'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Timer, Target, Filter, ArrowRight } from 'lucide-react'
import { programs as allPrograms } from '@/data/programs'
import { labelize } from '@/lib/labels'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { readLocalSettings } from '@/lib/user-state-store'
import { readLocalHistory } from '@/lib/history-store'
import { recommendProgram } from '@/lib/recommendation'

export default function ProgramsList() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all')
  const [recommendedProgramId, setRecommendedProgramId] = useState<string | null>(null)
  const [showQuickStart, setShowQuickStart] = useState(false)

  const levels = ['all', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']
  const equipments = ['all', 'Poids du corps', 'Élastiques', 'Machines', 'Haltères', 'Aucun matériel']
  const bodyParts = ['all', 'Tout le corps', 'Haut du corps', 'Jambes', 'Bras', 'Cardio', 'Fessiers', 'Abdos', 'Abdominaux', 'Mobilité']

  const filteredPrograms = allPrograms.filter(program => {
    const levelMatch = selectedLevel === 'all' || program.level === selectedLevel
    const equipmentMatch = selectedEquipment === 'all' || program.equipment === selectedEquipment
    const bodyPartMatch = selectedBodyPart === 'all' || program.bodyParts.includes(selectedBodyPart)
    return levelMatch && equipmentMatch && bodyPartMatch
  })

  useEffect(() => {
    try {
      const settings = readLocalSettings() as {
        level?: string
        goals?: string[]
        equipment?: string[]
        sessionsPerWeek?: number
      }
      const recommendation = recommendProgram(allPrograms, {
        level: settings.level,
        goals: settings.goals,
        equipment: settings.equipment,
        sessionsPerWeek: settings.sessionsPerWeek,
      })
      setRecommendedProgramId(recommendation?.program.id || null)

      const history = readLocalHistory() as unknown[]
      setShowQuickStart(!Array.isArray(history) || history.length === 0)
    } catch {
      setRecommendedProgramId(null)
      setShowQuickStart(false)
    }
  }, [])

  const recommendedProgram = useMemo(
    () => allPrograms.find((program) => program.id === recommendedProgramId) || null,
    [recommendedProgramId]
  )

  return (
    <div>
      {showQuickStart && recommendedProgram && (
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

      {/* Filtres */}
      <div className="card-soft mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-gray-900">Filtres</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          return (
          <div
            key={program.id}
            className="card-soft group hover:shadow-md transition-transform duration-300 reveal border border-transparent hover:border-primary-200"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -m-6 mb-4`}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-primary-600" />
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                  {labelize(program.level)}
                </span>
              </div>
            </div>

            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
              <Link href={programHref} className="hover:text-primary-700">
                {program.name}
              </Link>
            </h3>
            <p className="text-gray-600 mb-4">{program.description}</p>

            <div className="space-y-2 mb-6">
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
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {program.goals.map((goal) => (
                <span key={goal} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                  {goal}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-3">
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
    </div>
  )
}
