// web-client/authApi.ts
// Browser-side helpers for the auth flow: login() and fetchMe().

const BASE_URL = '/api/auth'

/** POST /api/auth/login with credentials → resolves to a JWT string. */
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(`login failed: ${res.status}`)
  }
  const data = (await res.json()) as { token: string }
  return data.token
}

/** GET /api/auth/me with a bearer token → the authenticated user profile. */
export async function fetchMe(token: string): Promise<{ userId: number; email: string }> {
  const res = await fetch(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`fetchMe failed: ${res.status}`)
  }
  return (await res.json()) as { userId: number; email: string }
}
