/**
 * CollapseButton — a small chevron used in panel headers to collapse a panel
 * down to a rail. Shared by Code, Comments, and the Diagram overlay so the
 * affordance stays consistent.
 */
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
          ? 'text-ink-500 hover:text-ink-100 hover:bg-white/[0.06] cursor-pointer'
          : 'text-ink-700 cursor-not-allowed',
      ].join(' ')}
    >
      {chevron === 'right' ? (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M5 3L9 6.5L5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <path d="M8 3L4 6.5L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
