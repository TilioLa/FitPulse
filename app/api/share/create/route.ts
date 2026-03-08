import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import type { SharedSessionPayload } from '@/lib/session-share'
import { getAuthenticatedApiUser } from '@/lib/supabase-auth-server'
import { slugify } from '@/lib/slug'

export const runtime = 'nodejs'

type Payload = {
  session?: SharedSessionPayload
}

function isValidSessionPayload(value: unknown): value is SharedSessionPayload {
  if (!value || typeof value !== 'object') return false
  const item = value as SharedSessionPayload
  return Boolean(item.workoutName && item.date && Array.isArray(item.muscleUsage))
}

export async function POST(request: Request) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: 'missing_supabase_admin_env' }, { status: 500 })
    }

    const auth = await getAuthenticatedApiUser(request)
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status })
    }

    const body = (await request.json().catch(() => ({}))) as Payload
    const session = body?.session
    if (!isValidSessionPayload(session)) {
      return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
    }

    const metadata = (auth.user.user_metadata || {}) as { full_name?: string | null }
    const fallbackName = auth.user.email?.split('@')[0] || 'Utilisateur FitPulse'
    const author = (metadata.full_name || fallbackName).trim() || 'Utilisateur FitPulse'
    const authorSlug = `${slugify(author) || 'athlete'}-${auth.user.id.slice(0, 6)}`
    const normalizedSession: SharedSessionPayload = {
      ...session,
      author,
      authorSlug,
    }

    const id = randomUUID().replace(/-/g, '').slice(0, 12)
    const supabase = getSupabaseAdminClient()
    const { error } = await supabase.from('workout_shares').insert({
      id,
      payload: normalizedSession,
      created_at: new Date().toISOString(),
    })
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'create_failed' },
      { status: 500 }
    )
  }
}
