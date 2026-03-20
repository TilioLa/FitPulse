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
  try {
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
      const message = String(error.message || '')
      const missingTable =
        /workout_shares|relation .*workout_shares.*does not exist/i.test(message) ||
        String((error as { code?: string }).code || '').toUpperCase().startsWith('PGRST')

      if (missingTable) {
        return NextResponse.json({ ok: false, shares: [] }, { status: 200 })
      }

      // Keep this endpoint resilient: it powers a non-critical homepage/community widget.
      return NextResponse.json({ ok: false, shares: [] }, { status: 200 })
    }

    return NextResponse.json({ ok: true, shares: (data || []) as ShareRecord[] })
  } catch {
    return NextResponse.json({ ok: false, shares: [] }, { status: 200 })
  }
}
