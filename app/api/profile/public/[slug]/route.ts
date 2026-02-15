import { NextResponse } from 'next/server'
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase-admin'
import type { SharedSessionPayload } from '@/lib/session-share'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ShareRow = {
  id: string
  payload: SharedSessionPayload
  created_at?: string
}

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: 'missing_supabase_admin_env' }, { status: 500 })
    }

    const resolved = typeof (params as Promise<unknown>)?.then === 'function'
      ? await (params as Promise<{ slug: string }>)
      : (params as { slug: string })
    const slug = decodeURIComponent(resolved?.slug || '').trim().toLowerCase()
    if (!slug) {
      return NextResponse.json({ ok: false, error: 'invalid_slug' }, { status: 400 })
    }

    const supabase = getSupabaseAdminClient()
    const { data, error } = await supabase
      .from('workout_shares')
      .select('id,payload,created_at')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    const rows = ((data || []) as ShareRow[]).filter(
      (row) => row?.payload?.authorSlug?.toLowerCase() === slug
    )

    if (rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 })
    }

    const author = rows[0]?.payload?.author || 'Athlète FitPulse'
    const totalShares = rows.length
    const totalVolume = Math.round(rows.reduce((sum, row) => sum + (Number(row.payload?.volume) || 0), 0))
    const totalDuration = Math.round(rows.reduce((sum, row) => sum + (Number(row.payload?.duration) || 0), 0))
    const bestPrKg = Math.round(
      rows.reduce((max, row) => Math.max(max, Number(row.payload?.bestPrKg) || 0), 0)
    )
    const sessions = rows.slice(0, 12).map((row) => ({
      id: row.id,
      date: row.payload.date,
      workoutName: row.payload.workoutName,
      duration: row.payload.duration,
      volume: row.payload.volume,
      calories: row.payload.calories,
      bestPrKg: row.payload.bestPrKg || 0,
      muscleUsage: row.payload.muscleUsage || [],
    }))

    return NextResponse.json({
      ok: true,
      profile: {
        slug,
        author,
        totalShares,
        totalVolume,
        totalDuration,
        bestPrKg,
        sessions,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'profile_failed' },
      { status: 500 }
    )
  }
}
