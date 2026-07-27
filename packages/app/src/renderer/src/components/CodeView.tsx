/**
 * CodeView — Monaco editor showing the file behind a selected node.
 *
 * Loads the file via the preload `wc.code.read`, detects language from the
 * extension, scrolls to the node's line range, and decorates that range.
 */
import { useEffect, useRef, useState } from 'react'
import Editor, { loader, type OnMount } from '@monaco-editor/react'
import * as monacoEditor from 'monaco-editor'
import type { editor as MonacoEditor, IRange } from 'monaco-editor'
import type { WCNode } from '../lib/model.js'
import { CollapseButton } from './CollapseButton.js'
import { useTheme, type Theme } from '../theme.js'

// Offline Monaco: hand the bundled ESM monaco instance to @monaco-editor/react
// so it doesn't try to fetch from a CDN. Workers are configured below via the
// environment-specific URL imports (Vite handles these as separate chunks).
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// Monaco reads these globals to spin up language workers.
;(self as unknown as { MonacoEnvironment?: unknown }).MonacoEnvironment = {
  getWorker(_workerId: string, label: string): Worker {
    switch (label) {
      case 'json':
        return new jsonWorker()
      case 'css':
      case 'scss':
      case 'less':
        return new cssWorker()
      case 'html':
      case 'handlebars':
      case 'razor':
        return new htmlWorker()
      case 'typescript':
      case 'javascript':
        return new tsWorker()
      default:
        return new editorWorker()
    }
  },
}

loader.config({ monaco: monacoEditor })

export interface CodeViewProps {
  /** Currently-selected node, or null if nothing selected. */
  selected: WCNode | null
  /** Collapse this panel to a rail (called by the header chevron). */
  onCollapse?: () => void
  /** Whether collapse is allowed (disabled when it's the last open panel). */
  canCollapse?: boolean
}

interface CodeState {
  loading: boolean
  error: string | null
  file: string | null
  text: string
  range: IRange | null
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  json: 'json',
  jsonc: 'json',
  py: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin',
  md: 'markdown',
  yaml: 'yaml',
  yml: 'yaml',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sql: 'sql',
  sh: 'shell',
  php: 'php',
}

function detectLanguage(file: string): string {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  return LANGUAGE_BY_EXT[ext] ?? 'plaintext'
}

const THEME_NAME: Record<Theme, string> = { dark: 'walkingcode-dark', light: 'walkingcode-light' }

/** Define both Monaco themes on the editor instance. */
function defineMonacoThemes(monaco: typeof monacoEditor): void {
  monaco.editor.defineTheme('walkingcode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'keyword', foreground: '569cd6' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'type', foreground: '4ec9b0' },
      { token: 'function', foreground: 'dcdcaa' },
      { token: 'variable', foreground: '9cdcfe' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editorGutter.background': '#1e1e1e',
      'editor.lineHighlightBackground': '#2a2a2a',
      'editorLineNumber.foreground': '#4e4e4e',
      'editorLineNumber.activeForeground': '#858585',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#3a3d41',
      'editorCursor.foreground': '#aeafad',
      'editorIndentGuide.background1': '#333333',
      'editorIndentGuide.activeBackground1': '#4e4e4e',
      'editorBracketMatch.background': '#264f7855',
      'editorBracketMatch.border': '#3794ff55',
      'scrollbarSlider.background': '#3c3c3c80',
      'scrollbarSlider.hoverBackground': '#4e4e4eaa',
    },
  })
  monaco.editor.defineTheme('walkingcode-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'string', foreground: 'a31515' },
      { token: 'keyword', foreground: '0000ff' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267f99' },
      { token: 'function', foreground: '795e26' },
      { token: 'variable', foreground: '001080' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editorGutter.background': '#ffffff',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editorLineNumber.foreground': '#999999',
      'editorLineNumber.activeForeground': '#555555',
      'editor.selectionBackground': '#add6ff',
      'editor.inactiveSelectionBackground': '#cce5ff',
      'editorCursor.foreground': '#333333',
      'editorIndentGuide.background1': '#e0e0e0',
      'editorIndentGuide.activeBackground1': '#bbbbbb',
      'editorBracketMatch.background': '#add6ff55',
      'editorBracketMatch.border': '#0066cc55',
      'scrollbarSlider.background': '#c0c0c080',
      'scrollbarSlider.hoverBackground': '#999999aa',
    },
  })
}

