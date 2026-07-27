/**
 * Toolbar — top bar: document title, repo, parse warnings, comment count.
 *
 * Codex-style: flat surface, hairline bottom rule, no gradients/blur. The bar
 * is the window's drag region; interactive children opt out with `app-no-drag`.
 */
import { useState } from 'react'
import type { ParseWarning } from '@wc-schema'
import type { LayeredDocument } from '@wc-schema'
import { WindowControls } from './WindowControls.js'
import { useTheme } from '../theme.js'
import { Sun, Moon } from './Icon.js'

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
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="relative flex items-center gap-3 h-10 px-3 border-b border-border-subtle bg-surface-raised shrink-0 app-drag">
      {/* title cluster — macOS reserves space on the left for traffic lights */}
      <div className={`flex items-center gap-2 min-w-0 ${isMac ? 'ml-[68px]' : ''}`}>
        {doc ? (
          <>
            <span className="text-ink-100 text-[13px] font-medium truncate" title={doc?.title ?? ''}>
              {doc?.title ?? '(no document)'}
            </span>
            <span className="text-[9px] uppercase tracking-[0.1em] font-semibold text-ink-500 border border-border-subtle rounded px-1.5 py-0.5">
              {doc.kind}
            </span>
          </>
        ) : (
          <span className="text-ink-300 text-[13px] font-medium">WalkingCode</span>
        )}
      </div>

      <div className="flex-1" />

      <div className="text-[11px] text-ink-500 font-mono truncate max-w-[40%]" title={repo ?? archFile ?? ''}>
        {repo ? `repo: ${repo}` : archFile ? archFile : ''}
      </div>

      <button
        type="button"
        onClick={onReload}
        className="app-no-drag flex items-center gap-1.5 text-[11px] px-2 py-1 rounded border border-border-subtle text-ink-400 hover:text-ink-100 hover:border-border-strong transition-colors"
        title="Reload comments from sidecar"
      >
        ⟳ {commentCount}
      </button>

      <button
        type="button"
        onClick={() => setShowWarnings((s) => !s)}
        className={[
          'app-no-drag flex items-center gap-1 text-[11px] px-2 py-1 rounded border transition-colors',
          warnings.length
            ? 'border-warning/40 text-warning hover:bg-warning/10'
            : 'border-border-subtle text-ink-500 cursor-default',
        ].join(' ')}
        title={warnings.length ? `${warnings.length} warning(s)` : 'no warnings'}
        disabled={warnings.length === 0}
      >
        ⚠ {warnings.length}
      </button>

      {/* theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="app-no-drag flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:text-ink-100 hover:bg-surface-overlay transition-colors"
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun /> : <Moon />}
      </button>

      {showWarnings && warnings.length > 0 ? (
        <div className="absolute top-[38px] right-3 w-96 max-h-72 overflow-auto rounded border border-border-subtle bg-surface-overlay z-50 p-2.5 text-[11px] app-no-drag">
          <div className="text-ink-200 font-medium mb-1.5">Parse warnings</div>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="rounded bg-surface-inset px-2 py-1.5">
                <span className="text-ink-500 font-mono text-[10px]">{w.path}</span>
                <div className="text-ink-300 mt-0.5">{w.message}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isMac ? (
        <span className="app-no-drag">
          <WindowControls />
        </span>
      ) : null}
    </div>
  )
}
