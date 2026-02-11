'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: "Puis-je commencer sans matériel ?",
    answer: "Absolument ! Nous proposons des programmes complets basés uniquement sur le poids du corps. Vous pouvez progresser efficacement sans aucun équipement, à domicile ou en extérieur."
  },
  {
    question: "Comment fonctionne la personnalisation des programmes ?",
    answer: "Lors de votre inscription, nous vous posons des questions sur votre niveau, vos objectifs, le matériel disponible et vos contraintes. Notre algorithme crée ensuite un programme adapté, que vous pouvez modifier à tout moment."
  },
  {
    question: "Puis-je changer de programme en cours de route ?",
    answer: "Oui, vous pouvez changer de programme à tout moment. Votre historique est conservé et vous pouvez reprendre là où vous vous êtes arrêté. La flexibilité est au cœur de notre approche."
  },
  {
    question: "Y a-t-il un engagement minimum ?",
    answer: "Non, aucun engagement ! Vous pouvez annuler votre abonnement à tout moment. L'abonnement gratuit vous donne accès à un programme complet de base, et les versions payantes offrent plus de fonctionnalités."
  },
  {
    question: "Les programmes sont-ils adaptés aux débutants ?",
    answer: "Oui, nous avons des programmes pour tous les niveaux, y compris les vrais débutants. Chaque exercice est expliqué en détail avec des vidéos et des instructions étape par étape. Vous pouvez avancer à votre rythme."
  },
  {
    question: "Comment suivre mes progrès ?",
    answer: "Le dashboard affiche vos séances, votre streak et vos minutes totales. Vous voyez vite si vous progressez."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Questions fréquentes
          </h2>
          <p className="text-xl text-gray-600">
            Tout ce que vous devez savoir sur FitPulse
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="card">
              <button
                type="button"
                className="w-full text-left flex items-center justify-between"
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-panel-${index}`}
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-primary-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-primary-600 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <p id={`faq-panel-${index}`} className="mt-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
