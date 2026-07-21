/**
 * Resolve the Electron binary to launch, and the built main entry to load.
 *
 * Resolution order for the binary:
 *   1. $WALKINGCODE_ELECTRON (explicit override — handy in dev/tests)
 *   2. the `electron` package inside packages/app/node_modules (normal dev install)
 *   3. the hoisted `electron` package at the repo root
 *   4. fall back to `npx electron` (returns the string 'npx')
 *
 * For the app entry, we load the electron-vite dev server URL in dev mode, or
 * the built `packages/app/out/main/index.js` in production mode.
 */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** Repo root = four levels up from this file: cli/src/electron.ts -> cli/src -> cli -> packages -> repo. */
export const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..')
export const APP_PKG_DIR = join(REPO_ROOT, 'packages', 'app')
export const APP_BUILD_MAIN = join(APP_PKG_DIR, 'out', 'main', 'index.js')

export interface ElectronTarget {
  /** Path to the electron binary, or the literal 'npx' to fall through to `npx electron`. */
  binary: string
  /** The entry to pass electron: either a built JS file or a dev-server URL. */
  entry: string
  /** Whether we're in dev mode (loaded from the vite dev server). */
  dev: boolean
  /** Human-readable description for error messages. */
  description: string
}

/**
 * Resolve where to find electron and what entry to load. In dev mode we load the
 * vite dev server; otherwise the built main bundle.
 */
export function resolveElectron(opts: { dev?: boolean; devPort?: number } = {}): ElectronTarget {
  const dev = opts.dev ?? (!!process.env.WALKINGCODE_DEV && process.env.WALKINGCODE_DEV !== '0')
  const devPort = opts.devPort ?? Number(process.env.WALKINGCODE_DEV_PORT ?? 5173)

  const binary = resolveBinary()

  if (dev) {
    const entry = `http://localhost:${devPort}`
    return {
      binary,
      entry,
      dev: true,
      description: `electron (dev) -> ${entry}`,
    }
  }

  if (!existsSync(APP_BUILD_MAIN)) {
    throw new Error(
      `Built app entry not found at ${APP_BUILD_MAIN}.\n` +
        `Run \`npm run build:app\` first, or pass --dev to launch against the vite dev server.`
    )
  }
  return {
    binary,
    entry: APP_BUILD_MAIN,
    dev: false,
    description: `electron -> ${APP_BUILD_MAIN}`,
  }
}

function resolveBinary(): string {
  if (process.env.WALKINGCODE_ELECTRON && existsSync(process.env.WALKINGCODE_ELECTRON)) {
    return process.env.WALKINGCODE_ELECTRON
  }

  // 1. electron package inside packages/app/node_modules
  const candidates = [
    join(APP_PKG_DIR, 'node_modules', 'electron'),
    join(REPO_ROOT, 'node_modules', 'electron'),
  ]
  for (const c of candidates) {
    if (existsSync(c)) {
      try {
        // electron's package.json exposes the binary path via `require('electron')`
        // which returns a string path in Node (not in the electron runtime).
        const electronPath = require(c) as unknown
        if (typeof electronPath === 'string' && existsSync(electronPath)) {
          return electronPath
        }
      } catch {
        // fall through to next candidate
      }
    }
  }

  // last resort: hand off to npx
  return 'npx'
}

/** True if we'll have to invoke `npx electron` instead of a direct binary path. */
export function isNpxFallback(target: ElectronTarget): boolean {
  return target.binary === 'npx'
}
