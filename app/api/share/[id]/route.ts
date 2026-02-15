import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: 'missing_supabase_admin_env' }, { status: 500 })
    }
    const resolved = typeof (params as Promise<unknown>)?.then === 'function'
      ? await (params as Promise<{ id: string }>)
      : (params as { id: string })
    const id = decodeURIComponent(resolved?.id || '').trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'invalid_id' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('workout_shares')
      .select('payload')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
    if (!data?.payload) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, session: data.payload })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'read_failed' },
      { status: 500 }
    )
  }
}
