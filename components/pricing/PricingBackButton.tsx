'use client'

import { useRouter } from 'next/navigation'

export default function PricingBackButton() {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push('/dashboard')
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
    >
      ← Retour
    </button>
  )
}
