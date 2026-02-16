'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import {
  DashboardSection as Section,
  hrefForDashboardSection,
} from '@/lib/dashboard-navigation'

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
          router.push(hrefForDashboardSection(section))
        }}
      />
      <div className="flex-grow min-w-0 pb-24 lg:pb-0">{children}</div>
    </div>
  )
}
