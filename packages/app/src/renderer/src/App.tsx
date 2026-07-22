/**
 * App — top-level renderer component.
 *
 * Wires the three panes together:
 *   - DiagramView (left) — the interactive architecture diagram
 *   - CodeView    (middle) — Monaco showing the selected node's code
 *   - CommentsPanel (right) — per-node comments
 *
 * State: the parsed document (or a hard parse error), the selected node, and the
 * comments (reloaded from the sidecar after each add).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LayeredDocument, ParseWarning, Comment } from '@wc-schema'
import type { ArchLoadResult, CodeReadError, CodeReadResult } from './types/preload'
import type { WCNode } from './lib/model'
import { Toolbar } from './components/Toolbar'
import { DiagramView } from './components/DiagramView'
import { CodeView } from './components/CodeView'
import { CommentsPanel } from './components/CommentsPanel'

interface Loaded {
  archFile: string | null
  repo: string | null
  doc: LayeredDocument | null
  warnings: ParseWarning[]
  /** Hard parse error message, if the document failed to load. */
  error: string | null
}

export default function App(): React.JSX.Element {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [selected, setSelected] = useState<WCNode | null>(null)
  const [comments, setComments] = useState<Comment[]>([])

  // initial load
  useEffect(() => {
    let cancelled = false
    window.wc.arch
      .load()
      .then((res: ArchLoadResult) => {
        if (cancelled) return
        if (res.parse.ok) {
          setLoaded({
            archFile: res.archFile,
            repo: res.repo,
            doc: res.parse.document as LayeredDocument,
            warnings: res.parse.warnings,
            error: null,
          })
        } else {
          setLoaded({
            archFile: res.archFile,
            repo: res.repo,
            doc: null,
            warnings: res.parse.warnings,
            error: res.parse.message,
          })
        }
      })
      .catch((e) => {
        if (cancelled) return
        setLoaded({ archFile: null, repo: null, doc: null, warnings: [], error: String(e) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reloadComments = useCallback(async () => {
    const file = await window.wc.comments.read()
    setComments(file.comments ?? [])
  }, [])

  useEffect(() => {
    void reloadComments()
  }, [reloadComments])

  const onSelect = useCallback((node: WCNode) => {
    setSelected(node)
  }, [])

  const onResolve = useCallback(
    async (id: string) => {
      await window.wc.comments.resolve(id)
      void reloadComments()
    },
    [reloadComments]
  )

  const selectedElementId = selected?.kind === 'element' ? selected.id : null
  const selectedId = selected?.id ?? null

  // keep `selected` fresh if its underlying data changed (e.g. after reload)
  const liveSelected = useMemo<WCNode | null>(() => {
    if (!selected) return null
    // the node objects come from the diagram; if the doc reloads we just keep it
    return selected
  }, [selected])

  // expose code read types to the bundle so the import isn't dropped under TS
  void (null as unknown as CodeReadResult | CodeReadError)

  if (!loaded) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-7 w-7 rounded-md border-2 border-ink-700 border-t-accent animate-spin" />
        <div className="text-ink-400 text-sm">Loading…</div>
      </div>
    )
  }

  if (loaded.error || !loaded.doc) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-inset ring-red-500/30 mb-4">
          <span className="text-red-400 text-xl">!</span>
        </div>
        <div className="text-red-300 font-medium mb-2">Couldn’t open the architecture file</div>
        <div className="text-ink-400 text-sm max-w-xl text-center">{loaded.error}</div>
        {loaded.archFile ? (
          <div className="text-ink-500 text-xs font-mono mt-3 px-2 py-1 rounded bg-ink-850 border border-ink-700">
            {loaded.archFile}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-ink-900">
      <Toolbar
        doc={loaded.doc}
        repo={loaded.repo}
        archFile={loaded.archFile}
        warnings={loaded.warnings}
        commentCount={comments.length}
        onReload={() => void reloadComments()}
      />
      <div className="flex-1 min-h-0 grid grid-cols-[1fr_minmax(420px,42%)_320px]">
        <div className="relative min-w-0 border-r border-ink-700/60">
          <DiagramView
            doc={loaded.doc}
            comments={comments}
            selectedElementId={selectedElementId}
            onSelect={onSelect}
          />
        </div>
        <div className="min-w-0">
          <CodeView selected={liveSelected} />
        </div>
        <CommentsPanel
          selected={liveSelected}
          comments={comments}
          onAdded={() => void reloadComments()}
          onResolve={onResolve}
        />
      </div>
      <StatusBar selectedId={selectedId} selected={liveSelected} />
    </div>
  )
}

function StatusBar({ selectedId, selected }: { selectedId: string | null; selected: WCNode | null }): React.JSX.Element {
  return (
    <div className="h-6 px-3 flex items-center gap-2.5 border-t border-ink-700/60 bg-ink-900/80 backdrop-blur-sm text-[11px] text-ink-500 shrink-0">
      <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_6px_rgba(107,160,255,0.6)]" />
      <span className="font-mono">{selectedId ?? '—'}</span>
      {selected?.location ? (
        <>
          <span className="text-ink-700">·</span>
          <span className="font-mono">
            {selected.location.file}
            {selected.location.startLine ? `:${selected.location.startLine}` : ''}
          </span>
        </>
      ) : null}
      <span className="flex-1" />
      <span className="text-ink-500">
        <kbd className="font-mono px-1 py-0.5 rounded bg-ink-800 border border-ink-700 text-ink-400">⌘↵</kbd>
        <span className="ml-1.5">post comment · click nodes to read code</span>
      </span>
    </div>
  )
}
