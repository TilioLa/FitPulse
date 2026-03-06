'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import {
  clearNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  readNotifications,
  subscribeNotifications,
} from '@/lib/in-app-notifications'

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(() => readNotifications())
  const [unreadCount, setUnreadCount] = useState(() => getUnreadNotificationCount())

  useEffect(() => {
    const sync = () => {
      setItems(readNotifications())
      setUnreadCount(getUnreadNotificationCount())
    }
    sync()
    const unsubscribe = subscribeNotifications(() => {
      sync()
    })
    return unsubscribe
  }, [])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Ouvrir le centre de notifications"
        className="relative h-10 w-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
      >
        <Bell className="mx-auto h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Tout marquer comme lu"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => clearNotifications()}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Vider"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {items.length === 0 && <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">Aucune notification.</p>}
            {items.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border px-3 py-2 ${item.readAt ? 'border-gray-200 bg-white' : 'border-primary-200 bg-primary-50'}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => markNotificationRead(item.id)}
                >
                  <div className="text-xs font-semibold text-gray-900">{item.title}</div>
                  {item.body && <div className="mt-1 text-xs text-gray-600">{item.body}</div>}
                  <div className="mt-1 text-[11px] text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                </button>
                {item.href && (
                  <Link
                    href={item.href}
                    onClick={() => {
                      markNotificationRead(item.id)
                      setOpen(false)
                    }}
                    className="mt-2 inline-block text-xs font-semibold text-primary-700 underline underline-offset-2"
                  >
                    Ouvrir
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
