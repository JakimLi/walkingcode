/**
 * Parse the argv the CLI passes when spawning electron.
 *
 * Expected shape (from packages/cli/src/commands/open.ts):
 *   electron <entry> <archFile> [--repo <repo>] [--dev]
 *
 * Electron's argv looks like:
 *   [electron-binary, <entry>, <archFile>, ...flags]
 * so process.argv[1] is the entry, process.argv[2] is the arch file.
 *
 * For dev mode the entry is a URL; the arch file still follows. We also accept
 * the arch file as a `--arch-file <path>` flag for flexibility.
 *
 * Dev fallback: `npm run dev` (bare `electron-vite dev`) launches electron with
 * no arch file. Rather than show an error, we fall back to the bundled example
 * (examples/layered-arch.json) so the app is immediately useful. A path passed
 * via argv or --arch-file always wins.
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface LaunchArgs {
  archFile: string | null
  repo: string | null
  dev: boolean
}

/** Relative path (from the repo root) of the bundled example arch file. */
export const DEV_DEFAULT_ARCH = 'examples/layered-arch.json'

/**
 * Find the bundled example arch file by walking up from a set of candidate base
 * dirs (cwd, this module) until `examples/layered-arch.json` exists. Returns an
 * absolute path or null if not found.
 */
export function resolveDevDefaultArch(): string | null {
  const bases: string[] = []
  if (typeof process !== 'undefined' && process.cwd) bases.push(process.cwd())
  try {
    // __dirname works under CJS (electron-vite output); fileURLToPath covers ESM.
    const here = typeof __dirname !== 'undefined'
      ? __dirname
      : fileURLToPath(import.meta.url)
    bases.push(here)
  } catch {
    /* ignore */
  }
  for (const base of bases) {
    // from packages/app: ../../examples ; from out/main: ../../../examples
    // walk up a few levels to be robust to where the bundle lives.
    let dir = base
    for (let depth = 0; depth < 6; depth++) {
      const candidate = join(dir, DEV_DEFAULT_ARCH)
      if (existsSync(candidate)) return candidate
      const parent = join(dir, '..')
      if (parent === dir) break // reached filesystem root
      dir = parent
    }
  }
  return null
}

export function parseLaunchArgs(argv: string[] = process.argv, env: NodeJS.ProcessEnv = process.env): LaunchArgs {
  const args = argv.slice(2) // drop node + script
  let archFile: string | null = null
  let repo: string | null = null
  let dev = false

  // First positional that looks like a path is the arch file (CLI passes it as such).
  const positionals: string[] = []
  for (let i = 0; i < args.length; i++) {
    const a = args[i]
    if (a === '--repo') {
      repo = args[++i] ?? null
      continue
    }
    if (a === '--arch-file') {
      archFile = args[++i] ?? null
      continue
    }
    if (a === '--dev') {
      dev = true
      continue
    }
    // skip the dev-server URL (a http://... positional that electron-vite adds)
    if (a.startsWith('http://') || a.startsWith('https://')) continue
    // skip electron inspector / other flags
    if (a.startsWith('--')) continue
    positionals.push(a)
  }

  if (!archFile && positionals.length > 0) {
    archFile = positionals[0]
  }

  // env fallbacks
  if (!repo && env.WALKINGCODE_REPO) repo = env.WALKINGCODE_REPO
  if (env.WALKINGCODE_DEV && env.WALKINGCODE_DEV !== '0') dev = true
  // electron-vite sets ELECTRON_RENDERER_URL only in dev mode
  if (env.ELECTRON_RENDERER_URL) dev = true

  // dev fallback: no arch file provided → use the bundled example
  if (!archFile && dev) {
    archFile = resolveDevDefaultArch()
  }

  return { archFile, repo, dev }
}
