import { NextResponse } from 'next/server'
import { sendSignupConfirmationEmail } from '@/lib/signup-confirmation-email'

export const runtime = 'nodejs'

type Payload = {
  to?: string
  name?: string | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Payload
    const to = body?.to?.trim().toLowerCase() || ''
    const name = body?.name || null

    if (!to || !to.includes('@')) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const result = await sendSignupConfirmationEmail({
      to,
      name,
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
