'use client'

import Link from 'next/link'
import Footer from '@/components/Footer'
import WithSidebar from '@/components/layouts/WithSidebar'
import { buildSmartNotifications } from '@/lib/notifications'

export default function NotificationsPage() {
  const notifications = buildSmartNotifications()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <WithSidebar active="feed">
        <main className="flex-grow py-8">
          <div className="page-wrap">
            <h1 className="section-title mb-3">Centre notifications</h1>
            <p className="section-subtitle mb-6">
              Priorité automatique selon ton activité, ton objectif et ton rythme réel.
            </p>
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-600 mt-1">{item.body}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                      item.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : item.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                  <Link href={item.href} className="mt-2 inline-flex text-xs font-semibold text-primary-700">
                    Ouvrir →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </main>
      </WithSidebar>
      <Footer />
    </div>
  )
}
