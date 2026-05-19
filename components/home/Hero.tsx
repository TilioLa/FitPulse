import Link from 'next/link'
import { ArrowRight, Dumbbell, Target, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section className="bg-primary-700 text-white py-20">
      <div className="max-w-7xl mx-auto min-h-[560px] px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Ton coach visuel pour transformer ta régularité
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto">
            Des séances guidées pas à pas, un plan simple à suivre,
            et des programmes adaptés à ton niveau, ton objectif et ton contexte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/inscription"
              data-cta-id="hero_primary_signup"
              className="btn-primary bg-white text-primary-600 hover:bg-primary-50 text-lg px-8 py-4 flex items-center space-x-2"
            >
              <span>Démarrer mon plan gratuit</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/programmes"
              data-cta-id="hero_secondary_programs"
              className="btn-secondary border-white text-lg px-8 py-4"
            >
              Découvrir les programmes
            </Link>
          </div>
          <p className="text-sm text-primary-100 mb-10">
            Sans carte bancaire. Premier plan personnalisé en moins de 2 minutes.
          </p>

          <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
              <div className="text-2xl font-bold">2 min</div>
              <div className="text-xs text-primary-100 mt-1">pour obtenir ton plan de départ</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
              <div className="text-2xl font-bold">+10</div>
              <div className="text-xs text-primary-100 mt-1">programmes prêts à lancer</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-3">
              <div className="text-2xl font-bold">7j</div>
              <div className="text-xs text-primary-100 mt-1">pour enclencher ta régularité</div>
            </div>
          </div>
          
          {/* Features icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="flex flex-col items-center reveal reveal-1">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <Dumbbell className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Programmes adaptés</h3>
              <p className="text-primary-100 text-sm">À domicile ou en salle</p>
            </div>
            <div className="flex flex-col items-center reveal reveal-2">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <Target className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Objectifs personnalisés</h3>
              <p className="text-primary-100 text-sm">Musculation, perte de poids, cardio</p>
            </div>
            <div className="flex flex-col items-center reveal reveal-3">
              <div className="bg-white/20 rounded-full p-4 mb-4">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Suivi en temps réel</h3>
              <p className="text-primary-100 text-sm">Suivez vos progrès au jour le jour</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto reveal reveal-3">
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-4">
              <div className="text-sm font-semibold">Sans matériel obligatoire</div>
              <div className="text-xs text-primary-100 mt-1">Programmes faisables chez soi ou en salle</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-4">
              <div className="text-sm font-semibold">Progression guidée</div>
              <div className="text-xs text-primary-100 mt-1">Séries, répétitions et repos déjà structurés</div>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-4">
              <div className="text-sm font-semibold">Ajustements en direct</div>
              <div className="text-xs text-primary-100 mt-1">Adapte la séance selon ton ressenti du jour</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
