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
import { WinMinimize, WinMaximize, WinClose } from './Icon.js'

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
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-surface-overlay hover:text-ink-100 transition-colors"
      >
        <WinMinimize />
      </button>
      <button
        type="button"
        onClick={() => void window.wc.win.toggleMaximize()}
        title="Toggle maximize"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-surface-overlay hover:text-ink-100 transition-colors"
      >
        <WinMaximize />
      </button>
      <button
        type="button"
        onClick={() => void window.wc.win.close()}
        title="Close"
        className="flex h-7 w-7 items-center justify-center rounded-md text-ink-400 hover:bg-danger/80 hover:text-white transition-colors"
      >
        <WinClose />
      </button>
    </div>
  )
}
