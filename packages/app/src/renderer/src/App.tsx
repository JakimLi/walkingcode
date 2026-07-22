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
import { PanelRail } from './components/PanelRail'
import { CollapseButton } from './components/CollapseButton'

interface Loaded {
  archFile: string | null
  repo: string | null
  doc: LayeredDocument | null
  warnings: ParseWarning[]
  /** Hard parse error message, if the document failed to load. */
  error: string | null
}

/** The three resizable/collapsible panes. */
type PanelId = 'diagram' | 'code' | 'comments'
/** Order matters: the first *visible* panel absorbs freed space (becomes 1fr). */
const PANEL_ORDER: PanelId[] = ['diagram', 'code', 'comments']
const PANELS_KEY = 'wc:panel-layout'

/** Preferred width for each panel when it's not the absorb column. */
const PANEL_PREF_WIDTH: Record<PanelId, string> = {
  diagram: '1fr', // diagram is first → naturally the absorb column when visible
  code: 'minmax(420px, 42%)',
  comments: '320px',
}
const RAIL_WIDTH = '44px'

/** Read persisted panel visibility from localStorage (default: all open). */
function readPanels(): Record<PanelId, boolean> {
  const fallback: Record<PanelId, boolean> = { diagram: true, code: true, comments: true }
  try {
    const raw = localStorage.getItem(PANELS_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Record<PanelId, boolean>>
    return { diagram: parsed.diagram ?? true, code: parsed.code ?? true, comments: parsed.comments ?? true }
  } catch {
    return fallback
  }
}

/**
 * Compute the CSS grid-template-columns from panel visibility.
 * Collapsed → rail width. The first visible panel (in PANEL_ORDER) absorbs the
 * freed space via 1fr; the rest keep their preferred widths.
 */
function gridCols(panels: Record<PanelId, boolean>): string {
  const firstVisible = PANEL_ORDER.find((id) => panels[id]) ?? 'diagram'
  return PANEL_ORDER.map((id) => {
    if (!panels[id]) return RAIL_WIDTH
    if (id === firstVisible) return '1fr'
    return PANEL_PREF_WIDTH[id]
  }).join(' ')
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

  // ---- panel collapse state ----
  const [panels, setPanels] = useState<Record<PanelId, boolean>>(readPanels)

  // persist whenever visibility changes
  useEffect(() => {
    try {
      localStorage.setItem(PANELS_KEY, JSON.stringify(panels))
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [panels])

  const openCount = PANEL_ORDER.filter((id) => panels[id]).length

  const togglePanel = useCallback((id: PanelId) => {
    setPanels((prev) => {
      // don't allow collapsing the last open panel
      const open = PANEL_ORDER.filter((p) => prev[p]).length
      if (prev[id] && open <= 1) return prev
      return { ...prev, [id]: !prev[id] }
    })
  }, [])

  const cols = useMemo(() => gridCols(panels), [panels])

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
      <div className="flex-1 min-h-0 grid" style={{ gridTemplateColumns: cols }}>
        {/* ---- diagram (left) ---- */}
        <div className="relative min-w-0 border-r border-ink-700/60">
          {panels.diagram ? (
            <>
              <DiagramView
                doc={loaded.doc}
                comments={comments}
                selectedElementId={selectedElementId}
                onSelect={onSelect}
              />
              {/* floating collapse button — top-right of the diagram canvas */}
              <div className="absolute top-2.5 right-3 z-10 app-no-drag">
                <button
                  type="button"
                  onClick={() => togglePanel('diagram')}
                  disabled={openCount <= 1}
                  title={openCount <= 1 ? 'Keep at least one panel open' : 'Collapse diagram'}
                  aria-label="Collapse diagram"
                  className={[
                    'flex h-6 w-6 items-center justify-center rounded-md transition-colors backdrop-blur-sm',
                    openCount <= 1
                      ? 'bg-ink-850/70 text-ink-700 cursor-not-allowed'
                      : 'bg-ink-850/70 text-ink-500 hover:text-ink-100 hover:bg-ink-800 cursor-pointer',
                  ].join(' ')}
                >
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M8 3L4 6.5L8 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <PanelRail label="Diagram" chevron="right" onExpand={() => togglePanel('diagram')} />
          )}
        </div>

        {/* ---- code (middle) ---- */}
        <div className="min-w-0">
          {panels.code ? (
            <CodeView
              selected={liveSelected}
              onCollapse={() => togglePanel('code')}
              canCollapse={openCount > 1}
            />
          ) : (
            <PanelRail label="Code" chevron="right" onExpand={() => togglePanel('code')} />
          )}
        </div>

        {/* ---- comments (right) ---- */}
        {panels.comments ? (
          <CommentsPanel
            selected={liveSelected}
            comments={comments}
            onAdded={() => void reloadComments()}
            onResolve={onResolve}
            onCollapse={() => togglePanel('comments')}
            canCollapse={openCount > 1}
          />
        ) : (
          <PanelRail label="Comments" chevron="left" onExpand={() => togglePanel('comments')} />
        )}
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
