/**
 * Comment anchored to a node (and optionally a line) in a diagram.
 *
 * Comments live in a sidecar file `<arch-file>.comments.json` so the agent can
 * read them back without touching the agent-authored description itself.
 */
import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string().min(1).describe('Stable comment id, e.g. "c-1".'),
  nodeId: z.string().min(1).describe('Composite node id the comment is anchored to.'),
  // optional line anchor within the node's file (not required for MVP)
  line: z.number().int().optional(),
  body: z.string().min(1),
  author: z.string().optional().default('user'),
  createdAt: z.string().describe('ISO 8601 timestamp.'),
  // status the agent can flip when it has addressed the comment
  status: z.enum(['open', 'resolved', 'wontfix']).optional().default('open'),
}).passthrough()
export type Comment = z.infer<typeof CommentSchema>

export const CommentsFileSchema = z.object({
  archFile: z.string().optional().describe('Path to the arch file this sidecar belongs to.'),
  comments: z.array(CommentSchema).optional().default([]),
}).passthrough()
export type CommentsFile = z.infer<typeof CommentsFileSchema>
