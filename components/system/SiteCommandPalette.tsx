'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

type Action = {
  id: string
  label: string
  keywords: string[]
  run: () => void
}

export default function SiteCommandPalette() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (pathname.startsWith('/dashboard')) return
        setOpen((prev) => !prev)
      } else if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pathname])

  const actions = useMemo<Action[]>(
    () => [
      { id: 'home', label: 'Aller à l’accueil', keywords: ['home', 'landing'], run: () => router.push('/') },
      { id: 'programs', label: 'Voir les programmes', keywords: ['plan', 'training'], run: () => router.push('/programmes') },
      { id: 'exercises', label: 'Ouvrir les exercices', keywords: ['catalogue'], run: () => router.push('/exercices') },
      { id: 'dashboard', label: 'Ouvrir le dashboard', keywords: ['session', 'history'], run: () => router.push('/dashboard?view=feed') },
      { id: 'pricing', label: 'Voir les offres', keywords: ['prix', 'abonnement'], run: () => router.push('/pricing') },
      { id: 'help', label: 'Centre d’aide', keywords: ['faq', 'support'], run: () => router.push('/aide') },
      { id: 'account-status', label: 'État du compte', keywords: ['security', 'statut'], run: () => router.push('/compte/etat') },
      { id: 'contact', label: 'Contacter le support', keywords: ['ticket', 'email'], run: () => router.push('/contact') },
      { id: 'signup', label: 'Créer un compte', keywords: ['register'], run: () => router.push('/inscription') },
      { id: 'login', label: 'Se connecter', keywords: ['auth'], run: () => router.push('/connexion') },
    ],
    [router]
  )

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return actions
    return actions.filter((action) =>
      [action.label, ...action.keywords].join(' ').toLowerCase().includes(value)
    )
  }, [actions, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        className="mx-auto mt-20 w-[min(96vw,640px)] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <label className="mb-2 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Recherche globale..."
            className="w-full border-none bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">Esc</kbd>
        </label>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">Aucun résultat.</p>
          )}
          {filtered.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                action.run()
                setOpen(false)
              }}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-primary-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
