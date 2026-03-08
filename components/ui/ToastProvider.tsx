'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  push: (message: string, variant?: ToastVariant, durationMs?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const maxVisible = 3

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback((message: string, variant: ToastVariant = 'success', durationMs = 3200) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((current) => [...current, { id, message, variant }].slice(-maxVisible))

    window.setTimeout(() => {
      removeToast(id)
    }, durationMs)
  }, [maxVisible, removeToast])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center sm:items-end sm:pr-6 gap-3 px-4 pointer-events-none">
        {toasts.map((toast) => {
          const baseStyles = 'w-full max-w-md rounded-xl px-4 py-3 shadow-lg border flex items-start gap-3 pointer-events-auto'
          const variantStyles = toast.variant === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : toast.variant === 'info'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-green-50 border-green-200 text-green-700'

          return (
            <div key={toast.id} className={`toast ${baseStyles} ${variantStyles}`} role="status" aria-live="polite">
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-70 hover:opacity-100"
                aria-label="Fermer la notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
