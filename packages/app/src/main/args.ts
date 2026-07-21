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
 */
export interface LaunchArgs {
  archFile: string | null
  repo: string | null
  dev: boolean
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

  return { archFile, repo, dev }
}
