'use client'

import { Activity, BookOpen, Dumbbell, Home, Settings as SettingsIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

type DashboardSection = 'feed' | 'session' | 'history' | 'programs' | 'routines' | 'settings' | 'exercises'

type NavItem = {
  id: DashboardSection
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { id: 'feed', label: 'Accueil', icon: Home },
  { id: 'session', label: 'Séance', icon: Activity },
  { id: 'programs', label: 'Programmes', icon: BookOpen },
  { id: 'exercises', label: 'Exercices', icon: Dumbbell },
  { id: 'settings', label: 'Réglages', icon: SettingsIcon },
]

export default function MobileBottomNav({
  activeSection,
  setActiveSection,
}: {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
}) {
  const router = useRouter()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isActive) return
                if (item.id === 'exercises') {
                  router.push('/exercices')
                  return
                }
                setActiveSection(item.id)
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-2 text-[11px] font-medium ${
                isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-500'
              }`}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
