/**
 * `walkingcode close` — stop the running GUI.
 *
 * Reads the recorded PID, SIGTERMs it, clears the lock. Idempotent: if nothing's
 * running, prints that and exits 0.
 */
import { Command } from 'commander'
import { clearPid, isPidAlive, killPid, readPid } from '../runtime.js'

export function registerClose(program: Command): void {
  program
    .command('close')
    .description('Stop the running WalkingCode GUI, if any.')
    .option('--force', 'Send SIGKILL if SIGTERM does not stop the process within 2s.')
    .action((opts: { force?: boolean }) => {
      const pid = readPid()
      if (!pid) {
        console.log('No running WalkingCode GUI recorded.')
        return
      }
      if (!isPidAlive(pid)) {
        clearPid()
        console.log(`Recorded PID ${pid} is not running; cleared the lock.`)
        return
      }
      const ok = killPid(pid)
      if (!ok) {
        console.error(`Could not signal PID ${pid}.`)
        process.exit(1)
      }
      // give it a moment; optionally escalate
      const deadline = Date.now() + 2000
      while (Date.now() < deadline && isPidAlive(pid)) {
        // busy-wait briefly
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
      }
      if (isPidAlive(pid) && opts.force) {
        try {
          process.kill(pid, 'SIGKILL')
        } catch {
          /* ignore */
        }
      }
      if (isPidAlive(pid)) {
        console.error(`PID ${pid} did not stop (use --force to escalate).`)
        process.exit(1)
      }
      clearPid()
      console.log(`WalkingCode stopped (pid ${pid}).`)
    })
}
