import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import { sendLifecycleEmail, type LifecycleEmailEvent } from '@/lib/lifecycle-email'
import { sendWorkoutReminderEmail } from '@/lib/reminder-email'
import { didWorkoutToday, shouldTrainToday } from '@/lib/reminder-logic'
import type { WorkoutHistoryItem } from '@/lib/history'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type UserMeta = {
  fitpulse_lifecycle_sent?: Partial<Record<LifecycleEmailEvent, string>>
  fitpulse_trial_started_at?: string
  fitpulse_reminder_last_sent?: string
}

function isoDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getAuthToken(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim()
  }
  return ''
}

function daysSince(dateIso: string, now = Date.now()) {
  const created = new Date(dateIso).getTime()
  if (!Number.isFinite(created)) return 0
  return Math.floor((now - created) / (24 * 60 * 60 * 1000))
}

function trialDaysLeft(startIso?: string, now = Date.now()) {
  if (!startIso) return null
  const start = new Date(startIso).getTime()
  if (!Number.isFinite(start)) return null
  const end = start + 14 * 24 * 60 * 60 * 1000
  return Math.ceil((end - now) / (24 * 60 * 60 * 1000))
}

function getLifecycleDueEvents(user: User, meta: UserMeta): LifecycleEmailEvent[] {
  const sent = meta.fitpulse_lifecycle_sent || {}
  const now = Date.now()
  const age = daysSince(user.created_at || new Date().toISOString(), now)
  const due: LifecycleEmailEvent[] = []

  if (!sent.day1 && age >= 1) due.push('day1')
  if (!sent.day7 && age >= 7) due.push('day7')

  const left = trialDaysLeft(meta.fitpulse_trial_started_at, now)
  if (!sent.trial_ending && left != null && left >= 0 && left <= 2) {
    due.push('trial_ending')
  }

  return due
}

export async function GET(request: Request) {
  return POST(request)
}

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_SERVER_CRON_EMAILS !== 'true') {
      return NextResponse.json({ ok: true, skipped: true, reason: 'disabled' })
    }

    const expectedSecret = process.env.CRON_SECRET || ''
    if (!expectedSecret) {
      return NextResponse.json({ ok: false, error: 'missing_cron_secret' }, { status: 500 })
    }
    const providedSecret = getAuthToken(request)
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'missing_supabase_admin_env' },
        { status: 500 }
      )
    }

    const supabase = getSupabaseAdminClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const todayKey = isoDayKey()

    const counters = {
      processedUsers: 0,
      lifecycleSent: 0,
      reminderSent: 0,
      lifecycleErrors: 0,
      reminderErrors: 0,
    }

    let page = 1
    const perPage = 200
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message, ...counters },
          { status: 500 }
        )
      }
      const users = data?.users || []
      if (users.length === 0) break

      for (const user of users) {
        counters.processedUsers += 1
        if (!user.email) continue

        const metadata = (user.user_metadata || {}) as UserMeta
        const nextMetadata: UserMeta = { ...metadata }
        const sentEvents = { ...(metadata.fitpulse_lifecycle_sent || {}) }

        const dueEvents = getLifecycleDueEvents(user, metadata)
        for (const event of dueEvents) {
          try {
            const sent = await sendLifecycleEmail({
              to: user.email,
              name: (user.user_metadata as any)?.full_name || null,
              event,
              appUrl,
            })
            if (sent.sent) {
              sentEvents[event] = new Date().toISOString()
              counters.lifecycleSent += 1
            }
          } catch {
            counters.lifecycleErrors += 1
          }
        }
        nextMetadata.fitpulse_lifecycle_sent = sentEvents

        const { data: stateRow } = await supabase
          .from('user_state')
          .select('settings')
          .eq('user_id', user.id)
          .maybeSingle()
        const settings = ((stateRow as any)?.settings || {}) as Record<string, unknown>

        const shouldReminder =
          settings.reminderEmailsEnabled !== false &&
          shouldTrainToday(settings) &&
          metadata.fitpulse_reminder_last_sent !== todayKey

        if (shouldReminder) {
          const { data: historyRow } = await supabase
            .from('user_history')
            .select('history')
            .eq('user_id', user.id)
            .maybeSingle()
          const history = (((historyRow as any)?.history || []) as WorkoutHistoryItem[])
          if (!didWorkoutToday(history)) {
            try {
              const sent = await sendWorkoutReminderEmail({
                to: user.email,
                name: (user.user_metadata as any)?.full_name || null,
                appUrl,
              })
              if (sent.sent) {
                nextMetadata.fitpulse_reminder_last_sent = todayKey
                counters.reminderSent += 1
              }
            } catch {
              counters.reminderErrors += 1
            }
          }
        }

        const metadataChanged =
          JSON.stringify(metadata.fitpulse_lifecycle_sent || {}) !==
            JSON.stringify(nextMetadata.fitpulse_lifecycle_sent || {}) ||
          metadata.fitpulse_reminder_last_sent !== nextMetadata.fitpulse_reminder_last_sent

        if (metadataChanged) {
          await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata || {}),
              ...nextMetadata,
            },
          })
        }
      }

      if (users.length < perPage) break
      page += 1
    }

    return NextResponse.json({
      ok: true,
      ...counters,
      day: todayKey,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'cron_failed' },
      { status: 500 }
    )
  }
}
