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

export function CodeView({ selected, onCollapse, canCollapse = true }: CodeViewProps): React.JSX.Element {
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
    // define a theme that matches the app
    monaco.editor.defineTheme('walkingcode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '525c6e', fontStyle: 'italic' },
        { token: 'string', foreground: '9ece6a' },
        { token: 'keyword', foreground: '6ba0ff' },
        { token: 'number', foreground: 'ff9e64' },
        { token: 'type', foreground: 'b794f6' },
        { token: 'function', foreground: '7dcfff' },
      ],
      colors: {
        'editor.background': '#0b0d12',
        'editorGutter.background': '#0b0d12',
        'editor.lineHighlightBackground': '#10131a',
        'editorLineNumber.foreground': '#2a313d',
        'editorLineNumber.activeForeground': '#8b95a7',
        'editor.selectionBackground': '#1d3a6b',
        'editor.inactiveSelectionBackground': '#16243f',
        'editorCursor.foreground': '#6ba0ff',
        'editorIndentGuide.background1': '#151922',
        'editorIndentGuide.activeBackground1': '#2a313d',
        'editorBracketMatch.background': '#1d3a6b55',
        'editorBracketMatch.border': '#6ba0ff55',
        'scrollbarSlider.background': '#2a313d80',
        'scrollbarSlider.hoverBackground': '#3a4250aa',
      },
    })
    monaco.editor.setTheme('walkingcode-dark')
    applyDecoration()
  }

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
      ed.revealRangeInCenter(state.range)
      // also move cursor to the start of the range so keyboard scroll feels right
      ed.setPosition({ lineNumber: state.range.startLineNumber, column: 1 })
    }
  }

  return (
    <div className="flex flex-col h-full bg-ink-900">
      <div className="flex items-center gap-2 px-3 h-9 border-b border-ink-700/60 bg-ink-850/50 shrink-0">
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
            <div className="h-3.5 w-3.5 rounded-full border-2 border-ink-700 border-t-accent animate-spin" />
            Loading {state.file}…
          </div>
        ) : state.error ? (
          <div className="p-5 text-sm wc-fade-in">
            <div className="flex items-center gap-2 text-red-300 font-medium mb-1">
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
            theme="walkingcode-dark"
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

function EmptyHint(): React.JSX.Element {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center wc-fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-850 ring-1 ring-inset ring-ink-700 mb-3">
        <span className="text-ink-500 text-lg">‹/›</span>
      </div>
      <div className="text-ink-300 font-medium mb-1">No code selected</div>
      <div className="text-ink-500 text-xs max-w-[200px]">
        Click a module or element in the diagram to read its code here.
      </div>
    </div>
  )
}
