'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Home, BookOpen, Activity, FolderPlus, Dumbbell, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'
import { useAuth } from '@/components/SupabaseAuthProvider'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav'
import { readLocalCurrentWorkout } from '@/lib/user-state-store'

type DashboardSection = 'feed' | 'recommendations' | 'session' | 'programs' | 'routines' | 'exercises'

type MenuItem = {
  id: DashboardSection
  labelKey: string
  icon: LucideIcon
  href?: string
}

interface SidebarProps {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
}

const menuItems: MenuItem[] = [
  { id: 'feed', labelKey: 'feed', icon: Home },
  { id: 'recommendations', labelKey: 'recommendations', icon: Sparkles },
  { id: 'session', labelKey: 'session', icon: Activity },
  { id: 'programs', labelKey: 'programs', icon: BookOpen },
  { id: 'routines', labelKey: 'routines', icon: FolderPlus },
  { id: 'exercises', labelKey: 'exercises', icon: Dumbbell, href: '/exercices' },
]

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)
  const displayName = mounted && user?.name ? user.name : 'Utilisateur'
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U'
  const [sessionInProgress, setSessionInProgress] = useState(false)

  useEffect(() => {
    setMounted(true)
    const syncInProgress = () => {
      const current = readLocalCurrentWorkout() as { status?: string } | null
      setSessionInProgress(current?.status === 'in_progress')
    }
    syncInProgress()
    window.addEventListener('fitpulse-current-workout', syncInProgress)
    window.addEventListener('storage', syncInProgress)
    return () => {
      window.removeEventListener('fitpulse-current-workout', syncInProgress)
      window.removeEventListener('storage', syncInProgress)
    }
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <aside className="w-full lg:w-64 bg-white shadow-lg lg:min-h-screen p-3 lg:p-4 border-b lg:border-b-0">
      <div className="flex items-center space-x-2 mb-3 lg:mb-6 pb-3 lg:pb-4 border-b">
        <Activity className="h-6 w-6 text-primary-600" />
        <span className="text-xl font-bold text-gray-900">FitPulse</span>
      </div>

      <nav className="hidden lg:grid lg:grid-cols-1 gap-2 lg:space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full grid grid-cols-[20px_1fr] items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <Icon className="h-5 w-5" />
              <span className="flex items-center gap-2 text-sm font-medium leading-tight truncate">
                <span className="truncate">{t(item.labelKey as any)}</span>
                {item.id === 'session' && sessionInProgress && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Reprendre
                  </span>
                )}
              </span>
            </Link>
          )
        }
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full grid grid-cols-[20px_1fr] items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex items-center gap-2 text-sm font-medium leading-tight truncate">
                <span className="truncate">{t(item.labelKey as any)}</span>
                {item.id === 'session' && sessionInProgress && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    Reprendre
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="hidden lg:grid mt-6 pt-4 border-t gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Profil</p>
          <h3 className="text-sm font-semibold text-gray-900">Mon espace personnel</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold">
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{displayName}</div>
            <span className="text-xs text-gray-500">{user?.email || ''}</span>
          </div>
        </div>
        <Link
          href="/profil"
          className="inline-flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary-200 hover:text-primary-600"
        >
          Voir mon profil
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          <span>{t('logout')}</span>
          <span className="text-xs">↗</span>
        </button>
      </div>

      <MobileBottomNav
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        sessionInProgress={sessionInProgress}
      />
    </aside>
  )
}
