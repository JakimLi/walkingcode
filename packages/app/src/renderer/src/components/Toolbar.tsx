/**
 * Toolbar — top bar: document title, repo, parse warnings, comment count.
 *
 * It doubles as the window's drag region (frameless title bar): the bar is
 * draggable via `app-drag`, while interactive children opt out with
 * `app-no-drag`. On Windows/Linux the WindowControls render on the right; on
 * macOS the native traffic lights sit on the left, so we reserve space there.
 */
import { useState } from 'react'
import type { ParseWarning } from '@wc-schema'
import type { LayeredDocument } from '@wc-schema'
import { WindowControls } from './WindowControls.js'

export interface ToolbarProps {
  doc: LayeredDocument | null
  repo: string | null
  archFile: string | null
  warnings: ParseWarning[]
  commentCount: number
  /** Called when the user clicks "reload" to refresh comments from the sidecar. */
  onReload: () => void
}

const isMac =
  typeof window !== 'undefined' && window.wc ? window.wc.platform === 'darwin' : true

export function Toolbar({ doc, repo, archFile, warnings, commentCount, onReload }: ToolbarProps): React.JSX.Element {
  const [showWarnings, setShowWarnings] = useState(false)
  return (
    <div
      data-wc-drag
      className="relative flex items-center gap-3 h-11 px-3.5 border-b border-ink-700/60 bg-ink-900/70 backdrop-blur-md shrink-0 app-drag"
    >
      {/* brand mark */}
      <div className={`flex items-center gap-2 min-w-0 ${isMac ? 'ml-[68px]' : ''}`}>
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-soft shadow-[0_2px_8px_rgba(107,160,255,0.4)]">
          <span className="text-white text-[11px] font-bold leading-none">W</span>
        </div>
        <span className="text-ink-100 font-semibold text-[13px] tracking-tight">WalkingCode</span>

        {doc ? (
          <>
            <span className="text-ink-700">/</span>
            <span className="text-ink-300 text-[13px] truncate" title={doc?.title ?? ''}>
              {doc?.title ?? '(no document)'}
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] font-semibold text-ink-400 border border-ink-700 rounded px-1.5 py-0.5">
              {doc.kind}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex-1" />

      <div className="text-[11px] text-ink-500 font-mono truncate max-w-[40%]" title={repo ?? archFile ?? ''}>
        {repo ? `repo: ${repo}` : archFile ? archFile : ''}
      </div>

      <button
        type="button"
        onClick={onReload}
        className="app-no-drag wc-focus inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border border-ink-700 bg-ink-850/60 text-ink-300 hover:text-ink-100 hover:border-ink-600 hover:bg-ink-800 transition-colors"
        title="Reload comments from sidecar"
      >
        <span className="text-ink-400">⟳</span>
        comments ({commentCount})
      </button>

      <button
        type="button"
        onClick={() => setShowWarnings((s) => !s)}
        className={[
          'app-no-drag wc-focus inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border transition-colors',
          warnings.length
            ? 'border-amber-600/50 text-amber-300 hover:bg-amber-900/20'
            : 'border-ink-700 text-ink-500 cursor-default',
        ].join(' ')}
        title={warnings.length ? `${warnings.length} warning(s)` : 'no warnings'}
        disabled={warnings.length === 0}
      >
        ⚠ {warnings.length}
      </button>

      {showWarnings && warnings.length > 0 ? (
        <div className="absolute top-[42px] right-3 w-96 max-h-72 overflow-auto rounded-lg border border-ink-700 bg-ink-850 shadow-panel z-50 p-2.5 text-[11px] backdrop-blur-md app-no-drag">
          <div className="text-ink-300 font-medium mb-1.5">Parse warnings</div>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="rounded-md bg-ink-900/60 px-2 py-1.5">
                <span className="text-ink-500 font-mono text-[10px]">{w.path}</span>
                <div className="text-ink-300 mt-0.5">{w.message}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* macOS native buttons are on the left; Win/Linux get in-DOM controls here */}
      {!isMac ? (
        <span className="app-no-drag">
          <WindowControls />
        </span>
      ) : null}
    </div>
  )
}
