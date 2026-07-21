// Preload bridge type — what `window.wc` exposes to the renderer.
//
// Kept in sync with packages/app/src/preload/index.ts. The renderer imports this
// for type-safety; the preload implements it via contextBridge.

import type { ParseResult } from '@wc-schema'
import type { Comment, CommentsFile } from '@wc-schema'

export interface CodeReadResult {
  ok: true
  file: string
  text: string
  totalLines: number
}

export interface CodeReadError {
  ok: false
  file: string
  message: string
}

export interface ArchLoadResult {
  /** Absolute path of the arch file the app was launched with. */
  archFile: string | null
  /** Parsed document + warnings, or a hard parse error. */
  parse: ParseResult
  /** Absolute path of the resolved repo root, if any. */
  repo: string | null
}

export interface WCApi {
  arch: {
    load: () => Promise<ArchLoadResult>
  }
  code: {
    read: (file: string, repo?: string) => Promise<CodeReadResult | CodeReadError>
  }
  comments: {
    read: () => Promise<CommentsFile>
    add: (input: { nodeId: string; body: string; line?: number }) => Promise<Comment>
    resolve: (id: string) => Promise<Comment | null>
  }
  /** Listen for app-level events from main (e.g. a new file was opened). */
  on: (event: 'reload', cb: () => void) => () => void
}

declare global {
  interface Window {
    wc: WCApi
  }
}

export {}
