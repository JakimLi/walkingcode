/**
 * Sequence diagram schema — STUB for a later iteration.
 *
 * The MVP ships only `layered`. This file exists so the renderer can branch on
 * `kind` cleanly and so the schema package can enumerate supported kinds. The
 * shape here is a sketch, not a contract; it will change when implemented.
 *
 * Intended shape (not yet enforced):
 *   Document
 *     └── Participant[]   (id, name, location?)
 *     └── Messages[]      (from, to, label, location?, order)
 *
 * Every participant and message will carry a CodeLocation so the diagram stays
 * clickable, same contract as layered.
 */
import { z } from 'zod'

export const SequenceDocumentSchema = z.object({
  $schema: z.string().optional(),
  kind: z.literal('sequence'),
  schemaVersion: z.string().optional().default('v1-draft'),
  repo: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  // reserved fields — intentionally not validated yet
  participants: z.array(z.any()).optional(),
  messages: z.array(z.any()).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough()

export type SequenceDocument = z.infer<typeof SequenceDocumentSchema>
