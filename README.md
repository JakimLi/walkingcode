# WalkingCode

> Walk an architecture diagram and the code behind it, side by side.

See [`docs/VISION.md`](./docs/VISION.md) for the full product vision.

## What this is

Given a code repository, a coding agent (using the included
[`packages/skill`](./packages/skill)) emits a **structured architecture
description file**. WalkingCode's Electron GUI renders that file as an interactive
diagram. Each node carries a **code location** (file + line range); clicking a node
opens the exact code in an embedded editor. Users leave comments anchored to nodes;
comments persist to a sidecar file the agent reads back to drive refactoring. A CLI
lets the agent launch and close the GUI to close the loop.

```
   agent ──generates──▶ description ──▶ GUI: diagram + code
                                               │
                         user adds comments ◀──┤
                                               │
   agent ◀──reads comments── sidecar.json ◀────┘
```

## Repository layout

```
walkingcode/
├── packages/
│   ├── schema/   # shared tolerant zod schemas + types (the contract)
│   ├── skill/    # agent-facing SKILL.md + schema docs + examples
│   ├── cli/      # `walkingcode` CLI: open / close / comments
│   └── app/      # Electron + React + React Flow + Monaco GUI
├── examples/     # hand-written arch files
└── stubs/        # stub repos that example arch files point into
```

## Getting started (MVP)

```bash
# from repo root — installs all workspaces
npm install

# build the shared schema + CLI (the app builds via electron-vite separately)
npm run build:schema
npm run build:cli

# (one-time) validate the example arch file against the schema
node packages/cli/dist/index.js validate examples/layered-arch.json
```

### Launch the GUI on an arch file

```bash
# build the app once
npm run build:app

# launch via the CLI (background; records pid so `close` can stop it):
node packages/cli/dist/index.js open examples/layered-arch.json

# or directly via electron-vite during development (hot reload):
npm run dev
```

The example diagram is a 4-layer stack (`UI → Controller → Service → Repository`)
pointing at the stub code in [`stubs/demo-shop`](./stubs/demo-shop). Click a node
to see its code; drop a comment; the comment lands in
`examples/layered-arch.json.comments.json`.

### "Launched" but no window appears?

The CLI launches Electron detached and silences its output, so a startup failure
can look like a silent success. Two recovery paths:

```bash
# 1. Run in the foreground — electron's errors print straight to your terminal:
node packages/cli/dist/index.js open examples/layered-arch.json --foreground

# 2. If a previous run left a stale process holding the single-instance lock:
node packages/cli/dist/index.js open examples/layered-arch.json --force

# Or use the all-in-one diagnostic script (kills leftovers, foreground, logs):
node scripts/diag-launch.mjs examples/layered-arch.json
```

The app also writes a startup trace to `~/.walkingcode/runtime/app.log`. If you
**don't** see lines like `app ready` / `loading file` / `showing window` there,
the process is crashing before window creation — the foreground launch will show
you the stack trace.

### Read comments back (for the agent)

```bash
node packages/cli/dist/index.js comments list examples/layered-arch.json
```

## Status

This is the **MVP**: layered diagrams only, one example, no packaging. See
[`docs/VISION.md`](./docs/VISION.md) for the roadmap (sequence, component,
deployment diagrams; agent auto-generation runs).
