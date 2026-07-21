/**
 * `walkingcode comments <list|read> <arch-file>` — read the sidecar comments file.
 *
 * The GUI writes comments to `<arch-file>.comments.json`. This command is the
 * agent's read-back so it can act on human review feedback. (Agents don't
 * normally *write* comments via the CLI — humans do that in the GUI — but the
 * underlying helpers here are symmetric.)
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import {
  parseCommentsFile,
  type Comment,
  type CommentsFile,
} from '@walkingcode/schema'
import { commentsPathFor } from '../runtime.js'

export function registerComments(program: Command): void {
  const comments = program.command('comments').description(
    'Read user comments from the sidecar file next to an arch file.'
  )

  comments
    .command('list')
    .description('Print all comments for an arch file as a compact table.')
    .argument('<arch-file>', 'Path to the arch file whose comments you want.')
    .option('--status <status>', 'Filter by status: open | resolved | wontfix.')
    .action((archFileArg: string, opts: { status?: string }) => {
      const file = loadComments(archFileArg)
      let items = file.comments
      if (opts.status) items = items.filter((c) => c.status === opts.status)
      if (items.length === 0) {
        console.log('No comments.')
        return
      }
      for (const c of items) {
        const lineTag = c.line ? `:${c.line}` : ''
        const status = c.status === 'open' ? '' : ` [${c.status}]`
        console.log(`${c.id}\t${c.nodeId}${lineTag}${status}\t@${c.author}`)
        console.log(`\t${c.body.replace(/\n/g, '\n\t')}`)
      }
      console.log(`\n${items.length} comment(s).`)
    })

  comments
    .command('read')
    .description('Print all comments as JSON (one object per line), or one by id.')
    .argument('<arch-file>')
    .option('--id <id>', 'Print only the comment with this id.')
    .action((archFileArg: string, opts: { id?: string }) => {
      const file = loadComments(archFileArg)
      let items = file.comments
      if (opts.id) {
        items = items.filter((c) => c.id === opts.id)
        if (items.length === 0) {
          console.error(`No comment with id "${opts.id}".`)
          process.exit(1)
        }
      }
      for (const c of items) console.log(JSON.stringify(c))
    })
}

function loadComments(archFileArg: string): CommentsFile {
  const archFile = resolve(archFileArg)
  if (!existsSync(archFile)) {
    console.error(`Arch file not found: ${archFile}`)
    process.exit(1)
  }
  const sidecar = commentsPathFor(archFile)
  if (!existsSync(sidecar)) {
    return { comments: [] }
  }
  let raw: unknown
  try {
    raw = JSON.parse(readFileSync(sidecar, 'utf8'))
  } catch (e) {
    console.error(`Could not parse sidecar ${sidecar}: ${(e as Error).message}`)
    process.exit(1)
  }
  return parseCommentsFile(raw)
}

/** Exported for potential future `add` subcommand. */
export type { Comment, CommentsFile }
