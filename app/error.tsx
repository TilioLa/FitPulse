'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Keep a lightweight trace for local debugging.
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Une erreur est survenue</h1>
        <p className="mt-2 text-sm text-gray-600">
          La page a rencontré un problème inattendu. Vous pouvez réessayer immédiatement.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 btn-primary w-full"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
