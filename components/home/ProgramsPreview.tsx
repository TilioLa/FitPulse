import Link from 'next/link'
import { Dumbbell, Timer, Target, ArrowRight } from 'lucide-react'

const programs = [
  {
    name: "Débutant - Poids du corps",
    duration: "6 semaines",
    level: "Débutant",
    equipment: "Aucun matériel",
    description: "Programme complet pour commencer la musculation sans équipement",
    color: "from-blue-500 to-blue-600"
  },
  {
    name: "Intermédiaire - Élastiques",
    duration: "8 semaines",
    level: "Intermédiaire",
    equipment: "Élastiques de résistance",
    description: "Gagnez en force et en masse musculaire avec des élastiques",
    color: "from-purple-500 to-purple-600"
  },
  {
    name: "Avancé - Machines",
    duration: "12 semaines",
    level: "Avancé",
    equipment: "Salle de sport",
    description: "Programme intensif pour maximiser vos gains en salle",
    color: "from-orange-500 to-orange-600"
  }
]

export default function ProgramsPreview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Nos programmes populaires
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choisissez le programme qui correspond à votre niveau et à vos objectifs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {programs.map((program, index) => (
            <div key={index} className="card group hover:scale-105 transition-transform duration-300">
              <div className={`h-2 bg-gradient-to-r ${program.color} rounded-t-xl -m-6 mb-4`}></div>
              <div className="flex items-center justify-between mb-4">
                <Dumbbell className="h-8 w-8 text-primary-600" />
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                  {program.level}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {program.name}
              </h3>
              <p className="text-gray-600 mb-4">
                {program.description}
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <Timer className="h-4 w-4 mr-2" />
                  <span>Durée : {program.duration}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Target className="h-4 w-4 mr-2" />
                  <span>{program.equipment}</span>
                </div>
              </div>
              <Link
                href="/programmes"
                className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 group-hover:translate-x-1 transition-transform"
              >
                En savoir plus
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/programmes" className="btn-primary text-lg px-8 py-4 inline-flex items-center space-x-2">
            <span>Voir tous les programmes</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
