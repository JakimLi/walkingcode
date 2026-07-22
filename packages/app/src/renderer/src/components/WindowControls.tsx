/**
 * WindowControls — minimize / maximize / close caption buttons rendered into
 * the toolbar for the frameless window.
 *
 * Only shown on Windows & Linux. On macOS the native traffic-light buttons
 * (kept via titleBarStyle: 'hiddenInset') handle window chrome, so this is
 * hidden there to avoid duplicate controls.
 *
 * The whole group is marked no-drag so clicks register (the toolbar around it
 * is a drag region).
 */
export function WindowControls(): React.JSX.Element | null {
  // platform is injected by the preload; fall back to 'darwin' so we never show
  // duplicate buttons when the bridge isn't available (e.g. a stray web build).
  const platform = typeof window !== 'undefined' && window.wc ? window.wc.platform : 'darwin'
  if (platform === 'darwin') return null

  return (
    <div className="flex items-center gap-1 -my-1 -mr-1 app-no-drag">
      <button
        type="button"
        onClick={() => void window.wc.win.minimize()}
        title="Minimize"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-white/[0.08] hover:text-ink-100 transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1" y="5" width="9" height="1" rx="0.5" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => void window.wc.win.toggleMaximize()}
        title="Toggle maximize"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-white/[0.08] hover:text-ink-100 transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <rect x="1.5" y="1.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => void window.wc.win.close()}
        title="Close"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-red-500/80 hover:text-white transition-colors"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 2L9 9M9 2L2 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
