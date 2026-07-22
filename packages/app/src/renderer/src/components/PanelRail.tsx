/**
 * PanelRail — the thin strip shown in place of a collapsed panel.
 *
 * Renders the panel name vertically plus an expand chevron at the top.
 * Clicking anywhere on the rail restores the panel. The chevron direction
 * points toward where the panel will re-expand.
 */
export interface PanelRailProps {
  /** Vertical label shown down the strip. */
  label: string
  /** Which way the expand chevron points (toward the panel's home side). */
  chevron: 'left' | 'right'
  /** Re-open the panel. */
  onExpand: () => void
}

export function PanelRail({ label, chevron, onExpand }: PanelRailProps): React.JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onExpand}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onExpand()
        }
      }}
      title={`Expand ${label.toLowerCase()}`}
      className={[
        'group relative flex h-full w-full cursor-pointer flex-col items-center justify-start pt-2.5',
        'bg-ink-850/40 hover:bg-ink-800/60 transition-colors',
        chevron === 'right' ? 'border-l border-ink-700/60' : 'border-r border-ink-700/60',
      ].join(' ')}
    >
      {/* expand chevron — pinned to the top, upright */}
      <span className="flex h-6 w-6 items-center justify-center rounded-md text-ink-400 group-hover:text-accent group-hover:bg-white/[0.06] transition-colors">
        {chevron === 'right' ? (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M5 3L9 6.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M8 3L4 6.5L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>

      {/* vertical label — centred in the remaining height */}
      <span
        className="mt-auto mb-auto text-ink-400 group-hover:text-ink-200 transition-colors text-[10px] uppercase tracking-[0.18em] font-semibold whitespace-nowrap"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {label}
      </span>
    </div>
  )
}
