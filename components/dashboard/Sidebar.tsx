'use client'

import { Calendar, History, BookOpen, Settings, Activity } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

type DashboardSection = 'sessions' | 'history' | 'programs' | 'settings'

interface SidebarProps {
  activeSection: DashboardSection
  setActiveSection: (section: DashboardSection) => void
}

const menuItems = [
  { id: 'sessions' as DashboardSection, label: 'Mes séances', icon: Calendar },
  { id: 'history' as DashboardSection, label: 'Historique', icon: History },
  { id: 'programs' as DashboardSection, label: 'Programmes recommandés', icon: BookOpen },
  { id: 'settings' as DashboardSection, label: 'Paramètres', icon: Settings },
]

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const router = useRouter()

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
    router.push('/')
  }

  return (
    <aside className="w-64 bg-white shadow-lg min-h-[calc(100vh-200px)] p-4">
      <div className="flex items-center space-x-2 mb-8 pb-4 border-b">
        <Activity className="h-6 w-6 text-primary-600" />
        <span className="text-xl font-bold text-gray-900">FitPulse</span>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-8 pt-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
