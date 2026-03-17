'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
import { useAuth } from '@/components/SupabaseAuthProvider'
import { LifeBuoy, Plus, CheckCircle2, MessageSquare, Clock, AlertTriangle } from 'lucide-react'

type TicketStatus = 'open' | 'waiting' | 'closed'
type TicketPriority = 'low' | 'normal' | 'high'

type Ticket = {
  id: string
  title: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  description: string
  createdAt: string
  updatedAt: string
}

type TicketAttachment = {
  name: string
  mimeType: string
  dataUrl: string
}

const STORAGE_KEY = 'fitpulse_tickets_v1'

const buildTicketId = () => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return `TCK-${stamp}-${random}`
}

const loadTickets = () => {
  if (typeof window === 'undefined') return [] as Ticket[]
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Ticket[]
  } catch {
    return []
  }
}

const persistTickets = (tickets: Ticket[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export default function TicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeStatus, setActiveStatus] = useState<TicketStatus | 'all'>('open')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Compte & accès')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [description, setDescription] = useState('')
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState<string | null>(null)
  const [attachment, setAttachment] = useState<TicketAttachment | null>(null)
  const sendErrorLabel: Record<string, string> = {
    configuration_email_incomplete: 'configuration email incomplète',
    missing_smtp_env: 'variables SMTP manquantes',
    smtp_auth_failed: 'auth SMTP invalide (app password)',
    smtp_connection_failed: 'connexion SMTP impossible',
    smtp_timeout: 'timeout SMTP',
    send_failed: 'envoi impossible',
  }

  useEffect(() => {
    setTickets(loadTickets())
  }, [])

  useEffect(() => {
    persistTickets(tickets)
  }, [tickets])

  const filteredTickets = useMemo(() => {
    if (activeStatus === 'all') return tickets
    return tickets.filter((ticket) => ticket.status === activeStatus)
  }, [tickets, activeStatus])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !description.trim()) return
    const now = new Date().toISOString()
    const newTicket: Ticket = {
      id: buildTicketId(),
      title: title.trim(),
      category,
      priority,
      status: 'open',
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
    }
    setTickets((prev) => [newTicket, ...prev])
    setTitle('')
    setDescription('')
    setPriority('normal')
    setCategory('Compte & accès')
    setSubmittedId(newTicket.id)
    setSendState('sending')
    setSendError(null)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://fitpulse.app')
    void fetch('/api/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...newTicket,
        userEmail: user?.email || null,
        appUrl,
        attachment,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(String((payload as { error?: string }).error || 'send_failed'))
        }
        setSendState('sent')
      })
      .catch((error) => {
        console.error('Support ticket email failed', error)
        setSendState('error')
        const code = error instanceof Error ? error.message : 'send_failed'
        if (code === 'missing_smtp_env') {
          setSendError('configuration_email_incomplete')
        } else {
          setSendError(code)
        }
      })
      .finally(() => {
        setAttachment(null)
      })
  }

  const updateStatus = (id: string, status: TicketStatus) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status, updatedAt: new Date().toISOString() }
          : ticket
      )
    )
  }

  const statusLabel: Record<TicketStatus, string> = {
    open: 'Ouvert',
    waiting: 'En attente',
    closed: 'Résolu',
  }

  const priorityLabel: Record<TicketPriority, string> = {
    low: 'Faible',
    normal: 'Normal',
    high: 'Urgent',
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-6 lg:py-12">
          <div className="page-wrap">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="section-title mb-2">Tickets Support</h1>
                <p className="section-subtitle">
                  Ouvre un ticket et suis son statut. Notre equipe traite les demandes sous 24 a 48h.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700">
                  <LifeBuoy className="h-4 w-4" />
                  Support FitPulse
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
              <section className="card-soft">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Mes tickets</h2>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {(['open', 'waiting', 'closed', 'all'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setActiveStatus(status)}
                        className={`rounded-full border px-3 py-1 font-semibold ${
                          activeStatus === status
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {status === 'all' ? 'Tous' : statusLabel[status]}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <LifeBuoy className="h-6 w-6" />
                    </div>
                    <p className="text-gray-600">Aucun ticket pour ce filtre.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Besoin d&apos;aide ? Cree un nouveau ticket ci-dessous.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-700">{ticket.id}</span>
                              <span>·</span>
                              <span>{ticket.category}</span>
                              <span>·</span>
                              <span className="font-semibold text-gray-700">{priorityLabel[ticket.priority]}</span>
                            </div>
                            <h3 className="mt-1 text-lg font-semibold text-gray-900">{ticket.title}</h3>
                            <p className="mt-2 text-sm text-gray-600">{ticket.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                ticket.status === 'closed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : ticket.status === 'waiting'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-primary-100 text-primary-700'
                              }`}
                            >
                              {statusLabel[ticket.status]}
                            </span>
                            <span className="text-xs text-gray-500">
                              Maj: {new Date(ticket.updatedAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                        {ticket.status !== 'closed' && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              onClick={() => updateStatus(ticket.id, 'waiting')}
                              className="btn-secondary px-4 py-2 text-xs inline-flex items-center gap-2"
                            >
                              <Clock className="h-4 w-4" />
                              En attente
                            </button>
                            <button
                              onClick={() => updateStatus(ticket.id, 'closed')}
                              className="btn-primary px-4 py-2 text-xs inline-flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Marquer resolu
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div className="card-soft">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Nouveau ticket</h2>
                  </div>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sujet</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ex: Probleme d&apos;acces au dashboard"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categorie</label>
                        <select
                          value={category}
                          onChange={(event) => setCategory(event.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                          <option>Compte & accès</option>
                          <option>Seances & historique</option>
                          <option>Programmes</option>
                          <option>Paiement</option>
                          <option>Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priorite</label>
                        <select
                          value={priority}
                          onChange={(event) => setPriority(event.target.value as TicketPriority)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                        >
                          <option value="low">Faible</option>
                          <option value="normal">Normal</option>
                          <option value="high">Urgent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        required
                        rows={5}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Decris le probleme, les etapes et l&apos;appareil utilise."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pièce jointe (optionnel)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (!file) {
                            setAttachment(null)
                            return
                          }
                          if (file.size > 2_000_000) {
                            setAttachment(null)
                            setSendState('error')
                            setSendError('attachment_too_large')
                            return
                          }
                          const reader = new FileReader()
                          reader.onload = () => {
                            const dataUrl = typeof reader.result === 'string' ? reader.result : null
                            if (!dataUrl) return
                            setAttachment({
                              name: file.name,
                              mimeType: file.type || 'application/octet-stream',
                              dataUrl,
                            })
                            setSendError(null)
                            if (sendState === 'error') setSendState('idle')
                          }
                          reader.readAsDataURL(file)
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        Capture d&apos;écran recommandée. Max 2 Mo.
                      </p>
                    </div>
                    <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={sendState === 'sending'}>
                      <AlertTriangle className="h-4 w-4" />
                      {sendState === 'sending' ? 'Envoi en cours...' : 'Creer le ticket'}
                    </button>
                    {submittedId && (
                      <p className="text-sm text-emerald-600" role="status" aria-live="polite">
                        Ticket cree: {submittedId}. Nous revenons vers toi rapidement.
                      </p>
                    )}
                    {sendState === 'sent' && (
                      <p className="text-sm text-emerald-600" role="status" aria-live="polite">
                        Ticket envoyé au support.
                      </p>
                    )}
                    {sendState === 'error' && (
                      <p className="text-sm text-red-600" role="alert">
                        Envoi support échoué
                        {sendError ? ` (${sendErrorLabel[sendError] || sendError})` : ''}. Tu peux réessayer.
                      </p>
                    )}
                  </form>
                </div>

                <div className="card-soft bg-gradient-to-br from-primary-50 to-accent-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoin d&apos;aide rapide ?</h3>
                  <p className="text-sm text-gray-600">
                    Tu peux aussi utiliser la page contact si tu preferes un message direct.
                  </p>
                  <Link href="/contact" className="mt-4 inline-flex btn-secondary">
                    Aller au contact
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
