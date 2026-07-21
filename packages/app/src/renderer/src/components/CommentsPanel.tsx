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

export interface CommentsPanelProps {
  selected: WCNode | null
  comments: Comment[]
  onAdded: () => void
  onResolve: (id: string) => void
}

export function CommentsPanel({ selected, comments, onAdded, onResolve }: CommentsPanelProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDraft('')
    setError(null)
  }, [selected?.id])

  const mine = selected ? comments.filter((c) => c.nodeId === selected.id) : []

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
    <div className="flex flex-col h-full bg-ink-850 border-l border-ink-700">
      <div className="flex items-center justify-between px-3 h-9 border-b border-ink-700 bg-ink-850 shrink-0">
        <span className="text-ink-400 text-xs">Comments</span>
        <span className="text-ink-600 text-[11px]">{mine.length}</span>
      </div>

      <div className="px-3 py-2 border-b border-ink-700/60 shrink-0">
        {selected ? (
          <div className="text-[11px]">
            <div className="text-ink-200 font-medium truncate">{selected.name}</div>
            <div className="text-ink-600 font-mono truncate">{selected.id}</div>
          </div>
        ) : (
          <div className="text-ink-600 text-[11px]">Select a node to comment on it.</div>
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
                className="text-ink-600 text-[12px] italic"
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
                  'rounded-md border px-2.5 py-2 text-[12px]',
                  c.status === 'resolved'
                    ? 'border-ink-700 bg-ink-900/50 opacity-70'
                    : 'border-ink-700 bg-ink-900',
                ].join(' ')}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-400">@{c.author}</span>
                    {c.line ? <span className="text-ink-600 font-mono">:{c.line}</span> : null}
                    {c.status !== 'open' ? (
                      <span className="text-[10px] uppercase tracking-wide text-emerald-300">
                        {c.status}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => onResolve(c.id)}
                    className="text-ink-600 hover:text-ink-200 text-[10px]"
                    title={c.status === 'resolved' ? 'Reopen' : 'Resolve'}
                  >
                    {c.status === 'resolved' ? '↺ reopen' : '✓ resolve'}
                  </button>
                </div>
                <div className="text-ink-200 whitespace-pre-wrap break-words">{c.body}</div>
                <div className="text-ink-600 text-[10px] mt-1">{fmtTime(c.createdAt)}</div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="p-2 border-t border-ink-700 shrink-0">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit()
          }}
          disabled={!selected || submitting}
          placeholder={selected ? `Comment on ${selected.name}…  (⌘↵ to send)` : 'Select a node first'}
          rows={2}
          className="w-full resize-none rounded-md bg-ink-900 border border-ink-700 px-2 py-1.5 text-[12px] text-ink-200 placeholder:text-ink-600 focus:outline-none focus:border-accent disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-ink-600">
            {error ? <span className="text-red-400">{error}</span> : 'Saved to sidecar on send'}
          </span>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!selected || submitting || !draft.trim()}
            className="text-[11px] px-2 py-1 rounded bg-accent text-white disabled:opacity-40 hover:brightness-110"
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
