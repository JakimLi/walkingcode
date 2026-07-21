/**
 * `walkingcode validate <arch-file>` — parse an arch file and report.
 *
 * Exit codes: 0 ok, 1 hard error, 2 ok-with-warnings. Prints warnings + issues
 * in a readable form. This is what agents and humans use to sanity-check a
 * generated file before opening it.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Command } from 'commander'
import { parseDocument } from '@walkingcode/schema'

export function registerValidate(program: Command): void {
  program
    .command('validate')
    .description('Validate an arch file against the schema. Prints warnings and errors.')
    .argument('<arch-file>')
    .option('--json', 'Emit machine-readable JSON instead of human text.')
    .action((archFileArg: string, opts: { json?: boolean }) => {
      const archFile = resolve(archFileArg)
      if (!existsSync(archFile)) {
        console.error(`Arch file not found: ${archFile}`)
        process.exit(1)
      }
      let raw: unknown
      try {
        raw = JSON.parse(readFileSync(archFile, 'utf8'))
      } catch (e) {
        const msg = `Invalid JSON: ${(e as Error).message}`
        if (opts.json) {
          console.log(JSON.stringify({ ok: false, message: msg }))
        } else {
          console.error(msg)
        }
        process.exit(1)
      }

      const result = parseDocument(raw)

      if (opts.json) {
        console.log(JSON.stringify(result, null, 2))
        process.exit(result.ok ? (result.warnings.length ? 2 : 0) : 1)
      }

      if (!result.ok) {
        console.error(`✗ ${result.message}`)
        for (const issue of result.issues) {
          console.error(`  • ${issue.path}: ${issue.message}`)
        }
        process.exit(1)
      }

      const doc = result.document
      const layerCount = 'layers' in doc ? (doc as { layers?: unknown[] }).layers?.length ?? 0 : 0
      const edgeCount = 'edges' in doc ? (doc as { edges?: unknown[] }).edges?.length ?? 0 : 0
      console.log(`✓ valid: "${doc.title ?? '(untitled)'}"`)
      console.log(`  kind:        ${doc.kind}`)
      console.log(`  layers:      ${layerCount}`)
      console.log(`  edges:       ${edgeCount}`)
      if (result.warnings.length) {
        console.warn(`  warnings:    ${result.warnings.length}`)
        for (const w of result.warnings) {
          console.warn(`    • ${w.path}: ${w.message}`)
        }
        process.exit(2)
      }
      process.exit(0)
    })
}
