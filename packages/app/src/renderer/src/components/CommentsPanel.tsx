/**
 * CommentsPanel — show + add comments anchored to the selected node.
 *
 * Lists comments for the selected node (by composite id), lets the user type a
 * new one, and persists via preload `wc.comments.add`. Adding also carries the
 * selected line range (best-effort) so the agent gets a line anchor.
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Comment } from '@wc-schema'
import type { WCNode } from '../lib/model.js'
import { CollapseButton } from './CollapseButton.js'

export interface CommentsPanelProps {
  selected: WCNode | null
  comments: Comment[]
  onAdded: () => void
  onResolve: (id: string) => void
  /** Collapse this panel to a rail (called by the header chevron). */
  onCollapse?: () => void
  /** Whether collapse is allowed (disabled when it's the last open panel). */
  canCollapse?: boolean
}

export function CommentsPanel({
  selected,
  comments,
  onAdded,
  onResolve,
  onCollapse,
  canCollapse = true,
}: CommentsPanelProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft('')
    setError(null)
  }, [selected?.id])

  const mine = selected ? comments.filter((c) => c.nodeId === selected.id) : []
  const openCount = mine.filter((c) => c.status !== 'resolved').length

  async function submit(): Promise<void> {
    if (!selected) return
    const body = draft.trim()
    if (!body) return
    setSubmitting(true)
    setError(null)
    try {
      const line = selected.location?.startLine
      await window.wc.comments.add({ nodeId: selected.id, body, line })
      setDraft('')
      onAdded()
    } catch (e) {
      setError(String(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-raised border-l border-border-subtle">
      <div className="flex items-center gap-2 px-3 h-9 border-b border-border-subtle bg-surface-raised shrink-0">
        <span className="text-ink-500 text-[11px] uppercase tracking-wider font-semibold">Comments</span>
        <span className="text-[10px] text-ink-400 font-mono px-1.5 py-0.5 rounded-sm bg-surface-inset border border-border-subtle">
          {mine.length}
        </span>
        {openCount > 0 ? <span className="text-[10px] text-warning/80">{openCount} open</span> : null}
        <div className="flex-1" />
        <CollapseButton
          onCollapse={onCollapse}
          canCollapse={canCollapse}
          chevron="left"
          label="Collapse comments panel"
        />
      </div>

      <div className="px-3 py-2.5 border-b border-border-subtle shrink-0">
        {selected ? (
          <div className="text-[11px]">
            <div className="text-ink-100 font-medium truncate flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-accent-blue" />
              {selected.name}
            </div>
            <div className="text-ink-500 font-mono truncate mt-0.5 pl-2.5">{selected.id}</div>
          </div>
        ) : (
          <div className="text-ink-500 text-[11px]">Select a node to comment on it.</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {mine.length === 0 ? (
            selected ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-ink-500 text-[12px] italic"
              >
                No comments yet. Add the first below.
              </motion.div>
            ) : null
          ) : (
            mine.map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={[
                  'rounded-md border px-2.5 py-2 text-[12px] transition-colors',
                  c.status === 'resolved'
                    ? 'border-border-subtle bg-surface-inset/50 opacity-60'
                    : 'border-border-subtle bg-surface-inset',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-sm bg-surface-overlay border border-border-strong flex items-center justify-center text-ink-300 text-[8px] font-bold">
                      {c.author.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-ink-400 text-[11px]">@{c.author}</span>
                    {c.line ? <span className="text-ink-500 font-mono text-[10px]">:{c.line}</span> : null}
                    {c.status !== 'open' ? (
                      <span className="text-[9px] uppercase tracking-wide text-success font-semibold">
                        {c.status}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onResolve(c.id)}
                    className="text-ink-500 hover:text-ink-200 text-[10px] transition-colors"
                    title={c.status === 'resolved' ? 'Reopen' : 'Resolve'}
                  >
                    {c.status === 'resolved' ? '↺ reopen' : '✓ resolve'}
                  </button>
                </div>
                <div className="text-ink-200 whitespace-pre-wrap break-words">{c.body}</div>
                <div className="text-ink-500 text-[10px] mt-1">{fmtTime(c.createdAt)}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-2.5 border-t border-border-subtle shrink-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit()
          }}
          disabled={!selected || submitting}
          placeholder={selected ? `Comment on ${selected.name}…  (⌘↵ to send)` : 'Select a node first'}
          rows={2}
          className="wc-focus w-full resize-none rounded-md bg-surface-inset border border-border-subtle px-2.5 py-2 text-[12px] text-ink-200 placeholder:text-ink-500 focus:border-accent-blue disabled:opacity-50 transition-colors"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-ink-500">
            {error ? <span className="text-danger">{error}</span> : 'Saved to sidecar on send'}
          </span>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!selected || submitting || !draft.trim()}
            className="text-[11px] px-3 py-1 rounded-md bg-accent-blue text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all"
          >
            {submitting ? 'Sending…' : 'Comment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
