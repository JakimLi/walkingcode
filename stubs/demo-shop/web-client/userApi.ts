// web-client/userApi.ts
// UI layer: thin fetch helpers used by the React components.

export interface UserDTO {
  id: number
  name: string
  email: string
}

/**
 * fetchUsers — calls GET /api/users and returns the parsed list.
 * This is the entry point of the request flow we trace through the stack.
 */
export async function fetchUsers(): Promise<UserDTO[]> {
  const res = await fetch('/api/users')
  if (!res.ok) {
    throw new Error(`Failed to load users: ${res.status}`)
  }
  return (await res.json()) as UserDTO[]
}

/**
 * fetchUserById — single-record lookup by id.
 */
export async function fetchUserById(id: number): Promise<UserDTO> {
  const res = await fetch(`/api/users/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to load user ${id}: ${res.status}`)
  }
  return (await res.json()) as UserDTO
}
