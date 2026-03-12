import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import type { SharedSessionPayload } from '@/lib/session-share'

export const runtime = 'nodejs'

type ShareRecord = {
  id: string
  created_at: string
  payload: SharedSessionPayload
}

export async function GET() {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, shares: [] }, { status: 200 })
  }
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from('workout_shares')
    .select('id, created_at, payload')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, shares: (data || []) as ShareRecord[] })
}
