'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 420)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 rounded-full border border-primary-200 bg-white p-3 text-primary-700 shadow-md transition hover:bg-primary-50 lg:bottom-6"
      aria-label="Retour en haut"
      title="Retour en haut"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
