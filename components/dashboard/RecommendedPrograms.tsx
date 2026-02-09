'use client'

import { ArrowRight, Dumbbell, Timer, Target } from 'lucide-react'
import { useToast } from '@/components/ui/ToastProvider'

const programs = [
  {
    id: '1',
    name: 'Débutant - Poids du corps',
    duration: '6 semaines',
    level: 'Débutant',
    equipment: 'Aucun matériel',
    description: 'Programme complet pour commencer la musculation sans équipement',
    color: 'from-blue-500 to-blue-600',
    exercises: 20,
  },
  {
    id: '2',
    name: 'Intermédiaire - Élastiques',
    duration: '8 semaines',
    level: 'Intermédiaire',
    equipment: 'Élastiques de résistance',
    description: 'Gagnez en force et en masse musculaire avec des élastiques',
    color: 'from-purple-500 to-purple-600',
    exercises: 25,
  },
  {
    id: '3',
    name: 'Avancé - Machines',
    duration: '12 semaines',
    level: 'Avancé',
    equipment: 'Salle de sport',
    description: 'Programme intensif pour maximiser vos gains en salle',
    color: 'from-orange-500 to-orange-600',
    exercises: 30,
  },
  {
    id: '4',
    name: 'Cardio & Perte de poids',
    duration: '4 semaines',
    level: 'Tous niveaux',
    equipment: 'Aucun matériel',
    description: 'Programme cardio intense pour brûler des calories',
    color: 'from-green-500 to-green-600',
    exercises: 15,
  },
]

export default function RecommendedPrograms() {
  const { push } = useToast()
  const handleStartProgram = (programId: string) => {
    // Créer une séance par défaut pour le programme
    const program = programs.find(p => p.id === programId)
    if (program) {
      const workout = {
        id: Date.now().toString(),
        name: program.name,
        duration: 30,
        exercises: [
          { id: '1', name: 'Pompes', sets: 3, reps: 12, rest: 60 },
          { id: '2', name: 'Squats', sets: 3, reps: 15, rest: 60 },
          { id: '3', name: 'Planche', sets: 3, reps: 30, rest: 45 },
          { id: '4', name: 'Fentes', sets: 3, reps: 12, rest: 60 },
          { id: '5', name: 'Gainage', sets: 3, reps: 45, rest: 60 },
        ]
      }
      localStorage.setItem('fitpulse_current_workout', JSON.stringify(workout))
      push(`Programme "${program.name}" démarré ! Vous pouvez maintenant commencer votre séance.`, 'info')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Programmes recommandés</h1>

      <p className="text-gray-600 mb-8 text-lg">
        Choisissez un programme adapté à votre niveau et à vos objectifs. Vous pouvez commencer à tout moment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {programs.map((program) => (
          <div key={program.id} className="card group hover:scale-105 transition-transform duration-300">
            <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -m-6 mb-4`}></div>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-6 w-6 text-primary-600" />
                <h3 className="text-2xl font-bold text-gray-900">{program.name}</h3>
              </div>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                {program.level}
              </span>
            </div>

            <p className="text-gray-600 mb-4">{program.description}</p>

            <div className="space-y-2 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Timer className="h-4 w-4 mr-2" />
                <span>Durée : {program.duration}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Target className="h-4 w-4 mr-2" />
                <span>{program.equipment}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Dumbbell className="h-4 w-4 mr-2" />
                <span>{program.exercises} exercices</span>
              </div>
            </div>

            <button
              onClick={() => handleStartProgram(program.id)}
              className="btn-primary w-full flex items-center justify-center space-x-2 group-hover:scale-105 transition-transform"
            >
              <span>Commencer ce programme</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
