'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global app error:', error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">FitPulse a rencontré une erreur</h1>
            <p className="mt-2 text-sm text-gray-600">
              Une erreur critique est survenue. Réessayez, puis rechargez la page si nécessaire.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-4 btn-primary w-full"
            >
              Redémarrer l’écran
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
