// server/controller/UserController.ts
// Controller layer: HTTP handlers. Translates requests into service calls.

import type { Request, Response } from 'express'
import { UserService } from '../service/UserService.js'

export class UserController {
  // injected in a real app; constructed here for the stub
  private service = new UserService()

  /** GET /api/users → list all users. */
  async listUsers(_req: Request, res: Response): Promise<void> {
    const users = await this.service.findAll()
    res.json(users)
  }

  /** GET /api/users/:id → one user. */
  async getUser(req: Request, res: Response): Promise<void> {
    const id = Number(req.params.id)
    const user = await this.service.findById(id)
    if (!user) {
      res.status(404).json({ error: 'not found' })
      return
    }
    res.json(user)
  }
}
