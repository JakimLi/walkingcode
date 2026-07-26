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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      style={{ width, height }}
      className={[
        'wc-node-surface flex flex-col overflow-hidden rounded-md border bg-surface-panel shadow-[0_2px_6px_rgba(0,0,0,0.25)]',
        selected ? 'border-accent-blue' : 'border-border hover:border-border-strong',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !border-0 !bg-border-strong opacity-0" />

      {/* header — keep height stable: pt-2 pb-1.5 matches MODULE_HEADER_HEIGHT */}
      <button
        type="button"
        onClick={() => clickable && onSelect(wc)}
        disabled={!clickable}
        className={[
          'text-left px-3 pt-2 pb-1.5 border-b border-border-subtle',
          clickable ? 'cursor-pointer hover:bg-surface-overlay' : 'cursor-default',
        ].join(' ')}
        title={wc.description ?? wc.name}
      >
        <div className="flex items-center gap-1.5">
          <span className="text-ink-100 text-[13px] font-medium leading-tight truncate">
            {wc.name}
          </span>
          {moduleComments > 0 ? <CommentBadge count={moduleComments} /> : null}
        </div>
        {wc.location ? (
          <div className="text-ink-500 text-[10px] font-mono truncate mt-0.5">{wc.location.file}</div>
        ) : null}
      </button>

      {/* element list — keep row height stable: py-1 matches ELEMENT_ROW_HEIGHT */}
      <div className="flex-1 overflow-hidden">
        {elements.length === 0 ? (
          <div className="px-3 py-2 text-ink-500 text-[11px] italic">no elements</div>
        ) : (
          <ul className="py-0.5">
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
                      'w-full text-left px-3 py-1 flex items-center gap-2 text-[12px] font-mono transition-colors',
                      isSel
                        ? 'bg-accent-blue/15 text-ink-100'
                        : elClickable
                          ? 'text-ink-300 hover:bg-surface-overlay hover:text-ink-100'
                          : 'text-ink-500 cursor-default',
                    ].join(' ')}
                    title={el.description ?? el.name}
                  >
                    <ElementKindIcon kind={el.subKind} />
                    <span className="truncate">{el.name}</span>
                    {elComments > 0 ? (
                      <span className="ml-auto">
                        <CommentBadge count={elComments} />
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !border-0 !bg-border-strong opacity-0" />
    </motion.div>
  )
}

export const ModuleNode = memo(ModuleImpl)