export function CodeView({ selected, onCollapse, canCollapse = true }: CodeViewProps): React.JSX.Element {
  const { theme } = useTheme()
  const [state, setState] = useState<CodeState>({
    loading: false,
    error: null,
    file: null,
    text: '',
    range: null,
  })
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const decorationRef = useRef<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const loc = selected?.location
    if (!selected || !loc) {
      setState({ loading: false, error: null, file: null, text: '', range: null })
      return
    }
    setState((s) => ({ ...s, loading: true, error: null, file: loc.file }))
    window.wc.code
      .read(loc.file, loc.repo)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setState({ loading: false, error: res.message, file: loc.file, text: '', range: null })
          return
        }
        const start = loc.startLine ?? 1
        const end = loc.endLine ?? loc.startLine ?? start
        const range: IRange = {
          startLineNumber: Math.max(1, start),
          endLineNumber: Math.max(1, end),
          startColumn: 1,
          endColumn: 1,
        }
        setState({ loading: false, error: null, file: loc.file, text: res.text, range })
      })
      .catch((e) => {
        if (cancelled) return
        setState({ loading: false, error: String(e), file: loc.file, text: '', range: null })
      })
    return () => {
      cancelled = true
    }
  }, [selected])

  const handleMount: OnMount = (ed, monaco) => {
    editorRef.current = ed
    defineMonacoThemes(monaco)
    monaco.editor.setTheme(THEME_NAME[theme])
    applyDecoration()
    // When @monaco-editor/react swaps the model (path changes), re-reveal the
    // current range once the new model is attached. Without this, switching to a
    // different file leaves the highlight wherever the old scroll position was.
    ed.onDidChangeModel(() => {
      if (state.range) {
        window.setTimeout(() => revealRange(ed, state.range), 50)
      }
    })
  }

  // switch Monaco theme when the app theme changes
  useEffect(() => {
    const ed = editorRef.current
    if (ed) ed.updateOptions({})
    // monaco theme must be set via the monaco global, not the editor instance
    monacoEditor.editor.setTheme(THEME_NAME[theme])
  }, [theme])

  // when text/range change, reveal + decorate
  useEffect(() => {
    applyDecoration()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.text, state.range])

  function applyDecoration(): void {
    const ed = editorRef.current
    if (!ed) return
    if (decorationRef.current) {
      ed.deltaDecorations(decorationRef.current, [])
      decorationRef.current = null
    }
    if (state.range) {
      decorationRef.current = ed.deltaDecorations([], [
        {
          range: state.range,
          options: {
            isWholeLine: true,
            className: 'wc-line-highlight',
            overviewRuler: { color: '#5b8def', position: 1 /* OverviewRulerLane.Full */ },
          },
        },
      ])
      // Reveal in two passes: immediately (works for same-file switches where the
      // model is already populated) and after a short delay (covers the cross-file
      // case where @monaco-editor/react swaps the model + value asynchronously and
      // the line count isn't settled yet at the time of this call). Without the
      // delayed pass, the highlight lands below the fold and the user sees no jump.
      revealRange(ed, state.range)
      window.setTimeout(() => revealRange(ed, state.range), 60)
      // also move cursor to the start of the range so keyboard scroll feels right
      ed.setPosition({ lineNumber: state.range.startLineNumber, column: 1 })
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-inset">
      <div className="flex items-center gap-2 px-3 h-9 border-b border-border-subtle bg-surface-raised shrink-0">
        <span className="text-ink-500 text-[11px] uppercase tracking-wider font-semibold">Code</span>
        {state.file ? (
          <span className="flex items-center gap-1.5 text-ink-300 text-xs font-mono truncate">
            <span className="text-ink-400">›</span>
            {state.file}
            {state.range ? (
              <span className="text-ink-500 ml-1">
                :{state.range.startLineNumber}
                {state.range.endLineNumber !== state.range.startLineNumber
                  ? `–${state.range.endLineNumber}`
                  : ''}
              </span>
            ) : null}
          </span>
        ) : null}
        <div className="flex-1" />
        <CollapseButton
          onCollapse={onCollapse}
          canCollapse={canCollapse}
          chevron="right"
          label="Collapse code panel"
        />
      </div>
      <div className="flex-1 min-h-0 relative">
        {!selected ? (
          <EmptyHint />
        ) : !selected.location ? (
          <div className="p-5 text-sm wc-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-ink-300 font-medium">{selected.name}</span>
            </div>
            <div className="text-ink-500">This node has no clickable code location.</div>
          </div>
        ) : state.loading ? (
          <div className="p-5 text-ink-500 text-sm flex items-center gap-2.5 wc-fade-in">
            <div className="h-3.5 w-3.5 rounded-full border-2 border-border-strong border-t-accent-blue animate-spin" />
            Loading {state.file}…
          </div>
        ) : state.error ? (
          <div className="p-5 text-sm wc-fade-in">
            <div className="flex items-center gap-2 text-danger font-medium mb-1">
              <span>Couldn’t read {state.file}</span>
            </div>
            <div className="text-ink-400 text-xs font-mono">{state.error}</div>
          </div>
        ) : (
          <Editor
            path={state.file ?? undefined}
            language={state.file ? detectLanguage(state.file) : undefined}
            value={state.text}
            onMount={handleMount}
            theme={THEME_NAME[theme]}
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: true },
              fontSize: 13,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              lineNumbers: 'on',
              renderLineHighlight: 'all',
              scrollBeyondLastLine: false,
              smoothScrolling: true,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'off',
            }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Reveal a range so it's comfortably in view. If the model is tall enough, we
 * center it; if it's short (or the range is near the top), `revealLineInCenter`
 * would over-scroll, so fall back to `revealLineNearTop` for a gentler scroll.
 */
function revealRange(ed: MonacoEditor.IStandaloneCodeEditor, range: IRange): void {
  try {
    const model = ed.getModel()
    if (model && model.getLineCount() > 0) {
      ed.revealLineInCenter(range.startLineNumber)
    }
  } catch {
    /* editor/model not ready — the delayed retry will handle it */
  }
}

function EmptyHint(): React.JSX.Element {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center wc-fade-in">
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-surface-raised border border-border-subtle mb-3">
        <span className="text-ink-500 text-base">‹/›</span>
      </div>
      <div className="text-ink-300 font-medium mb-1">No code selected</div>
      <div className="text-ink-500 text-xs max-w-[200px]">
        Click a module or element in the diagram to read its code here.
      </div>
    </div>
  )
}
