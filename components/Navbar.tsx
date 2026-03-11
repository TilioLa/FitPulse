'use client'

import Link from 'next/link'
import { Activity, Search } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { programs as allPrograms } from '@/data/programs'
import { exerciseCatalog } from '@/data/exercises'
import { readLocalCustomRoutines } from '@/lib/user-state-store'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [routines, setRoutines] = useState<{ id: string; name: string; exercises?: { name: string }[] }[]>([])
  const searchRef = useRef<HTMLDivElement | null>(null)

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/programmes', label: 'Programmes' },
    { href: '/exercices', label: 'Exercices' },
    { href: '/aide', label: 'Aide' },
  ]

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = () => {
      const stored = readLocalCustomRoutines() as unknown as { id: string; name: string; exercises?: { name: string }[] }[]
      setRoutines(Array.isArray(stored) ? stored : [])
    }
    load()
    window.addEventListener('fitpulse-custom-routines', load)
    return () => window.removeEventListener('fitpulse-custom-routines', load)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!searchRef.current) return
      if (!searchRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const searchResults = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (term.length < 2) {
      return { programs: [], exercises: [], routines: [] }
    }
    const programs = allPrograms
      .filter((program) =>
        program.name.toLowerCase().includes(term) ||
        program.description.toLowerCase().includes(term) ||
        program.goals.some((goal) => goal.toLowerCase().includes(term))
      )
      .slice(0, 5)

    const exercises = exerciseCatalog
      .filter((exercise) => exercise.name.toLowerCase().includes(term))
      .slice(0, 5)

    const routinesMatches = routines
      .filter((routine) =>
        routine.name.toLowerCase().includes(term) ||
        (routine.exercises || []).some((exercise) => exercise.name.toLowerCase().includes(term))
      )
      .slice(0, 5)

    return { programs, exercises, routines: routinesMatches }
  }, [query, routines])

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">FitPulse</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2" ref={searchRef}>
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  const term = query.trim()
                  if (term.length > 0) {
                    router.push(`/programmes?q=${encodeURIComponent(term)}`)
                    setOpen(false)
                  }
                }
              }}
              className="w-64 rounded-lg border border-gray-200 bg-white px-9 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Rechercher programmes, exercices..."
            />
            {open && query.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl border border-gray-200 bg-white shadow-lg p-3 z-50">
                {searchResults.programs.length === 0 &&
                  searchResults.exercises.length === 0 &&
                  searchResults.routines.length === 0 && (
                    <div className="text-sm text-gray-500">Aucun résultat.</div>
                  )}

                {searchResults.programs.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Programmes</div>
                    <div className="space-y-1">
                      {searchResults.programs.map((program) => (
                        <button
                          key={program.id}
                          onClick={() => {
                            router.push(`/programmes/${program.slug}`)
                            setOpen(false)
                          }}
                          className="w-full text-left rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {program.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.exercises.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Exercices</div>
                    <div className="space-y-1">
                      {searchResults.exercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          onClick={() => {
                            router.push(`/exercices?q=${encodeURIComponent(exercise.name)}`)
                            setOpen(false)
                          }}
                          className="w-full text-left rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {exercise.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {searchResults.routines.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Routines</div>
                    <div className="space-y-1">
                      {searchResults.routines.map((routine) => (
                        <button
                          key={routine.id}
                          onClick={() => {
                            router.push('/dashboard?view=routines')
                            setOpen(false)
                          }}
                          className="w-full text-left rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {routine.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    const term = query.trim()
                    if (term.length > 0) {
                      router.push(`/programmes?q=${encodeURIComponent(term)}`)
                      setOpen(false)
                    }
                  }}
                  className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Voir tous les résultats
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/connexion" className="btn-secondary px-4 py-2 text-sm">
            Connexion
          </Link>
          <Link href="/inscription" className="btn-primary px-4 py-2 text-sm">
            Inscription
          </Link>
        </div>
      </div>
    </header>
  )
}
