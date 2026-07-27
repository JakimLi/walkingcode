/**
 * PanelRail — the thin strip shown in place of a collapsed panel.
 *
 * Renders the panel name vertically plus an expand chevron at the top.
 * Clicking anywhere on the rail restores the panel. The chevron direction
 * points toward where the panel will re-expand.
 */
import { ChevronRight, ChevronLeft } from './Icon.js'

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
        'bg-surface-inset hover:bg-surface-overlay transition-colors',
        chevron === 'right' ? 'border-l border-border-subtle' : 'border-r border-border-subtle',
      ].join(' ')}
    >
      {/* expand chevron — pinned to the top, upright */}
      <span className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 group-hover:text-accent-blue transition-colors">
        {chevron === 'right' ? <ChevronRight /> : <ChevronLeft />}
      </span>

      {/* vertical label — centred in the remaining height */}
      <span
        className="mt-auto mb-auto text-ink-500 group-hover:text-ink-300 transition-colors text-[10px] uppercase tracking-[0.18em] font-semibold whitespace-nowrap"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        {label}
      </span>
    </div>
  )
}
