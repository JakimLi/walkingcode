// server/service/AuthService.ts
// Auth service: validates credentials and issues tokens via TokenService.

import { UserRepository, type UserRow } from '../repository/UserRepository.js'
import { TokenService } from './TokenService.js'

/** The result of an authentication attempt. */
export interface AuthResult {
  ok: boolean
  token?: string
  error?: string
}

/**
 * AuthService — orchestrates credential verification against the user store
 * and token issuance. Returns a signed token on success.
 */
export class AuthService {
  private users = new UserRepository()
  private tokens = new TokenService()

  /** Authenticate by email; returns a signed token or an error. */
  async authenticate(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email)
    if (!user) {
      return { ok: false, error: 'user not found' }
    }
    if (!this.checkPassword(user, password)) {
      return { ok: false, error: 'invalid password' }
    }
    const token = this.tokens.sign(user.id, user.email)
    return { ok: true, token }
  }

  // trivial password check for the stub — every user's password is "demo"
  private checkPassword(_user: UserRow, password: string): boolean {
    return password === 'demo'
  }
}
