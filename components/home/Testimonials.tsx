import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: "Sophie M.",
    role: "Entraînée depuis 6 mois",
    content: "J'ai perdu 8 kilos et gagné énormément en force. Les programmes sont vraiment adaptés à mon niveau et je n'ai jamais été aussi régulière !",
    rating: 5,
    image: "👩‍💼"
  },
  {
    name: "Thomas L.",
    role: "Bodybuilder amateur",
    content: "Les exercices avec élastiques sont incroyables. J'ai progressé autant qu'en salle de sport, tout ça depuis chez moi. FitPulse a changé ma vie.",
    rating: 5,
    image: "💪"
  },
  {
    name: "Marie D.",
    role: "Débutante complète",
    content: "Je ne savais pas par où commencer. Les programmes sont clairs, les vidéos super utiles. En 3 mois, je me sens déjà beaucoup plus forte et motivée !",
    rating: 5,
    image: "🏃‍♀️"
  },
  {
    name: "Julien R.",
    role: "Sportif régulier",
    content: "Le dashboard est parfait pour suivre mes progrès. Les streaks me motivent à ne jamais rater une séance. L'application est vraiment bien pensée.",
    rating: 5,
    image: "🏋️‍♂️"
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ce que disent nos utilisateurs
          </h2>
          <p className="text-xl text-gray-600">
            Plus de 10 000 sportifs nous font confiance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card bg-white relative">
              <Quote className="h-8 w-8 text-primary-200 absolute top-4 right-4" />
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{testimonial.image}</div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed">
                "{testimonial.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
