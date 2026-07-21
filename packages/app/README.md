# @walkingcode/app

The WalkingCode desktop GUI — Electron + React + Vite, with React Flow for the
diagram and Monaco for the code view.

## Architecture

```
src/
├── main/            Electron main process
│   ├── index.ts       entry: argv → session → window
│   ├── args.ts        parse argv (arch file + repo override)
│   ├── ipc.ts         IPC handlers: arch:load, code:read, comments:*
│   ├── sidecar.ts     <arch-file>.comments.json path helper
│   └── ids.ts         comment id generator
├── preload/         contextBridge → window.wc
│   └── index.ts       exposes arch/code/comments RPC to renderer
└── renderer/        React app (electron-vite renderer build)
    ├── index.html     app shell
    └── src/
        ├── main.tsx     entry
        ├── App.tsx      top-level layout + state
        ├── styles.css   tailwind + theme overrides
        ├── lib/
        │   ├── model.ts   flatten doc → WCNode[]
        │   └── layout.ts  position nodes + edges for React Flow
        ├── components/
        │   ├── DiagramView.tsx     React Flow host
        │   ├── CodeView.tsx        Monaco, scrolls to selected range
        │   ├── CommentsPanel.tsx   per-node comments
        │   ├── Toolbar.tsx         title + repo + warnings
        │   └── nodes/
        │       ├── BandNode.tsx      layer band background
        │       ├── ModuleNode.tsx    module + element list
        │       ├── ExternalNode.tsx  external store/service
        │       ├── badges.tsx        icons + comment count badge
        │       └── diagramCtx.ts     interaction context
        └── types/        ambient declarations
```

## IPC contract (main ↔ renderer)

| channel           | direction | payload                       | returns                                   |
| ----------------- | --------- | ----------------------------- | ----------------------------------------- |
| `arch:load`       | r → m     | —                             | `{ archFile, repo, parse: ParseResult }` |
| `code:read`       | r → m     | `file, repo?`                 | `{ ok, file, text, totalLines } \| err`  |
| `comments:read`   | r → m     | —                             | `CommentsFile`                            |
| `comments:add`    | r → m     | `{ nodeId, body, line? }`     | `Comment`                                 |
| `comments:resolve`| r → m     | `id`                          | `Comment \| null`                         |

The renderer calls these via `window.wc.*` (typed in `types/preload.d.ts`).

## Development

```bash
# from repo root
npm install
npm run build:schema          # the app imports @walkingcode/schema source
npm run dev                   # electron-vite dev (hot reload)
```

To open it on the example file via the CLI (which spawns the built app):

```bash
npm run build:app
node packages/cli/dist/index.js open examples/layered-arch.json
```

## Notes

- **Monaco offline:** the renderer imports `monaco-editor` directly and hands the
  instance to `@monaco-editor/react`'s `loader.config`. Workers come from
  `?worker` imports so nothing is fetched from a CDN. CSP blocks remote.
- **Layout:** layered diagrams render layers as horizontal bands top→bottom,
  modules as cards in a row, elements as rows inside the module card. Edges
  connect modules; element-level endpoints snap to their owning module.
- **Path safety:** the main process refuses to read files outside the resolved
  repo root (best-effort sandbox for the MVP).
