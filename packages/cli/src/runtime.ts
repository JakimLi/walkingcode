/**
 * Per-user runtime dir + PID lock for the running GUI instance.
 *
 * Layout under `~/.walkingcode/`:
 *   runtime/
 *     pid          — PID of the currently running GUI process (or absent)
 *     arch-file    — absolute path of the arch file the GUI was launched with
 *     started-at   — ISO timestamp of last launch
 */
import { homedir } from 'node:os'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, rmSync } from 'node:fs'
import { join } from 'node:path'

export const RUNTIME_DIR = join(homedir(), '.walkingcode', 'runtime')
const PID_FILE = join(RUNTIME_DIR, 'pid')
const ARCH_FILE_RECORD = join(RUNTIME_DIR, 'arch-file')
const STARTED_AT_FILE = join(RUNTIME_DIR, 'started-at')

export function ensureRuntimeDir(): void {
  if (!existsSync(RUNTIME_DIR)) mkdirSync(RUNTIME_DIR, { recursive: true })
}

/** Read the recorded PID of the running GUI, or null if none/missing. */
export function readPid(): number | null {
  if (!existsSync(PID_FILE)) return null
  const raw = readFileSync(PID_FILE, 'utf8').trim()
  const pid = Number(raw)
  return Number.isFinite(pid) && pid > 0 ? pid : null
}

export function writePid(pid: number, archFile: string): void {
  ensureRuntimeDir()
  writeFileSync(PID_FILE, String(pid), 'utf8')
  writeFileSync(ARCH_FILE_RECORD, archFile, 'utf8')
  writeFileSync(STARTED_AT_FILE, new Date().toISOString(), 'utf8')
}

export function clearPid(): void {
  for (const f of [PID_FILE, ARCH_FILE_RECORD, STARTED_AT_FILE]) {
    if (existsSync(f)) unlinkSync(f)
  }
}

export function readArchFileRecord(): string | null {
  if (!existsSync(ARCH_FILE_RECORD)) return null
  return readFileSync(ARCH_FILE_RECORD, 'utf8').trim() || null
}

/**
 * Is the recorded PID still alive? Returns false if no PID recorded or the
 * process is gone. On macOS/Linux we use process.kill(pid, 0) to probe.
 */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code
    // EPERM: process exists but we can't signal it — still "alive" for our purposes
    if (code === 'EPERM') return true
    // ESRCH: no such process
    return false
  }
}

export function killPid(pid: number): boolean {
  try {
    process.kill(pid, 'SIGTERM')
    return true
  } catch {
    return false
  }
}

/** Sidecar path for a given arch file: `<arch-file>.comments.json`. */
export function commentsPathFor(archFile: string): string {
  return `${archFile}.comments.json`
}

/** Nuke the whole runtime dir (used by tests, not by the CLI normally). */
export function resetRuntime(): void {
  if (existsSync(RUNTIME_DIR)) rmSync(RUNTIME_DIR, { recursive: true, force: true })
}
