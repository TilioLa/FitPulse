import { CheckCircle, Clock, Users, Award, Zap, Heart } from 'lucide-react'

const benefits = [
  {
    icon: <Zap className="h-10 w-10 text-primary-600" />,
    title: "Programmes personnalisés",
    description: "Des séances adaptées à votre niveau, vos objectifs et le matériel dont vous disposez."
  },
  {
    icon: <Clock className="h-10 w-10 text-primary-600" />,
    title: "Flexibilité totale",
    description: "Entraînez-vous quand vous voulez, où vous voulez. Pas de contrainte d'horaires."
  },
  {
    icon: <Users className="h-10 w-10 text-primary-600" />,
    title: "Suivi intelligent",
    description: "Votre progression est lisible, vos séances restent cohérentes."
  },
  {
    icon: <Award className="h-10 w-10 text-primary-600" />,
    title: "Résultats garantis",
    description: "Méthodes éprouvées utilisées par des milliers d'utilisateurs satisfaits."
  },
  {
    icon: <CheckCircle className="h-10 w-10 text-primary-600" />,
    title: "Exercices détaillés",
    description: "Vidéos, GIFs et instructions précises pour chaque exercice de votre programme."
  },
  {
    icon: <Heart className="h-10 w-10 text-primary-600" />,
    title: "Motivation continue",
    description: "Badges, streaks et statistiques pour rester motivé jour après jour."
  }
]

export default function Benefits() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 reveal">
            Pourquoi choisir FitPulse ?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto reveal reveal-1">
            Tout ce dont vous avez besoin pour transformer votre corps et atteindre vos objectifs sportifs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="card hover:border-primary-300 border-2 border-transparent reveal"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {benefit.title}
              </h3>
              <p className="text-gray-600">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
