'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
import { LifeBuoy, MessageSquare, Mail, BookOpen } from 'lucide-react'
import { faqs } from '@/lib/faq-data'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function HelpCenterPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
            <div className="mb-8">
              <h1 className="section-title mb-3">Centre d&apos;aide</h1>
              <p className="section-subtitle">
                FAQ, tickets et contact direct pour vous répondre rapidement.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/tickets" className="btn-primary">
                  Ouvrir un ticket
                </Link>
                <Link href="/contact" className="btn-secondary">
                  Nous contacter
                </Link>
              </div>
            </div>

            <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card-soft">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Tickets</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Suivez vos demandes et recevez une réponse sous 24 à 48h ouvrées.
                </p>
                <Link href="/tickets" className="mt-3 inline-flex text-sm font-semibold text-primary-600">
                  Accéder aux tickets →
                </Link>
              </div>
              <div className="card-soft">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Contact</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Un besoin spécifique ? Écrivez-nous directement via le formulaire.
                </p>
                <Link href="/contact" className="mt-3 inline-flex text-sm font-semibold text-primary-600">
                  Ouvrir le contact →
                </Link>
              </div>
              <div className="card-soft">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-gray-900">Guides</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Accédez aux réponses les plus fréquentes dans la FAQ ci-dessous.
                </p>
                <a href="#faq" className="mt-3 inline-flex text-sm font-semibold text-primary-600">
                  Voir la FAQ →
                </a>
              </div>
            </section>

            <section id="faq" className="card-soft">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Questions fréquentes</h2>
                <p className="text-gray-600">Toutes les réponses rapides, au même endroit.</p>
              </div>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={faq.question} className="card">
                    <button
                      type="button"
                      className="w-full text-left flex items-center justify-between"
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                      aria-expanded={openIndex === index}
                      aria-controls={`help-faq-${index}`}
                    >
                      <span className="text-base sm:text-lg font-semibold text-gray-900 pr-8">
                        {faq.question}
                      </span>
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-primary-600 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary-600 flex-shrink-0" />
                      )}
                    </button>
                    {openIndex === index && (
                      <p id={`help-faq-${index}`} className="mt-4 text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
