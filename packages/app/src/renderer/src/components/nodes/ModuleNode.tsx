/**
 * wcModule — a module node. Renders the module header plus its element list;
 * each element is individually clickable. The whole module node is also
 * selectable (clicking the header selects the module-level location).
 */
import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { motion } from 'framer-motion'
import type { WCNodeData } from '../../lib/layout.js'
import { useDiagram } from './diagramCtx.js'
import { CommentBadge, ElementKindIcon } from './badges.js'

function ModuleImpl({ data, width, height, selected }: NodeProps): React.JSX.Element {
  const d = data as WCNodeData
  const wc = d.wc
  const elements = d.elements ?? []
  const { onSelect, selectedElementId, commentCounts } = useDiagram()

  const moduleComments = commentCounts.get(wc.id) ?? 0
  const clickable = !!wc.location

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      style={{ width, height }}
      className={[
        'flex flex-col rounded-lg border bg-ink-850 overflow-hidden',
        selected ? 'border-accent shadow-[0_0_0_1px_var(--tw-shadow-color)]' : 'border-ink-700',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!bg-ink-600 !w-2 !h-2 !border-0" />

      {/* header */}
      <button
        type="button"
        onClick={() => clickable && onSelect(wc)}
        disabled={!clickable}
        className={[
          'text-left px-3 pt-2 pb-1.5 border-b border-ink-700/70',
          clickable ? 'hover:bg-ink-800 cursor-pointer' : 'cursor-default',
        ].join(' ')}
        title={wc.description ?? wc.name}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-ink-200 text-sm font-medium truncate">{wc.name}</span>
          {moduleComments > 0 ? <CommentBadge count={moduleComments} /> : null}
        </div>
        {wc.location ? (
          <div className="text-ink-600 text-[10px] font-mono truncate mt-0.5">{wc.location.file}</div>
        ) : null}
      </button>

      {/* element list */}
      <div className="flex-1 overflow-hidden">
        {elements.length === 0 ? (
          <div className="px-3 py-2 text-ink-600 text-[11px] italic">no elements</div>
        ) : (
          <ul className="py-1">
            {elements.map((el) => {
              const isSel = el.id === selectedElementId
              const elClickable = !!el.location
              const elComments = commentCounts.get(el.id) ?? 0
              return (
                <li key={el.id}>
                  <button
                    type="button"
                    disabled={!elClickable}
                    onClick={() => elClickable && onSelect(el)}
                    className={[
                      'w-full text-left px-3 py-1 flex items-center gap-2 text-[12px] font-mono',
                      isSel
                        ? 'bg-accent/20 text-ink-200'
                        : elClickable
                          ? 'text-ink-200 hover:bg-ink-800'
                          : 'text-ink-600 cursor-default',
                    ].join(' ')}
                    title={el.description ?? el.name}
                  >
                    <ElementKindIcon kind={el.subKind} />
                    <span className="truncate">{el.name}</span>
                    {elComments > 0 ? <span className="ml-auto"><CommentBadge count={elComments} /></span> : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-ink-600 !w-2 !h-2 !border-0" />
    </motion.div>
  )
}

export const ModuleNode = memo(ModuleImpl)
