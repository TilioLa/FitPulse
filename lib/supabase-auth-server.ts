import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

let authClient: SupabaseClient | null = null

type AuthenticatedApiUser =
  | { ok: true; user: User }
  | { ok: false; status: 401 | 500; error: string }

function getBearerToken(request: Request) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  const token = auth.slice(7).trim()
  return token || null
}

function getAuthClient() {
  if (authClient) return authClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  authClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return authClient
}

export async function getAuthenticatedApiUser(request: Request): Promise<AuthenticatedApiUser> {
  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, status: 401, error: 'missing_bearer_token' }
  }

  try {
    const supabase = getAuthClient()
    const { data, error } = await supabase.auth.getUser(token)
    if (error || !data.user?.email) {
      return { ok: false, status: 401, error: 'invalid_auth_token' }
    }
    return { ok: true, user: data.user }
  } catch (error) {
    return {
      ok: false,
      status: 500,
      error: error instanceof Error ? error.message : 'auth_check_failed',
    }
  }
}
