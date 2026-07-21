/**
 * CodeLocation — the shared building block across all diagram kinds.
 *
 * A location points to a real, clickable piece of source code. Everything here is
 * optional except `file` so that partial locations still render; a node with only
 * `{ file }` is still clickable (it just opens the file without a line range).
 *
 * `repo` is a repo-relative or absolute path that, when present, overrides the
 * document-level `repo`. This lets one element live in a different repo without
 * breaking the rest of the diagram.
 */
import { z } from 'zod'

export const CodeLocationSchema = z
  .object({
    repo: z.string().min(1).optional().describe(
      'Optional override of the document-level repo path. May be relative or absolute.'
    ),
    file: z
      .string()
      .min(1)
      .describe('Repo-relative path to the source file, e.g. "server/controller/UserController.ts".'),
    startLine: z.number().int().optional().describe('1-based inclusive start line.'),
    endLine: z.number().int().optional().describe('1-based inclusive end line. If omitted, defaults to startLine.'),
    symbol: z
      .string()
      .min(1)
      .optional()
      .describe('Optional human-readable symbol name, e.g. "UserService.findAll" or "fetchUsers".'),
  })
  .passthrough()

export type CodeLocation = z.infer<typeof CodeLocationSchema>

/**
 * Given a node-level location and a document-level repo, resolve the effective
 * repo + file pair the GUI should open. Returns `repo` unchanged if the location
 * doesn't override it.
 */
export function resolveRepo(loc: CodeLocation | undefined, docRepo: string | undefined): string | undefined {
  if (loc?.repo) return loc.repo
  return docRepo
}

/**
 * Normalise an end line: if `startLine` is set but `endLine` is not, treat the
 * range as a single line.
 */
export function resolveLineRange(loc: CodeLocation | undefined): { start?: number; end?: number } {
  if (!loc) return {}
  const start = loc.startLine
  const end = loc.endLine ?? loc.startLine
  return { start, end }
}
