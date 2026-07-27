/**
 * Per-user runtime dir + multi-PID tracking for running GUI instances.
 *
 * Layout under `~/.walkingcode/`:
 *   runtime/
 *     pids/             — one file per running GUI process, named by PID
 *       <pid>           — contains the arch file path the process was launched with
 *     arch-file         — the most-recently-opened arch file (advisory, not a lock)
 *
 * Multiple arch files can be open at once — each `walkingcode open` spawns its
 * own Electron process, recorded here as a separate PID file.
 */
import { homedir } from 'node:os'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

export const RUNTIME_DIR = join(homedir(), '.walkingcode', 'runtime')
const PIDS_DIR = join(RUNTIME_DIR, 'pids')
const ARCH_FILE_RECORD = join(RUNTIME_DIR, 'arch-file')

export function ensureRuntimeDir(): void {
  if (!existsSync(PIDS_DIR)) mkdirSync(PIDS_DIR, { recursive: true })
}

/** A recorded running instance: its PID and the arch file it was launched with. */
export interface PidRecord {
  pid: number
  archFile: string
}

/** Record a newly launched GUI process. Each process gets its own PID file. */
export function writePid(pid: number, archFile: string): void {
  ensureRuntimeDir()
  writeFileSync(join(PIDS_DIR, String(pid)), archFile, 'utf8')
  // advisory: track the most-recently-opened file for status messages
  writeFileSync(ARCH_FILE_RECORD, archFile, 'utf8')
}

/** Remove a single PID's record (called after the process exits or is killed). */
export function clearPid(pid: number): void {
  const f = join(PIDS_DIR, String(pid))
  if (existsSync(f)) unlinkSync(f)
}

/** Remove all PID records. */
export function clearAllPids(): void {
  if (!existsSync(PIDS_DIR)) return
  for (const name of readdirSync(PIDS_DIR)) {
    unlinkSync(join(PIDS_DIR, name))
  }
}

/**
 * Read all recorded PIDs that are still alive. Dead ones are cleaned up as a
 * side effect so the dir doesn't accumulate stale entries.
 */
export function readLivePids(): PidRecord[] {
  if (!existsSync(PIDS_DIR)) return []
  const records: PidRecord[] = []
  for (const name of readdirSync(PIDS_DIR)) {
    const pid = Number(name)
    if (!Number.isFinite(pid) || pid <= 0) continue
    if (!isPidAlive(pid)) {
      clearPid(pid) // reap stale entry
      continue
    }
    const archFile = readFileSync(join(PIDS_DIR, name), 'utf8').trim() || '(unknown)'
    records.push({ pid, archFile })
  }
  return records
}

/** The most-recently-opened arch file (advisory, for status messages). */
export function readArchFileRecord(): string | null {
  if (!existsSync(ARCH_FILE_RECORD)) return null
  return readFileSync(ARCH_FILE_RECORD, 'utf8').trim() || null
}

/**
 * Is a PID still alive? Uses process.kill(pid, 0) to probe.
 */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code
    if (code === 'EPERM') return true
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
