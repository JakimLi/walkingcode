/**
 * Sequence diagram schema (v1).
 *
 * Mental model:
 *   Document
 *     └── Participant[]   (actors across the top, each owning a lifeline)
 *     └── Message[]       (ordered interactions between participants; time flows top→down)
 *
 * Participants and messages both carry an optional CodeLocation so the diagram
 * stays clickable — the same contract as `layered`. Clicking a participant opens
 * the file it lives in; clicking a message opens the exact line where the call
 * happens.
 *
 * Tolerance: every field except `kind` is optional. `from`/`to` reference a
 * participant by its bare `id` (flat — no composite path). Missing `order`
 * falls back to array order.
 */
import { z } from 'zod'
import { CodeLocationSchema } from './location.js'

/** A participant is one actor/service in the sequence, drawn as a lifeline. */
export const ParticipantSchema = z.object({
  id: z.string().min(1).describe('Stable id unique within the document. Referenced by Message.from/to.'),
  name: z.string().min(1).optional().describe('Display name. Defaults to id.'),
  kind: z
    .enum(['actor', 'service', 'database', 'client', 'external', 'other'])
    .optional()
    .default('other')
    .describe('Participant type — controls the icon and lifeline style.'),
  description: z.string().optional(),
  location: CodeLocationSchema.optional().describe('Where this participant lives in source, e.g. the controller file.'),
  tags: z.array(z.string()).optional(),
}).passthrough()
export type Participant = z.infer<typeof ParticipantSchema>

/**
 * A message is one interaction between two participants. `order` controls
 * vertical position (time flows top→down); the renderer also appends an implicit
 * order from array position when `order` is omitted.
 */
export const MessageSchema = z.object({
  id: z.string().min(1).optional().describe('Optional stable id. Defaults to a synthesised `from->to#n`.'),
  from: z.string().min(1).describe('Participant id the message originates from.'),
  to: z.string().min(1).describe('Participant id the message is sent to.'),
  label: z.string().optional().describe('Message label, e.g. "login(email, pwd)" or "200 OK".'),
  kind: z
    .enum(['call', 'return', 'event', 'async', 'other'])
    .optional()
    .default('call')
    .describe('Message kind — controls arrow style (solid/dashed, sync/async).'),
  description: z.string().optional(),
  location: CodeLocationSchema.optional().describe('Where this call happens in source, e.g. the line that invokes the target.'),
  order: z
    .number()
    .int()
    .optional()
    .describe('Render order (vertical). Lower = higher. Falls back to array order if omitted.'),
  tags: z.array(z.string()).optional(),
}).passthrough()
export type Message = z.infer<typeof MessageSchema>

export const SequenceDocumentSchema = z.object({
  $schema: z.string().optional(),
  kind: z.literal('sequence').describe('Discriminator — must be the literal "sequence".'),
  schemaVersion: z.string().optional().default('v1'),
  repo: z
    .string()
    .optional()
    .describe('Default repo path (relative to the arch file or absolute). Overridden by CodeLocation.repo.'),
  title: z.string().optional(),
  description: z.string().optional(),
  participants: z.array(ParticipantSchema).optional().default([]),
  messages: z.array(MessageSchema).optional().default([]),
  // free-form metadata for agents (e.g. generation timestamp, model, prompt hash)
  meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough()
export type SequenceDocument = z.infer<typeof SequenceDocumentSchema>
