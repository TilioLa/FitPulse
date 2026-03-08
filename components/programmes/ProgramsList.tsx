<<<<<<< HEAD
//
//  Untitled.swift
//  
//
//  Created by Tilio Lave on 18/01/2026.
//

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Timer, Target, Filter, ArrowRight } from 'lucide-react'

const allPrograms = [
  {
    id: '1',
    name: 'Débutant - Poids du corps',
    duration: '6 semaines',
    level: 'Débutant',
    equipment: 'Poids du corps',
    bodyParts: ['Tout le corps'],
    description: 'Programme complet pour commencer la musculation sans équipement. Idéal pour les débutants.',
    exercises: 20,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: '2',
    name: 'Intermédiaire - Élastiques',
    duration: '8 semaines',
    level: 'Intermédiaire',
    equipment: 'Élastiques',
    bodyParts: ['Haut du corps', 'Bras'],
    description: 'Gagnez en force et en masse musculaire avec des élastiques de résistance.',
    exercises: 25,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: '3',
    name: 'Avancé - Machines',
    duration: '12 semaines',
    level: 'Avancé',
    equipment: 'Machines',
    bodyParts: ['Tout le corps'],
    description: 'Programme intensif pour maximiser vos gains en salle de sport.',
    exercises: 30,
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: '4',
    name: 'Cardio & Perte de poids',
    duration: '4 semaines',
    level: 'Tous niveaux',
    equipment: 'Poids du corps',
    bodyParts: ['Cardio', 'Tout le corps'],
    description: 'Programme cardio intense pour brûler des calories et perdre du poids.',
    exercises: 15,
    color: 'from-green-500 to-green-600',
  },
  {
    id: '5',
    name: 'Développement du haut du corps',
    duration: '6 semaines',
    level: 'Intermédiaire',
    equipment: 'Poids du corps',
    bodyParts: ['Haut du corps', 'Bras'],
    description: 'Concentrez-vous sur le développement des muscles du haut du corps.',
    exercises: 18,
    color: 'from-red-500 to-red-600',
  },
  {
    id: '6',
    name: 'Renforcement jambes et fessiers',
    duration: '8 semaines',
    level: 'Intermédiaire',
    equipment: 'Poids du corps',
    bodyParts: ['Jambes', 'Fessiers'],
    description: 'Programme spécialisé pour tonifier et renforcer les jambes et les fessiers.',
    exercises: 22,
    color: 'from-pink-500 to-pink-600',
  },
]
=======
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Dumbbell, Timer, Target, Filter, ArrowRight } from 'lucide-react'
import { programs as allPrograms } from '@/data/programs'
import { labelize } from '@/lib/labels'
import StartProgramButton from '@/components/programmes/StartProgramButton'
import { readLocalSettings } from '@/lib/user-state-store'
import { readLocalHistory } from '@/lib/history-store'
import { recommendProgram } from '@/lib/recommendation'
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b

export default function ProgramsList() {
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all')
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('all')

  const levels = ['all', 'Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']
<<<<<<< HEAD
  const equipments = ['all', 'Poids du corps', 'Élastiques', 'Machines', 'Haltères']
  const bodyParts = ['all', 'Tout le corps', 'Haut du corps', 'Jambes', 'Bras', 'Cardio', 'Fessiers']
=======
  const equipments = ['all', 'Poids du corps', 'Élastiques', 'Machines', 'Haltères', 'Aucun matériel']
  const bodyParts = ['all', 'Tout le corps', 'Haut du corps', 'Jambes', 'Bras', 'Cardio', 'Fessiers', 'Abdos', 'Abdominaux', 'Mobilité']
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b

  const filteredPrograms = allPrograms.filter(program => {
    const levelMatch = selectedLevel === 'all' || program.level === selectedLevel
    const equipmentMatch = selectedEquipment === 'all' || program.equipment === selectedEquipment
    const bodyPartMatch = selectedBodyPart === 'all' || program.bodyParts.includes(selectedBodyPart)
    return levelMatch && equipmentMatch && bodyPartMatch
  })

<<<<<<< HEAD
  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
=======
  const { recommendedProgram, showQuickStart } = useMemo(() => {
    if (typeof window === 'undefined') {
      return { recommendedProgram: null as (typeof allPrograms)[number] | null, showQuickStart: false }
    }
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
      const history = readLocalHistory() as unknown[]
      return {
        recommendedProgram: recommendation?.program || null,
        showQuickStart: !Array.isArray(history) || history.length === 0,
      }
    } catch {
      return { recommendedProgram: null as (typeof allPrograms)[number] | null, showQuickStart: false }
    }
  }, [])

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
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
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
<<<<<<< HEAD
                  {level === 'all' ? 'Tous les niveaux' : level}
=======
                  {level === 'all' ? 'Tous les niveaux' : labelize(level)}
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
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
<<<<<<< HEAD
                  {equipment === 'all' ? 'Tous les équipements' : equipment}
=======
                  {equipment === 'all' ? 'Tous les équipements' : labelize(equipment)}
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
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
<<<<<<< HEAD
                  {bodyPart === 'all' ? 'Toutes les zones' : bodyPart}
=======
                  {bodyPart === 'all' ? 'Toutes les zones' : labelize(bodyPart)}
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des programmes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<<<<<<< HEAD
        {filteredPrograms.map((program) => (
          <div key={program.id} className="card group hover:scale-105 transition-transform duration-300">
=======
        {filteredPrograms.map((program, index) => {
          const programHref = `/programmes/${program.slug}`
          return (
          <div
            key={program.id}
            className="card-soft group hover:shadow-md transition-transform duration-300 reveal border border-transparent hover:border-primary-200"
            style={{ animationDelay: `${index * 60}ms` }}
          >
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
            <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -m-6 mb-4`}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-primary-600" />
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
<<<<<<< HEAD
                  {program.level}
=======
                  {labelize(program.level)}
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
                </span>
              </div>
            </div>

<<<<<<< HEAD
            <h3 className="text-xl font-bold text-gray-900 mb-2">{program.name}</h3>
=======
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
              <Link href={programHref} className="hover:text-primary-700">
                {program.name}
              </Link>
            </h3>
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
            <p className="text-gray-600 mb-4">{program.description}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Timer className="h-4 w-4 mr-2" />
                <span>{program.duration}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="h-4 w-4 mr-2" />
<<<<<<< HEAD
                <span>{program.equipment}</span>
=======
                <span>{labelize(program.equipment)}</span>
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Dumbbell className="h-4 w-4 mr-2" />
                <span>{program.exercises} exercices</span>
              </div>
<<<<<<< HEAD
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 group-hover:translate-x-1 transition-transform"
            >
              Commencer ce programme
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
=======
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
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
          <Filter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Aucun programme ne correspond à vos filtres</p>
        </div>
      )}
    </div>
  )
}
