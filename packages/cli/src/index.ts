/**
 * walkingcode — launch/control the WalkingCode GUI and read comments.
 *
 * (The shebang is added by tsup's banner config so it lands at the very top of
 * the built ESM bundle.)
 *
 * Usage:
 *   walkingcode open    <arch-file> [--repo <path>] [--dev]
 *   walkingcode close   [--force]
 *   walkingcode validate <arch-file> [--json]
 *   walkingcode comments list <arch-file> [--status <status>]
 *   walkingcode comments read  <arch-file> [--id <id>]
 */
import { Command } from 'commander'
import { registerOpen } from './commands/open.js'
import { registerClose } from './commands/close.js'
import { registerComments } from './commands/comments.js'
import { registerValidate } from './commands/validate.js'

const program = new Command()

program
  .name('walkingcode')
  .description('Launch and control the WalkingCode architecture walkthrough GUI.')
  .version('0.1.0')

registerOpen(program)
registerClose(program)
registerValidate(program)
registerComments(program)

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
