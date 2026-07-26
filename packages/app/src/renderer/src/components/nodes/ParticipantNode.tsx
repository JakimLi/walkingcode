/**
 * wcParticipant — a participant lifeline in a sequence diagram.
 *
 * Renders a header card at the top (name + type icon + optional comment badge)
 * and a dashed vertical line spanning the node's full height to represent the
 * participant's lifeline. Clicking the header selects the participant's code
 * location (e.g. the file the service lives in).
 */
import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { WCNodeData } from '../../lib/layout.js'
import { useDiagram } from './diagramCtx.js'
import { CommentBadge, ParticipantKindIcon } from './badges.js'

function ParticipantImpl({ data, width, height, selected }: NodeProps): React.JSX.Element {
  const d = data as WCNodeData
  const wc = d.wc
  const { onSelect, commentCounts } = useDiagram()
  const clickable = !!wc.location
  const comments = commentCounts.get(wc.id) ?? 0

  return (
    <div style={{ width, height }} className="wc-node-surface relative flex flex-col items-center">
      {/* header card */}
      <button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && onSelect(wc)}
        className={[
          'flex flex-col items-center gap-0.5 rounded-md border bg-surface-panel px-3 py-2 shadow-[0_2px_6px_rgba(0,0,0,0.25)] transition-colors',
          selected ? 'border-accent-blue' : 'border-border hover:border-border-strong',
          clickable ? 'cursor-pointer' : 'cursor-default',
        ].join(' ')}
        style={{ width }}
        title={wc.description ?? wc.name}
      >
        <div className="flex items-center gap-1.5">
          <ParticipantKindIcon kind={wc.subKind} />
          <span className="text-ink-100 text-[13px] font-medium truncate">{wc.name}</span>
          {comments > 0 ? <CommentBadge count={comments} /> : null}
        </div>
        {wc.description ? (
          <span className="text-ink-400 text-[10px] truncate max-w-full">{wc.description}</span>
        ) : null}
      </button>

      {/* dashed lifeline — spans the remaining height */}
      <div
        className="mt-0 flex-1 border-l border-dashed border-border-strong/50"
        style={{ marginLeft: width / 2 }}
      />
    </div>
  )
}

export const ParticipantNode = memo(ParticipantImpl)
