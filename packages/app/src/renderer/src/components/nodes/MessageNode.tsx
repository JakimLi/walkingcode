/**
 * wcMessage — one interaction between two participants in a sequence diagram.
 *
 * The node spans the horizontal distance between the from and to lifelines at
 * the message's y position. It draws a directional arrow + label internally
 * (cheaper and more precise than routing a React Flow edge across tall lifeline
 * nodes). Clicking selects the message's CodeLocation (the line where the call
 * happens). Return messages are dashed with an open arrowhead.
 */
import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import type { WCNodeData } from '../../lib/layout.js'
import { useDiagram } from './diagramCtx.js'

type MessageMeta = { fromX: number; toX: number; kind?: string; isReturn: boolean }

function MessageImpl({ data, width, selected }: NodeProps): React.JSX.Element {
  const d = data as WCNodeData & { messageMeta?: MessageMeta }
  const wc = d.wc
  const meta = d.messageMeta
  const { onSelect, selectedElementId, commentCounts } = useDiagram()

  const clickable = !!wc.location
  const isSel = wc.id === selectedElementId
  const comments = wc.id ? commentCounts.get(wc.id) ?? 0 : 0

  // arrow colour by message kind
  const color =
    meta?.kind === 'return'
      ? '#6a9955'
      : meta?.kind === 'event'
        ? '#c586c0'
        : meta?.kind === 'async'
          ? '#c586c0'
          : '#3794ff'
  const dashed = meta?.kind === 'return' || meta?.kind === 'async'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      style={{ width, height: 28 }}
      className="wc-node-surface relative flex items-center"
    >
      {/* clickable hit area spanning the whole message row */}
      <button
        type="button"
        disabled={!clickable}
        onClick={() => clickable && onSelect(wc)}
        className={[
          'absolute inset-0 flex items-center transition-colors',
          clickable ? 'cursor-pointer' : 'cursor-default',
          isSel || selected ? 'bg-accent-blue/10' : 'hover:bg-surface-overlay/40',
        ].join(' ')}
        title={wc.description ?? wc.name}
      >
        {/* horizontal arrow line */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          preserveAspectRatio="none"
          viewBox={`0 0 ${width} 28`}
          fill="none"
        >
          <line
            x1="2"
            y1="14"
            x2={width - 2}
            y2="14"
            stroke={color}
            strokeWidth="1.5"
            strokeDasharray={dashed ? '5 4' : undefined}
          />
          {/* arrowhead at the target end (right for forward, left for return) */}
          {meta?.isReturn ? (
            <path d={`M2 14 L8 10 L8 18 Z`} fill={color} />
          ) : (
            <path d={`M${width - 2} 14 L${width - 8} 10 L${width - 8} 18 Z`} fill={color} />
          )}
        </svg>

        {/* label centred on the arrow */}
        <span
          className={[
            'mx-auto px-2 rounded-sm text-[11px] font-mono whitespace-nowrap z-[1] bg-surface-base',
            isSel || selected ? 'text-ink-100' : 'text-ink-300',
          ].join(' ')}
        >
          {wc.name}
          {comments > 0 ? (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-sm bg-accent-blue/20 text-accent-blue text-[10px] font-medium align-middle">
              {comments}
            </span>
          ) : null}
        </span>
      </button>
    </motion.div>
  )
}

export const MessageNode = memo(MessageImpl)
