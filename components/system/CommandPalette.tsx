'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'

type PaletteAction = {
  id: string
  label: string
  keywords?: string[]
  onRun: () => void
}

export default function CommandPalette({ actions }: { actions: PaletteAction[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter((item) => {
      const target = [item.label, ...(item.keywords ?? [])].join(' ').toLowerCase()
      return target.includes(q)
    })
  }, [actions, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30 p-4" onClick={() => setOpen(false)}>
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
            placeholder="Chercher une action..."
            className="w-full border-none bg-transparent text-sm outline-none"
          />
          <kbd className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">Esc</kbd>
        </label>
        <div className="max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-500">Aucune action trouvée.</p>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                item.onRun()
                setOpen(false)
              }}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-primary-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
