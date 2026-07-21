/**
 * Layered architecture schema (v1).
 *
 * Mental model:
 *   Document
 *     └── Layer[]           (vertical bands, e.g. UI / Controller / Service / Repository)
 *           └── Module[]    (logical units inside a layer, e.g. "Web Client" or "UserController")
 *                 └── Element[] (functions / classes / handlers inside a module)
 *
 * Edges connect any two nodes by their composite id, e.g.
 *   "ui/web-client"                       → module
 *   "ui/web-client/fetchUsers"            → element
 *   "repository/UserRepository"           → module
 *
 * Edges use a stable composite-id format: layerId[/moduleId[/elementId]].
 *
 * Tolerance: every field except `kind` is optional. The renderer degrades
 * gracefully — a node without a location is non-clickable; a document without
 * edges just shows nodes; missing `order` falls back to array order.
 */
import { z } from 'zod'
import { CodeLocationSchema } from './location.js'

/** A leaf element inside a module: a function, class, handler, etc. */
export const ElementSchema = z.object({
  id: z.string().min(1).describe('Stable id unique within its module.'),
  name: z.string().min(1).optional().describe('Display name. Defaults to id.'),
  kind: z
    .enum(['function', 'class', 'method', 'interface', 'type', 'handler', 'hook', 'component', 'other'])
    .optional()
    .default('other'),
  description: z.string().optional(),
  location: CodeLocationSchema.optional(),
  // free-form tags the GUI may badge (e.g. ["async", "public"])
  tags: z.array(z.string()).optional(),
}).passthrough()
export type Element = z.infer<typeof ElementSchema>

/** A module is the unit that groups elements inside a layer. */
export const ModuleSchema = z.object({
  id: z.string().min(1).describe('Stable id unique within its layer.'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  location: CodeLocationSchema.optional().describe('Optional module-level location, e.g. the file the module lives in.'),
  elements: z.array(ElementSchema).optional().default([]),
  tags: z.array(z.string()).optional(),
}).passthrough()
export type Module = z.infer<typeof ModuleSchema>

/** A layer is a horizontal/vertical band of the layered diagram. */
export const LayerSchema = z.object({
  id: z.string().min(1).describe('Stable id unique within the document.'),
  name: z.string().min(1).optional().describe('Display name, e.g. "Service Layer". Defaults to id.'),
  order: z
    .number()
    .int()
    .optional()
    .describe('Render order. Lower = higher in the stack (UI on top). Falls back to array order if omitted.'),
  description: z.string().optional(),
  modules: z.array(ModuleSchema).optional().default([]),
  tags: z.array(z.string()).optional(),
}).passthrough()
export type Layer = z.infer<typeof LayerSchema>

/** An edge expresses a dependency, call, data flow, or event between two nodes. */
export const EdgeSchema = z.object({
  from: z.string().min(1).describe('Composite node id, e.g. "ui/web-client".'),
  to: z.string().min(1).describe('Composite node id.'),
  label: z.string().optional().describe('Edge label, e.g. "HTTP /api/users".'),
  kind: z
    .enum(['call', 'data', 'event', 'depends', 'implements', 'extends', 'uses', 'other'])
    .optional()
    .default('uses'),
  description: z.string().optional(),
  // an optional location pinning where the call/relationship happens in source
  location: CodeLocationSchema.optional(),
}).passthrough()
export type Edge = z.infer<typeof EdgeSchema>

/** A standalone external node referenced by edges but not inside any layer. */
export const ExternalNodeSchema = z.object({
  id: z.string().min(1).describe('Stable id unique within the document.'),
  name: z.string().min(1).optional(),
  kind: z.enum(['store', 'queue', 'external-service', 'cdn', 'other']).optional().default('other'),
  description: z.string().optional(),
  location: CodeLocationSchema.optional(),
  tags: z.array(z.string()).optional(),
}).passthrough()
export type ExternalNode = z.infer<typeof ExternalNodeSchema>

export const LayeredDocumentSchema = z.object({
  $schema: z.string().optional(),
  kind: z.literal('layered').describe('Discriminator — must be the literal "layered".'),
  schemaVersion: z.string().optional().default('v1'),
  repo: z
    .string()
    .optional()
    .describe('Default repo path (relative to the arch file or absolute). Overridden by CodeLocation.repo.'),
  title: z.string().optional(),
  description: z.string().optional(),
  layers: z.array(LayerSchema).optional().default([]),
  externalNodes: z.array(ExternalNodeSchema).optional().default([]),
  edges: z.array(EdgeSchema).optional().default([]),
  // free-form metadata for agents (e.g. generation timestamp, model, prompt hash)
  meta: z.record(z.string(), z.unknown()).optional(),
}).passthrough()
export type LayeredDocument = z.infer<typeof LayeredDocumentSchema>

/** Composite id helpers — the format used in `Edge.from`/`Edge.to`. */
export function makeNodeId(layerId: string, moduleId?: string, elementId?: string): string {
  return [layerId, moduleId, elementId].filter(Boolean).join('/')
}
