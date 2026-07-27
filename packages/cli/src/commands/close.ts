/**
 * `walkingcode close` — stop all running GUI instances.
 *
 * Reads every recorded PID, SIGTERMs each, clears the records. Idempotent: if
 * nothing's running, prints that and exits 0. `--force` escalates to SIGKILL
 * for any that don't stop within the grace window.
 */
import { Command } from 'commander'
import { clearAllPids, clearPid, isPidAlive, killPid, readLivePids } from '../runtime.js'

export function registerClose(program: Command): void {
  program
    .command('close')
    .description('Stop all running WalkingCode GUI instances.')
    .option('--force', 'Send SIGKILL to any instance that does not stop within 2s.')
    .action((opts: { force?: boolean }) => {
      const live = readLivePids()
      if (live.length === 0) {
        console.log('No running WalkingCode GUI recorded.')
        return
      }

      let stopped = 0
      let failed = 0
      for (const r of live) {
        if (!killPid(r.pid)) {
          console.error(`Could not signal PID ${r.pid} (${r.archFile}).`)
          failed++
          continue
        }
        // grace window per process
        const deadline = Date.now() + 2000
        while (Date.now() < deadline && isPidAlive(r.pid)) {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
        }
        if (isPidAlive(r.pid) && opts.force) {
          try {
            process.kill(r.pid, 'SIGKILL')
          } catch {
            /* ignore */
          }
        }
        if (isPidAlive(r.pid)) {
          console.error(`PID ${r.pid} did not stop (${r.archFile}).`)
          failed++
        } else {
          console.log(`Stopped pid ${r.pid} (${r.archFile}).`)
          stopped++
          clearPid(r.pid)
        }
      }

      // clear anything left over (e.g. processes we couldn't signal)
      clearAllPids()
      if (failed > 0) {
        console.error(`${failed} instance(s) could not be stopped.`)
        process.exit(1)
      }
      console.log(`${stopped} instance(s) stopped.`)
    })
}
