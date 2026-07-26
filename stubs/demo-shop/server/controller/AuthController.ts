// server/controller/AuthController.ts
// Auth controller: HTTP handlers for login and token verification.

import type { Request, Response } from 'express'
import { AuthService } from '../service/AuthService.js'
import { TokenService } from '../service/TokenService.js'

export class AuthController {
  private auth = new AuthService()
  private tokens = new TokenService()

  /** POST /api/auth/login → { token } on success, 401 on bad credentials. */
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string }
    const result = await this.auth.authenticate(email, password)
    if (!result.ok) {
      res.status(401).json({ error: result.error })
      return
    }
    res.json({ token: result.token })
  }

  /** GET /api/auth/me → the current user from the bearer token. */
  async me(req: Request, res: Response): Promise<void> {
    const header = req.headers.authorization ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = this.tokens.verify(token)
    if (!payload) {
      res.status(401).json({ error: 'invalid or expired token' })
      return
    }
    res.json({ userId: payload.userId, email: payload.email })
  }
}
