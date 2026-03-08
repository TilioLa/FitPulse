<<<<<<< HEAD
//
//  Sidebar.tsx
//  
//
//  Created by Tilio Lave on 18/01/2026.
//

'use client'

import { Calendar, History, BookOpen, Settings, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'

type DashboardSection = 'sessions' | 'history' | 'programs' | 'settings'
=======
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
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b

interface SidebarProps {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
}

<<<<<<< HEAD
const menuItems = [
  { id: 'sessions' as DashboardSection, label: 'Mes séances', icon: Calendar },
  { id: 'history' as DashboardSection, label: 'Historique', icon: History },
  { id: 'programs' as DashboardSection, label: 'Programmes recommandés', icon: BookOpen },
  { id: 'settings' as DashboardSection, label: 'Paramètres', icon: Settings },
=======
const menuItems: MenuItem[] = [
  { id: 'feed', labelKey: 'feed', icon: Home },
  { id: 'session', labelKey: 'session', icon: Activity },
  { id: 'history', labelKey: 'history', icon: History },
  { id: 'programs', labelKey: 'programs', icon: BookOpen },
  { id: 'routines', labelKey: 'routines', icon: FolderPlus },
  { id: 'exercises', labelKey: 'exercises', icon: Dumbbell, href: '/exercices' },
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
]

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()
<<<<<<< HEAD

  const handleLogout = () => {
    localStorage.removeItem('fitpulse_user')
=======
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const displayName = user?.name || 'Utilisateur'
  const initials = displayName.trim().charAt(0).toUpperCase() || 'U'

  const handleLogout = async () => {
    await signOut()
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
    router.push('/')
  }

  return (
<<<<<<< HEAD
    <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-200px)] p-4">
      <div className="flex items-center space-x-2 mb-8 pb-4 border-b">
=======
    <aside className="w-full lg:w-64 bg-white shadow-lg lg:min-h-screen p-3 lg:p-4 border-b lg:border-b-0">
      <div className="flex items-center space-x-2 mb-3 lg:mb-6 pb-3 lg:pb-4 border-b">
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
        <Activity className="h-6 w-6 text-primary-600" />
        <span className="text-xl font-bold text-gray-900">FitPulse</span>
      </div>

<<<<<<< HEAD
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
=======
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
                <span className="text-sm font-medium leading-tight truncate">{t(item.labelKey as any)}</span>
              </Link>
            )
          }
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
<<<<<<< HEAD
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
=======
              className={`w-full grid grid-cols-[20px_1fr] items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Icon className="h-5 w-5" />
<<<<<<< HEAD
              <span className="font-medium">{item.label}</span>
=======
              <span className="text-sm font-medium leading-tight truncate">{t(item.labelKey as any)}</span>
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
            </button>
          )
        })}
      </nav>

<<<<<<< HEAD
      <div className="mt-8 pt-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
=======
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
            <div className="flex flex-col">
              <div className="text-sm font-semibold text-gray-900">{displayName}</div>
              <Link href="/profil" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                Profil
              </Link>
            </div>
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
>>>>>>> b12b3e675baa57e1dec406f77473e0ccf593425b
    </aside>
  )
}
