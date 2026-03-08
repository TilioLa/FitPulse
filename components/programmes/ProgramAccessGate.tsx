'use client'

import type { ReactNode } from 'react'

export default function ProgramAccessGate({
  children,
}: {
  programId: string
  children: ReactNode
}) {
  return <>{children}</>
}
