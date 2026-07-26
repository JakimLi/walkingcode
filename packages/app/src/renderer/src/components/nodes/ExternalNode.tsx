/** wcExternal — an external node (database, queue, external service). */
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import type { WCNodeData } from '../../lib/layout.js'
import { useDiagram } from './diagramCtx.js'
import { CommentBadge, ExternalKindIcon } from './badges.js'

function ExternalImpl({ data, width, selected }: NodeProps): React.JSX.Element {
  const d = data as WCNodeData
  const wc = d.wc
  const { onSelect, commentCounts } = useDiagram()
  const clickable = !!wc.location
  const comments = commentCounts.get(wc.id) ?? 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      style={{ width }}
      className={[
        'wc-node-surface rounded-md border border-dashed bg-surface-inset/60 px-3 py-2 transition-colors',
        selected
          ? 'border-accent-blue'
          : 'border-border-strong hover:border-ink-500',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-border-strong opacity-0" />
      <button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && onSelect(wc)}
        className={[
          'flex flex-col items-center gap-0.5 w-full rounded',
          clickable ? 'cursor-pointer hover:bg-surface-overlay' : 'cursor-default',
        ].join(' ')}
        title={wc.description ?? wc.name}
      >
        <div className="flex items-center gap-1.5">
          <ExternalKindIcon kind={wc.subKind} />
          <span className="text-ink-100 text-[13px] font-medium truncate">{wc.name}</span>
          {comments > 0 ? <CommentBadge count={comments} /> : null}
        </div>
        {wc.description ? (
          <div className="text-ink-500 text-[10px] text-center max-w-full truncate">
            {wc.description}
          </div>
        ) : null}
      </button>
    </motion.div>
  )
}

export const ExternalNode = memo(ExternalImpl)
