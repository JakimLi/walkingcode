/**
 * Toolbar — top bar: document title, repo, parse warnings, comment count.
 */
import { useState } from 'react'
import type { ParseWarning } from '@wc-schema'
import type { LayeredDocument } from '@wc-schema'

export interface ToolbarProps {
  doc: LayeredDocument | null
  repo: string | null
  archFile: string | null
  warnings: ParseWarning[]
  commentCount: number
  /** Called when the user clicks "reload" to refresh comments from the sidecar. */
  onReload: () => void
}

export function Toolbar({ doc, repo, archFile, warnings, commentCount, onReload }: ToolbarProps): React.JSX.Element {
  const [showWarnings, setShowWarnings] = useState(false)
  return (
    <div className="flex items-center gap-3 h-11 px-3 border-b border-ink-700 bg-ink-900 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-accent font-semibold text-sm">WalkingCode</span>
        <span className="text-ink-700">/</span>
        <span className="text-ink-200 text-sm truncate" title={doc?.title ?? ''}>
          {doc?.title ?? '(no document)'}
        </span>
        {doc ? (
          <span className="text-[10px] uppercase tracking-wide text-ink-600 border border-ink-700 rounded px-1.5 py-0.5">
            {doc.kind}
          </span>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="text-[11px] text-ink-600 font-mono truncate max-w-[40%]" title={repo ?? archFile ?? ''}>
        {repo ? `repo: ${repo}` : archFile ? archFile : ''}
      </div>

      <button
        type="button"
        onClick={onReload}
        className="text-[11px] px-2 py-1 rounded border border-ink-700 text-ink-400 hover:text-ink-200 hover:border-ink-600"
        title="Reload comments from sidecar"
      >
        ⟳ comments ({commentCount})
      </button>

      <button
        type="button"
        onClick={() => setShowWarnings((s) => !s)}
        className={[
          'text-[11px] px-2 py-1 rounded border',
          warnings.length
            ? 'border-amber-600/60 text-amber-300 hover:bg-amber-900/20'
            : 'border-ink-700 text-ink-600 cursor-default',
        ].join(' ')}
        title={warnings.length ? `${warnings.length} warning(s)` : 'no warnings'}
        disabled={warnings.length === 0}
      >
        ⚠ {warnings.length}
      </button>

      {showWarnings && warnings.length > 0 ? (
        <div className="absolute top-11 right-3 w-96 max-h-72 overflow-auto rounded-md border border-ink-700 bg-ink-850 shadow-xl z-50 p-2 text-[11px]">
          <div className="text-ink-400 font-medium mb-1">Parse warnings</div>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-ink-200">
                <span className="text-ink-600 font-mono">{w.path}</span>
                <div className="text-ink-400">{w.message}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
