import { NextResponse } from 'next/server'
import { sendLifecycleEmail, type LifecycleEmailEvent } from '@/lib/lifecycle-email'

export const runtime = 'nodejs'

type Payload = {
  to?: string
  name?: string | null
  event?: LifecycleEmailEvent
}

const allowedEvents: LifecycleEmailEvent[] = ['day1', 'day7', 'trial_ending']

export async function POST(request: Request) {
  try {
    if (process.env.ENABLE_LIFECYCLE_EMAILS !== 'true') {
      return NextResponse.json({ ok: true, sent: false, reason: 'disabled' })
    }

    const body = (await request.json().catch(() => ({}))) as Payload
    const to = body?.to?.trim().toLowerCase()
    const event = body?.event
    const name = body?.name || null

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
    }
    if (!event || !allowedEvents.includes(event)) {
      return NextResponse.json({ error: 'invalid_event' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const result = await sendLifecycleEmail({
      to,
      name,
      event,
      appUrl,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'send_failed',
      },
      { status: 500 }
    )
  }
}
