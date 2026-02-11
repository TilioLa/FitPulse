'use client'

import { Home, BookOpen, Activity, FolderPlus, Dumbbell, Settings as SettingsIcon, Sparkles, History } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useI18n } from '@/components/I18nProvider'

type DashboardSection = 'feed' | 'session' | 'history' | 'programs' | 'routines' | 'settings' | 'exercises'

interface SidebarProps {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
}

const menuItems = [
  { id: 'feed' as DashboardSection, labelKey: 'feed', icon: Home },
  { id: 'session' as DashboardSection, labelKey: 'session', icon: Activity, href: '/dashboard?view=session' },
  { id: 'history' as DashboardSection, labelKey: 'history', icon: History },
  { id: 'programs' as DashboardSection, labelKey: 'programs', icon: BookOpen },
  { id: 'routines' as DashboardSection, labelKey: 'routines', icon: FolderPlus },
  { id: 'exercises', labelKey: 'exercises', icon: Dumbbell, href: '/exercices' },
]

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useI18n()
  const displayName = session?.user?.name || 'Utilisateur'
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U'

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    router.push('/')
  }

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen p-4">
      <div className="flex items-center space-x-2 mb-6 pb-4 border-b">
        <Activity className="h-6 w-6 text-primary-600" />
        <span className="text-xl font-bold text-gray-900">FitPulse</span>
      </div>

      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          if ('href' in item) {
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full grid grid-cols-[20px_1fr] items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                  item.href === '/dashboard?view=session' && activeSection === 'session'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium leading-tight">{t(item.labelKey as any)}</span>
              </Link>
            )
          }
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full grid grid-cols-[20px_1fr] items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium leading-tight">{t(item.labelKey as any)}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-8 pt-4 border-t space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="font-medium">{t('logout')}</span>
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`w-full grid grid-cols-[20px_1fr] items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
            activeSection === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          <SettingsIcon className="h-5 w-5" />
          <span className="font-medium leading-tight">{t('settings')}</span>
        </button>
      </div>

      <div className="mt-6 pt-4 border-t">
        <div className="rounded-2xl bg-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">FitPulse</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-300 text-gray-900">
              PRO
            </span>
          </div>
          <span className="text-xs font-semibold text-primary-700 bg-white px-3 py-1.5 rounded-lg border border-primary-200">
            Bientôt
          </span>
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
    </aside>
  )
}
