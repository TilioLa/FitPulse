'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { canAccessProgram, getEntitlement } from '@/lib/subscription'

export default function ProgramAccessGate({
  programId,
  children,
}: {
  programId: string
  children: ReactNode
}) {
  const [entitlement, setEntitlement] = useState(() => getEntitlement())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const apply = () => setEntitlement(getEntitlement())
    apply()
    window.addEventListener('fitpulse-plan', apply)
    window.addEventListener('storage', apply)
    return () => {
      window.removeEventListener('fitpulse-plan', apply)
      window.removeEventListener('storage', apply)
    }
  }, [])

  if (!mounted || canAccessProgram(programId, entitlement)) {
    return <>{children}</>
  }

  return (
    <div className="card-soft text-center py-12">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="section-title mb-3">Programme premium</h1>
      <p className="text-gray-600 mb-3">Ce programme est réservé au plan Pro.</p>
      {entitlement.isTrialActive && entitlement.plan === 'free' && (
        <p className="text-sm text-primary-700 mb-5">Essai actif: {entitlement.trialDaysLeft} jour(s) restant(s).</p>
      )}
      <Link href="/pricing" className="btn-primary">
        Voir les plans
      </Link>
    </div>
  )
}
