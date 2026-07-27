/**
 * `walkingcode open <arch-file>` — spawn the Electron GUI on an arch file.
 *
 * Behaviour:
 *   - resolve + absolute-ise the arch file path (must exist)
 *   - resolve the electron binary + entry (dev vs built)
 *   - spawn electron detached, passing argv: [entry, archFile, --repo, <repo>]
 *   - record the PID so `close` can stop it
 *   - print a one-line confirmation the agent can grep
 */
import { spawn } from 'node:child_process'
import { existsSync, realpathSync } from 'node:fs'
import { resolve, isAbsolute } from 'node:path'
import { Command } from 'commander'
import {
  clearAllPids,
  clearPid,
  ensureRuntimeDir,
  killPid,
  readLivePids,
  writePid,
} from '../runtime.js'
import { APP_PKG_DIR, isNpxFallback, resolveElectron } from '../electron.js'

export function registerOpen(program: Command): void {
  program
    .command('open')
    .description('Launch the WalkingCode GUI on an architecture description file.')
    .argument('<arch-file>', 'Path to a *.arch.json (or any JSON arch file).')
    .option('--repo <path>', 'Override the repo root (defaults to the file\'s `repo` field).')
    .option('--dev', 'Launch against the electron-vite dev server instead of the build.')
    .option('--dev-port <port>', 'Dev server port (default 5173).', (v) => Number(v))
    .option('--foreground', 'Run electron in the foreground (attached) so errors print to the terminal. Use this if no window appears.')
    .option(
      '--force',
      'Kill all running WalkingCode instances before launching.'
    )
    .action(
      (archFileArg: string, opts: {
        repo?: string
        dev?: boolean
        devPort?: number
        foreground?: boolean
        force?: boolean
      }) => {
        const archFile = resolveAbs(archFileArg)
        if (!existsSync(archFile)) {
          fail(`Arch file not found: ${archFile}`)
        }

        // --force: stop every running instance first
        if (opts.force) {
          const live = readLivePids()
          if (live.length > 0) {
            console.log(`--force: stopping ${live.length} running instance(s)…`)
            for (const r of live) killPid(r.pid)
            clearAllPids()
          }
        }

      let target
      try {
        target = resolveElectron({ dev: opts.dev, devPort: opts.devPort })
      } catch (e) {
        fail((e as Error).message)
      }

      // argv shape: electron <entry> <archFile> [--repo <repo>]
      const electronArgs = [target.entry, archFile]
      if (opts.repo) electronArgs.push('--repo', resolveAbs(opts.repo))

      const cmd = isNpxFallback(target) ? 'npx' : target.binary
      const args = isNpxFallback(target) ? ['electron', ...electronArgs] : electronArgs
      const cwd = APP_PKG_DIR

      ensureRuntimeDir()
      const foreground = !!opts.foreground
      const child = spawn(cmd, args, {
        cwd,
        // In foreground mode, inherit stdio so the user sees electron's output
        // (and Ctrl-C kills the app). Otherwise detach + ignore stdio.
        detached: !foreground,
        stdio: foreground ? 'inherit' : 'ignore',
        env: {
          ...process.env,
          // carry the repo override into the app as well, in case the doc lacks `repo`
          ...(opts.repo ? { WALKINGCODE_REPO: resolveAbs(opts.repo) } : {}),
        },
      })
      if (foreground) {
        // forward our exit signals to the child
        const kill = (sig: NodeJS.Signals): void => {
          try {
            process.kill(child.pid ?? 0, sig)
          } catch {
            /* ignore */
          }
        }
        process.on('SIGINT', () => kill('SIGINT'))
        process.on('SIGTERM', () => kill('SIGTERM'))
        console.log(`WalkingCode running in foreground (pid ${child.pid}).`)
        console.log(`  file: ${archFile}`)
        console.log(`  via:  ${target.description}`)
        console.log(`  log:  ~/.walkingcode/runtime/app.log`)
        console.log(`  (Ctrl-C to quit)`)
        if (child.pid) writePid(child.pid, archFile)
        child.on('exit', (code) => {
          if (child.pid) clearPid(child.pid)
          process.exit(code ?? 0)
        })
        return
      }
      child.on('error', (err) => {
        console.error(`Failed to launch electron: ${err.message}`)
        console.error(`  looked for: ${target.description}`)
        process.exit(1)
      })
      child.unref()

      // best-effort PID record; detached child may outlive us
      if (child.pid) {
        writePid(child.pid, archFile)
        console.log(`WalkingCode launched (pid ${child.pid}).`)
        console.log(`  file: ${archFile}`)
        console.log(`  via:  ${target.description}`)
        console.log(`  log:  ~/.walkingcode/runtime/app.log  (run \`walkingcode open --foreground\` if no window appears)`)
      } else {
        console.log(`WalkingCode launch initiated (no pid available).`)
      }
    })
}

function resolveAbs(p: string): string {
  const abs = isAbsolute(p) ? p : resolve(process.cwd(), p)
  try {
    return realpathSync(abs)
  } catch {
    return abs
  }
}

function fail(msg: string): never {
  console.error(msg)
  process.exit(1)
}
