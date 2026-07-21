/** Generate a stable, unique comment id like "c-1", "c-2", ... */
import type { Comment } from '@walkingcode/schema'

export function newCommentId(existing: Comment[]): string {
  let max = 0
  for (const c of existing) {
    const m = /^c-(\d+)$/.exec(c.id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `c-${max + 1}`
}
