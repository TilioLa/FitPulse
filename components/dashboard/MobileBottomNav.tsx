'use client'

import { Activity, BookOpen, FolderPlus, Home, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type DashboardSection = 'feed' | 'session' | 'programs' | 'routines' | 'exercises'

type NavItem = {
  id: DashboardSection
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { id: 'feed', label: 'Accueil', icon: Home },
  { id: 'programs', label: 'Programmes', icon: BookOpen },
  { id: 'routines', label: 'Routines', icon: FolderPlus },
]

export default function MobileBottomNav({
  activeSection,
  setActiveSection,
  sessionInProgress = false,
}: {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
  sessionInProgress?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const visibleNavItems: NavItem[] = sessionInProgress
    ? [...navItems.slice(0, 1), { id: 'session', label: 'Séance', icon: Activity }, ...navItems.slice(1)]
    : navItems
  const isProfileRoute = pathname === '/profil' || pathname === '/settings'

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="grid gap-1 px-2 py-2" style={{ gridTemplateColumns: `repeat(${visibleNavItems.length + 1}, minmax(0, 1fr))` }}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const onDashboardRoute = pathname?.startsWith('/dashboard') ?? false
          const isActive =
            activeSection === item.id && (item.id !== 'feed' || onDashboardRoute)
          return (
            <button
              key={item.id}
              onClick={() => {
                if (isActive) return
                setActiveSection(item.id)
              }}
              className={`flex flex-col items-center justify-center rounded-lg py-2 text-[11px] font-medium ${
                isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-500'
              }`}
            >
              <span className="relative mb-1 inline-flex">
                <Icon className="h-4 w-4" />
                {item.id === 'session' && sessionInProgress && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
        <Link
          href="/profil"
          className={`flex flex-col items-center justify-center rounded-lg py-2 text-[11px] font-medium ${
            isProfileRoute ? 'text-primary-700 bg-primary-50' : 'text-gray-500'
          }`}
        >
          <span className="relative mb-1 inline-flex">
            <User className="h-4 w-4" />
          </span>
          <span>Profil</span>
        </Link>
      </div>
    </nav>
  )
}
