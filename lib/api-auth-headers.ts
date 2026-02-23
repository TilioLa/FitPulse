import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase-browser'

export async function buildAuthenticatedJsonHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (!isSupabaseConfigured()) return headers

  try {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // continue without auth header; protected APIs will reject unauthenticated requests
  }

  return headers
}
