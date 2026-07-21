#!/usr/bin/env node
/**
 * diag-launch.mjs — run this if `walkingcode open` shows "launched" but no window appears.
 *
 * It does three things:
 *   1. kills any leftover WalkingCode electron process (clears stale locks)
 *   2. clears the runtime pid + log
 *   3. launches electron in the FOREGROUND so every error prints to your terminal,
 *      and writes the diagnostic log to ~/.walkingcode/runtime/app.log
 *
 * Usage:  node scripts/diag-launch.mjs [arch-file]
 * Default arch-file: examples/layered-arch.json
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ROOT = resolve(import.meta.dirname, '..')
const RUNTIME = join(homedir(), '.walkingcode', 'runtime')

const archFile = resolve(ROOT, process.argv[2] ?? 'examples/layered-arch.json')
if (!existsSync(archFile)) {
  console.error(`arch file not found: ${archFile}`)
  process.exit(1)
}

// 1. kill leftover
let electronBin
try {
  electronBin = require('electron')
} catch {
  // try the app-local hoisted path
  const p = join(ROOT, 'node_modules/electron')
  electronBin = require(p)
}
if (typeof electronBin !== 'string' || !existsSync(electronBin)) {
  console.error(`could not resolve electron binary (got: ${electronBin})`)
  process.exit(1)
}

const pidFile = join(RUNTIME, 'pid')
if (existsSync(pidFile)) {
  const oldPid = Number(readFileSync(pidFile, 'utf8').trim())
  if (oldPid > 0) {
    try {
      process.kill(oldPid, 0)
      console.log(`killing leftover process ${oldPid}…`)
      process.kill(oldPid, 'SIGTERM')
      await new Promise((r) => setTimeout(r, 1500))
    } catch {
      console.log(`stale pid ${oldPid} not running; clearing`)
    }
  }
  rmSync(pidFile, { force: true })
}

// 2. clear log
mkdirSync(RUNTIME, { recursive: true })
rmSync(join(RUNTIME, 'app.log'), { force: true })

const mainEntry = join(ROOT, 'packages/app/out/main/index.js')
if (!existsSync(mainEntry)) {
  console.error(`app not built — missing ${mainEntry}`)
  console.error(`run: npm run build -w @walkingcode/app`)
  process.exit(1)
}

// 3. foreground launch
console.log(`electron: ${electronBin}`)
console.log(`arch file: ${archFile}`)
console.log(`log: ${join(RUNTIME, 'app.log')}`)
console.log(`(Ctrl-C to quit)\n`)

const child = spawn(electronBin, [mainEntry, archFile], {
  cwd: join(ROOT, 'packages/app'),
  stdio: 'inherit',
})

child.on('exit', (code) => process.exit(code ?? 0))
process.on('SIGINT', () => {
  try {
    process.kill(child.pid ?? 0, 'SIGTERM')
  } catch {
    /* ignore */
  }
})
