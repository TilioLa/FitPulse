'use client'

import { useState } from 'react'
import Footer from '@/components/Footer'
import { Mail, Phone, MapPin } from 'lucide-react'
import WithSidebar from '@/components/layouts/WithSidebar'

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitted(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-12">
          <div className="page-wrap">
            <div className="mb-8">
              <h1 className="section-title mb-3">Nous contacter</h1>
              <p className="section-subtitle">
                Une question sur FitPulse ? Écrivez-nous et notre équipe vous répond rapidement.
              </p>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card-soft">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Envoyer un message</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="votre.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Comment pouvons-nous aider ?"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      required
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Décrivez votre besoin"
                    />
                  </div>
                  <button type="submit" className="btn-primary">
                    Envoyer le message
                  </button>
                  {isSubmitted && (
                    <p className="text-sm text-green-600" role="status" aria-live="polite">
                      Merci ! Votre message a bien été envoyé. Nous vous répondrons sous 48h.
                    </p>
                  )}
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-soft">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Coordonnées</h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <span>fitpulset@gmail.com</span>
                  </div>
                </div>
              </div>

              <div className="card-soft bg-gradient-to-br from-primary-50 to-accent-50">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Support</h3>
                <p className="text-gray-600">
                  Notre équipe répond généralement sous 24 à 48 heures ouvrées.
                </p>
              </div>
            </div>
          </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
