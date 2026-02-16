'use client'

import { Home, BookOpen, Activity, FolderPlus, Dumbbell, Settings as SettingsIcon, Sparkles, History } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/components/I18nProvider'
import { useAuth } from '@/components/SupabaseAuthProvider'
import MobileBottomNav from '@/components/dashboard/MobileBottomNav'

type DashboardSection = 'feed' | 'session' | 'history' | 'programs' | 'routines' | 'settings' | 'exercises'

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
  { id: 'session', labelKey: 'session', icon: Activity, href: '/dashboard?view=session' },
  { id: 'history', labelKey: 'history', icon: History },
  { id: 'programs', labelKey: 'programs', icon: BookOpen },
  { id: 'routines', labelKey: 'routines', icon: FolderPlus },
  { id: 'exercises', labelKey: 'exercises', icon: Dumbbell, href: '/exercices' },
]

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const displayName = user?.name || 'Utilisateur'
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U'

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
                  item.href === '/dashboard?view=session' && activeSection === 'session'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium leading-tight truncate">{t(item.labelKey as any)}</span>
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
              <span className="text-sm font-medium leading-tight truncate">{t(item.labelKey as any)}</span>
            </button>
          )
        })}
      </nav>

      <div className="hidden lg:grid mt-4 lg:mt-8 pt-3 lg:pt-4 border-t grid-cols-2 gap-2 lg:space-y-2 lg:grid-cols-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center lg:justify-start space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="text-sm font-medium">{t('logout')}</span>
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`w-full grid grid-cols-[20px_1fr] items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-left ${
            activeSection === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="text-sm font-medium leading-tight truncate">{t('settings')}</span>
        </button>
      </div>

      <div className="hidden lg:block mt-6 pt-4 border-t">
        <div className="rounded-2xl bg-primary-50 border border-primary-200 px-4 py-3">
          <div className="text-sm font-bold text-gray-900">FitPulse</div>
          <div className="text-xs text-primary-800 mt-1">
            Accès complet gratuit.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold">
              {initials}
            </div>
            <div className="text-sm font-semibold text-gray-900">{displayName}</div>
          </div>
          <button
            onClick={handleLogout}
            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            ↗
          </button>
        </div>
      </div>

      <MobileBottomNav activeSection={activeSection} setActiveSection={setActiveSection} />
    </aside>
  )
}
