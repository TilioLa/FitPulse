import Link from 'next/link'
import { ArrowRight, Dumbbell, Target, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Votre coach sportif personnel
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            Des programmes personnalisés adaptés à votre niveau. 
            Poids du corps, élastiques ou machines de musculation. 
            Transformez votre corps selon vos objectifs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="/inscription" className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4 flex items-center space-x-2">
              <span>Commencez gratuitement</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/programmes" className="btn-secondary border-white text-lg px-8 py-4">
              Découvrir les programmes
            </Link>
          </div>
          
          {/* Features icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <Dumbbell className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Programmes adaptés</h3>
              <p className="text-primary-100 text-sm">À domicile ou en salle</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Objectifs personnalisés</h3>
              <p className="text-primary-100 text-sm">Musculation, perte de poids, cardio</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Suivi en temps réel</h3>
              <p className="text-primary-100 text-sm">Suivez vos progrès au jour le jour</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
