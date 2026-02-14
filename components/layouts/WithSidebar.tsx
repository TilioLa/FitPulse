'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'

type Section = 'feed' | 'session' | 'history' | 'programs' | 'routines' | 'settings' | 'exercises'

export default function WithSidebar({
  active,
  children,
}: {
  active: Section
  children: ReactNode
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col lg:flex-row flex-grow">
      <Sidebar
        activeSection={active}
        setActiveSection={(section) => {
          if (section === 'feed') router.push('/dashboard')
          if (section === 'history') router.push('/dashboard?view=history')
          if (section === 'session') router.push('/dashboard?view=session')
          if (section === 'programs') router.push('/programmes')
          if (section === 'routines') router.push('/dashboard?view=routines')
          if (section === 'settings') router.push('/dashboard?view=settings')
          if (section === 'exercises') router.push('/exercices')
        }}
      />
      <div className="flex-grow min-w-0 pb-24 lg:pb-0">{children}</div>
    </div>
  )
}
