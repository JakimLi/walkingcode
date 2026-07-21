/**
 * IPC handlers + session state for the main process.
 *
 * Session holds the launch config + parsed document. Handlers:
 *   arch:load       -> { archFile, repo, parse: ParseResult }
 *   code:read       -> file text (resolves repo-relative paths)
 *   comments:read   -> CommentsFile (from sidecar)
 *   comments:add    -> Comment (append + persist)
 *   comments:resolve-> Comment (flip status)
 *
 * File resolution: repo paths in the document are relative to the *arch file's
 * directory*. We resolve them to absolute paths before reading, and refuse to
 * read anything that escapes the repo root (best-effort sandbox for the MVP).
 */
import { ipcMain, type BrowserWindow } from 'electron'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve, relative, sep } from 'node:path'
import {
  parseDocument,
  parseCommentsFile,
  type Comment,
  type CommentsFile,
  type LayeredDocument,
  type ParseResult,
} from '@walkingcode/schema'
import { commentsPathFor } from './sidecar.js'
import { newCommentId } from './ids.js'

export interface Session {
  archFile: string | null
  /** Effective repo root, resolved absolute. */
  repo: string | null
  parse: ParseResult
}

let session: Session | null = null

export function setSession(s: Session): void {
  session = s
}

export function getSession(): Session | null {
  return session
}

/**
 * Initialise the session from launch args: read the arch file, parse it
 * tolerantly, resolve the repo root.
 */
export function initSession(opts: { archFile: string | null; repoOverride?: string | null }): Session {
  const archFile = opts.archFile && existsSync(opts.archFile) ? resolve(opts.archFile) : null

  let parse: ParseResult
  let docRepo: string | undefined

  if (archFile) {
    const raw = JSON.parse(readFileSync(archFile, 'utf8'))
    parse = parseDocument(raw)
    if (parse.ok) {
      docRepo = parse.document.repo
    }
  } else {
    parse = { ok: false, message: 'No arch file was provided on launch.', warnings: [], issues: [] }
  }

  const repo = resolveRepoRoot({
    archFile,
    override: opts.repoOverride ?? null,
    docRepo,
  })

  const s: Session = { archFile, repo, parse }
  setSession(s)
  return s
}

/**
 * Resolve the repo root. Priority: explicit override > doc's `repo` field.
 * Doc-relative paths are resolved against the arch file's directory.
 */
function resolveRepoRoot(input: {
  archFile: string | null
  override: string | null
  docRepo?: string
}): string | null {
  const candidate = input.override ?? input.docRepo
  if (!candidate) return null
  const base = input.archFile ? dirname(input.archFile) : process.cwd()
  const abs = isAbsolute(candidate) ? candidate : resolve(base, candidate)
  return existsSync(abs) ? abs : null
}

/** Resolve a repo-relative file path to absolute, guarding against path escape. */
function resolveCodePath(file: string, locRepo?: string): { ok: true; abs: string } | { ok: false; message: string } {
  const s = session
  if (!s) return { ok: false, message: 'No active session.' }
  // location.repo override wins, then doc repo, then arch-file dir
  let root = s.repo
  if (locRepo) {
    root = isAbsolute(locRepo) ? locRepo : resolve(dirname(s.archFile ?? process.cwd()), locRepo)
    root = existsSync(root) ? root : root
  }
  if (!root) return { ok: false, message: `No repo root resolved; cannot locate "${file}".` }

  // file may itself be absolute
  const abs = isAbsolute(file) ? file : join(root, file)

  // path-escape guard: must be inside root
  const rel = relative(root, abs)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { ok: false, message: `Path "${file}" escapes repo root.` }
  }
  if (!existsSync(abs)) return { ok: false, message: `File not found: ${file}` }
  return { ok: true, abs }
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  ipcMain.handle('arch:load', () => {
    const s = session
    if (!s) return { archFile: null, repo: null, parse: { ok: false, message: 'No session.' } }
    return { archFile: s.archFile, repo: s.repo, parse: s.parse }
  })

  ipcMain.handle('code:read', (_e, file: string, locRepo?: string) => {
    const resolved = resolveCodePath(file, locRepo)
    if (!resolved.ok) {
      return { ok: false as const, file, message: resolved.message }
    }
    try {
      const text = readFileSync(resolved.abs, 'utf8')
      const totalLines = text.split('\n').length
      return { ok: true as const, file, text, totalLines }
    } catch (err) {
      return { ok: false as const, file, message: (err as Error).message }
    }
  })

  ipcMain.handle('comments:read', () => {
    const s = session
    if (!s?.archFile) return { comments: [] } satisfies CommentsFile
    const sidecar = commentsPathFor(s.archFile)
    if (!existsSync(sidecar)) return { comments: [] } satisfies CommentsFile
    try {
      const raw = JSON.parse(readFileSync(sidecar, 'utf8'))
      return parseCommentsFile(raw)
    } catch {
      return { comments: [] } satisfies CommentsFile
    }
  })

  ipcMain.handle('comments:add', (_e, input: { nodeId: string; body: string; line?: number }) => {
    const s = session
    if (!s?.archFile) throw new Error('No active arch file.')
    if (!input.body?.trim()) throw new Error('Comment body is required.')
    const sidecar = commentsPathFor(s.archFile)
    const current = existsSync(sidecar)
      ? parseCommentsFile(JSON.parse(readFileSync(sidecar, 'utf8')))
      : { comments: [] }
    const comment: Comment = {
      id: newCommentId(current.comments),
      nodeId: input.nodeId,
      body: input.body,
      line: input.line,
      author: 'user',
      createdAt: new Date().toISOString(),
      status: 'open',
    }
    const next: CommentsFile = { archFile: s.archFile, comments: [...current.comments, comment] }
    mkdirSync(dirname(sidecar), { recursive: true })
    writeFileSync(sidecar, JSON.stringify(next, null, 2), 'utf8')
    return comment
  })

  ipcMain.handle('comments:resolve', (_e, id: string) => {
    const s = session
    if (!s?.archFile) return null
    const sidecar = commentsPathFor(s.archFile)
    if (!existsSync(sidecar)) return null
    const current = parseCommentsFile(JSON.parse(readFileSync(sidecar, 'utf8')))
    let updated: Comment | null = null
    const comments = current.comments.map((c) => {
      if (c.id === id) {
        updated = { ...c, status: c.status === 'resolved' ? 'open' : 'resolved' }
        return updated
      }
      return c
    })
    if (!updated) return null
    writeFileSync(sidecar, JSON.stringify({ ...current, comments }, null, 2), 'utf8')
    return updated
  })

  // unused in MVP but kept so main can notify renderer of a reload
  void getWindow
}

/** Convenience accessor for tests. */
export function peekDocument(): LayeredDocument | null {
  const s = session
  if (s?.parse.ok) return s.parse.document as LayeredDocument
  return null
}
