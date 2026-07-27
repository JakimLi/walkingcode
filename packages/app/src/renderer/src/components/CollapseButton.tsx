/**
 * CollapseButton — a small chevron used in panel headers to collapse a panel
 * down to a rail. Shared by Code, Comments, and the Diagram overlay so the
 * affordance stays consistent.
 */
import { ChevronRight, ChevronLeft } from './Icon.js'

export interface CollapseButtonProps {
  onCollapse?: () => void
  /** Disabled when this is the last open panel (can't collapse to zero). */
  canCollapse?: boolean
  /** Chevron direction toward the side the panel collapses into. */
  chevron: 'left' | 'right'
  label: string
}

export function CollapseButton({
  onCollapse,
  canCollapse = true,
  chevron,
  label,
}: CollapseButtonProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onCollapse?.()}
      disabled={!canCollapse}
      title={canCollapse ? label : 'Keep at least one panel open'}
      aria-label={label}
      className={[
        'app-no-drag flex h-6 w-6 items-center justify-center rounded-md transition-colors',
        canCollapse
          ? 'text-ink-500 hover:text-ink-100 hover:bg-surface-overlay cursor-pointer'
          : 'text-ink-600 cursor-not-allowed',
      ].join(' ')}
    >
      {chevron === 'right' ? <ChevronRight /> : <ChevronLeft />}
    </button>
  )
}
