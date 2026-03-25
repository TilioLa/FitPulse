import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      payload?: Record<string, unknown>
      at?: string
      path?: string
    }
    const name = (body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 })
    }

    // Centralized event stream in server logs (Vercel Log Drains compatible).
    console.info(
      '[fitpulse_analytics_event]',
      JSON.stringify({
        name,
        payload: body.payload || {},
        at: body.at || new Date().toISOString(),
        path: body.path || '',
      })
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }
}
