// server/repository/UserRepository.ts
// Repository layer: data access. Talks to the database (stubbed here).

export interface UserRow {
  id: number
  name: string
  email: string
}

// In a real app this is a connection pool / ORM client. We stub it with an
// in-memory array so the stack runs end-to-end without a database.
const TABLE: UserRow[] = [
  { id: 1, name: 'Ada Lovelace', email: 'ada@demo.dev' },
  { id: 2, name: 'Alan Turing', email: 'alan@demo.dev' },
  { id: 3, name: 'Grace Hopper', email: 'grace@example.com' },
]

export class UserRepository {
  /** SELECT * FROM users */
  async selectAll(): Promise<UserRow[]> {
    // pretend this round-trips to PostgreSQL
    return TABLE.slice()
  }

  /** SELECT * FROM users WHERE id = ? */
  async selectById(id: number): Promise<UserRow | null> {
    return TABLE.find((u) => u.id === id) ?? null
  }

  /** SELECT * FROM users WHERE email = ? */
  async findByEmail(email: string): Promise<UserRow | null> {
    return TABLE.find((u) => u.email === email) ?? null
  }
}
