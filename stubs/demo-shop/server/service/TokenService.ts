// server/service/TokenService.ts
// Token service: signs and verifies JWT-like tokens for authenticated sessions.

/** A decoded token payload returned by verify(). */
export interface TokenPayload {
  userId: number
  email: string
  exp: number
}

/**
 * TokenService — in a real app this wraps a JWT library; here it uses a
 * trivial base64 encoding so the stub is self-contained.
 */
export class TokenService {
  private readonly secret = 'demo-secret'
  private readonly ttlSeconds = 3600

  /** Sign a payload into an opaque token string. */
  sign(userId: number, email: string): string {
    const payload: TokenPayload = {
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + this.ttlSeconds,
    }
    return this.encode(payload)
  }

  /** Verify a token, returning the payload or null if invalid/expired. */
  verify(token: string): TokenPayload | null {
    try {
      const payload = this.decode(token)
      if (!payload) return null
      if (payload.exp < Math.floor(Date.now() / 1000)) return null
      return payload
    } catch {
      return null
    }
  }

  private encode(payload: TokenPayload): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  private decode(token: string): TokenPayload | null {
    const json = Buffer.from(token, 'base64').toString('utf8')
    return JSON.parse(json) as TokenPayload
  }
}
