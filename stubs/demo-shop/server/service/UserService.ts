// server/service/UserService.ts
// Service layer: business logic. Orchestrates repository calls and applies rules.

import { UserRepository } from '../repository/UserRepository.js'

export interface User {
  id: number
  name: string
  email: string
  // derived flag, set by the service — not stored
  isActive: boolean
}

export class UserService {
  private repo = new UserRepository()

  /** Return all users, tagged with an `isActive` rule. */
  async findAll(): Promise<User[]> {
    const rows = await this.repo.selectAll()
    return rows.map((u) => ({ ...u, isActive: this.computeActive(u.email) }))
  }

  /** Return one user by id, or null. */
  async findById(id: number): Promise<User | null> {
    const row = await this.repo.selectById(id)
    if (!row) return null
    return { ...row, isActive: this.computeActive(row.email) }
  }

  /** A trivial business rule: emails ending in @demo.dev are "active". */
  private computeActive(email: string): boolean {
    return email.endsWith('@demo.dev')
  }
}
