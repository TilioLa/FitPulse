import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'

type LogLevel = 'error' | 'warning' | 'info'

type LogPayload = {
  level: LogLevel
  message: string
  meta?: Record<string, unknown>
}

export async function logClientEvent(payload: LogPayload) {
  // Always keep browser console visibility for debugging.
  if (payload.level === 'error') {
    console.error(payload.message, payload.meta || {})
  } else if (payload.level === 'warning') {
    console.warn(payload.message, payload.meta || {})
  } else {
    console.info(payload.message, payload.meta || {})
  }

  if (!isSupabaseConfigured()) return
  try {
    const supabase = getSupabaseBrowserClient()
    await supabase.from('client_logs').insert({
      level: payload.level,
      message: payload.message,
      meta: payload.meta || {},
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      created_at: new Date().toISOString(),
    })
  } catch {
    // optional remote logging only
  }
}
