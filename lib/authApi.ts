type AuthResponse = {
  id: string
  email: string
  name: string
  phone?: string | null
  createdAt: string
}

async function postAuth(endpoint: string, payload: Record<string, string>): Promise<AuthResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data?.error || 'Erreur serveur')
  }

  return response.json()
}

export async function registerUser(name: string, email: string, password: string, phone?: string) {
  return postAuth('/api/auth/register', { name, email, password, phone })
}
