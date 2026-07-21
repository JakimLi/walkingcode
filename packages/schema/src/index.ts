/**
 * @walkingcode/schema — public entry point.
 *
 * Exports the tolerant schemas and a `parseDocument` that dispatches on `kind`.
 * The parser is deliberately forgiving: it coerces missing fields to defaults
 * and returns a structured result (`ParseResult`) so the GUI can render whatever
 * it managed to understand plus surface what it couldn't.
 */
import { z } from 'zod'
import { LayeredDocumentSchema, type LayeredDocument } from './layered.js'
import { SequenceDocumentSchema, type SequenceDocument } from './sequence.js'
import { CodeLocationSchema, type CodeLocation, resolveLineRange, resolveRepo } from './location.js'
import {
  CommentSchema,
  CommentsFileSchema,
  type Comment,
  type CommentsFile,
} from './comments.js'

export * from './layered.js'
export * from './sequence.js'
export * from './location.js'
export * from './comments.js'

export type AnyDocument = LayeredDocument | SequenceDocument

/** Supported diagram `kind` discriminators. */
export const SUPPORTED_KINDS = ['layered', 'sequence'] as const
export type SupportedKind = (typeof SUPPORTED_KINDS)[number]

/**
 * A warning about a single field path that failed validation but was coerced
 * instead of aborting the parse. Surfaced in the UI so users (and agents) know
 * what got dropped.
 */
export interface ParseWarning {
  /** Dotted path within the document, e.g. "layers[0].modules[1].elements[2].location". */
  path: string
  message: string
}

export interface ParseOk<T> {
  ok: true
  document: T
  warnings: ParseWarning[]
}

export interface ParseErr {
  ok: false
  /** Top-level error message for display. */
  message: string
  warnings: ParseWarning[]
  issues: { path: string; message: string }[]
}

export type ParseResult<T = AnyDocument> = ParseOk<T> | ParseErr

/**
 * Parse an unknown object as a WalkingCode document.
 *
 * Strategy:
 *   1. Read `kind`. If missing or unknown → hard error.
 *   2. Run the kind-specific zod schema with `coerce`-friendly defaults. On
 *      success, also run a separate "loose" pass to collect non-fatal warnings
 *      for fields that exist but look malformed (we keep them as warnings,
 *      never fatal).
 *   3. Return `{ ok, document, warnings }` or `{ ok: false, issues }`.
 *
 * The schemas themselves default almost everything, so the common path through
 * zod is already tolerant. The extra warnings pass is where we'd catch things
 * like a `location.startLine` of 0 (which we coerce instead of erroring).
 */
export function parseDocument(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null) {
    return err('Document must be a JSON object.', [], [])
  }
  const kind = (input as { kind?: unknown }).kind
  if (typeof kind !== 'string' || !SUPPORTED_KINDS.includes(kind as SupportedKind)) {
    return err(
      `Unknown or missing "kind". Expected one of: ${SUPPORTED_KINDS.join(', ')}.`,
      [],
      []
    )
  }

  if (kind === 'layered') {
    const result = LayeredDocumentSchema.safeParse(input)
    if (!result.success) {
      return err('Layered document failed validation.', [], fromZodError(result.error))
    }
    const warnings = collectWarnings(input)
    return { ok: true, document: result.data as LayeredDocument, warnings }
  }

  if (kind === 'sequence') {
    const result = SequenceDocumentSchema.safeParse(input)
    if (!result.success) {
      return err('Sequence document failed validation.', [], fromZodError(result.error))
    }
    return { ok: true, document: result.data as SequenceDocument, warnings: [] }
  }

  // unreachable — kind already validated
  return err(`Unsupported kind: ${String(kind)}`, [], [])
}

/**
 * Best-effort loose validation that scans for malformed-but-present fields we
 * coerced rather than rejected. Today this is light; extend as we add strictness.
 */
function collectWarnings(input: unknown): ParseWarning[] {
  const warnings: ParseWarning[] = []
  if (typeof input !== 'object' || input === null) return warnings
  const doc = input as Record<string, unknown>
  const layers = Array.isArray(doc.layers) ? doc.layers : []
  layers.forEach((layer, li) => {
    if (typeof layer !== 'object' || layer === null) return
    const modules = Array.isArray((layer as Record<string, unknown>).modules)
      ? ((layer as Record<string, unknown>).modules as unknown[])
      : []
    modules.forEach((mod, mi) => {
      if (typeof mod !== 'object' || mod === null) return
      const m = mod as Record<string, unknown>
      const loc = m.location
      if (loc !== undefined) {
        const w = checkLocation(loc)
        if (w) warnings.push({ path: `layers[${li}].modules[${mi}].location`, message: w })
      }
      const elements = Array.isArray(m.elements) ? (m.elements as unknown[]) : []
      elements.forEach((el, ei) => {
        if (typeof el !== 'object' || el === null) return
        const eLoc = (el as Record<string, unknown>).location
        if (eLoc !== undefined) {
          const w = checkLocation(eLoc)
          if (w) warnings.push({ path: `layers[${li}].modules[${mi}].elements[${ei}].location`, message: w })
        }
      })
    })
  })
  return warnings
}

function checkLocation(loc: unknown): string | null {
  if (typeof loc !== 'object' || loc === null) return 'location must be an object'
  const l = loc as Record<string, unknown>
  if (l.startLine !== undefined && (typeof l.startLine !== 'number' || l.startLine < 1)) {
    return `startLine must be a positive integer, got ${JSON.stringify(l.startLine)}`
  }
  if (l.endLine !== undefined && (typeof l.endLine !== 'number' || l.endLine < 1)) {
    return `endLine must be a positive integer, got ${JSON.stringify(l.endLine)}`
  }
  return null
}

function fromZodError(error: z.ZodError): { path: string; message: string }[] {
  return error.issues.map((i) => ({ path: i.path.join('.') || '(root)', message: i.message }))
}

function err(message: string, warnings: ParseWarning[], issues: { path: string; message: string }[]): ParseErr {
  return { ok: false, message, warnings, issues }
}

/** Parse the sidecar comments file. Missing file → empty comments. */
export function parseCommentsFile(input: unknown): CommentsFile {
  const result = CommentsFileSchema.safeParse(input)
  if (!result.success) return { comments: [] }
  return result.data
}

// Re-export helpers so consumers don't need a second import.
export { resolveRepo, resolveLineRange }

/** Convenience: validate an unknown value as a CodeLocation (used by the GUI). */
export function isCodeLocation(v: unknown): v is CodeLocation {
  return CodeLocationSchema.safeParse(v).success
}

/** Convenience: is the given value a valid Comment? */
export function isComment(v: unknown): v is Comment {
  return CommentSchema.safeParse(v).success
}
