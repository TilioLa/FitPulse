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

type LeaderboardItem = {
  slug: string
  author: string
  sessions: number
  volume: number
  duration: number
  bestPrKg: number
}

async function fetchLeaderboardRowsSince(sinceIso: string): Promise<ShareRow[]> {
  const supabase = getSupabaseAdminClient()
  const pageSize = 1000
  const maxPages = 8
  const all: ShareRow[] = []

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize
    const to = from + pageSize - 1
    const { data, error } = await supabase
      .from('workout_shares')
      .select('id,payload,created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)
    const chunk = (data || []) as ShareRow[]
    all.push(...chunk)
    if (chunk.length < pageSize) break
  }

  return all
}

export async function GET(request: Request) {
  try {
    if (!isSupabaseAdminConfigured()) {
      return NextResponse.json({ ok: false, error: 'missing_supabase_admin_env' }, { status: 500 })
    }

    const url = new URL(request.url)
    const period = (url.searchParams.get('period') || 'week').toLowerCase()
    const sort = (url.searchParams.get('sort') || 'sessions').toLowerCase()
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 10)))

    const since = new Date()
    if (period === 'month') {
      since.setDate(since.getDate() - 30)
    } else {
      since.setDate(since.getDate() - 7)
    }

    const rows = await fetchLeaderboardRowsSince(since.toISOString())
    const map = new Map<string, LeaderboardItem>()
    for (const row of rows) {
      const slug = row?.payload?.authorSlug?.trim()
      const author = row?.payload?.author?.trim()
      if (!slug || !author) continue
      const existing = map.get(slug) || {
        slug,
        author,
        sessions: 0,
        volume: 0,
        duration: 0,
        bestPrKg: 0,
      }
      existing.sessions += 1
      existing.volume += Number(row.payload?.volume) || 0
      existing.duration += Number(row.payload?.duration) || 0
      existing.bestPrKg = Math.max(existing.bestPrKg, Number(row.payload?.bestPrKg) || 0)
      map.set(slug, existing)
    }

    const leaderboard = Array.from(map.values())
      .sort((a, b) => {
        if (sort === 'volume') {
          if (b.volume !== a.volume) return b.volume - a.volume
          if (b.sessions !== a.sessions) return b.sessions - a.sessions
          return b.bestPrKg - a.bestPrKg
        }
        if (sort === 'pr') {
          if (b.bestPrKg !== a.bestPrKg) return b.bestPrKg - a.bestPrKg
          if (b.sessions !== a.sessions) return b.sessions - a.sessions
          return b.volume - a.volume
        }
        if (b.sessions !== a.sessions) return b.sessions - a.sessions
        if (b.volume !== a.volume) return b.volume - a.volume
        return b.bestPrKg - a.bestPrKg
      })
      .slice(0, limit)
      .map((item) => ({
        ...item,
        volume: Math.round(item.volume),
        duration: Math.round(item.duration),
        bestPrKg: Math.round(item.bestPrKg),
      }))

    return NextResponse.json({
      ok: true,
      period,
      sort,
      since: since.toISOString(),
      leaderboard,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'leaderboard_failed' },
      { status: 500 }
    )
  }
}
