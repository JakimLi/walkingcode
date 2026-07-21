# @walkingcode/cli

The `walkingcode` command-line tool. Agents use it to **launch** the GUI right
after generating a description file, and to **read back** user comments so they
can act on review feedback.

## Commands

```
walkingcode open <arch-file> [--repo <path>] [--dev] [--dev-port <port>]
walkingcode close [--force]
walkingcode validate <arch-file> [--json]
walkingcode comments list <arch-file> [--status open|resolved|wontfix]
walkingcode comments read  <arch-file> [--id <id>]
```

### `open`
Launches the Electron GUI on an arch file. Records the process PID under
`~/.walkingcode/runtime/` so `close` can stop it. Only one instance at a time —
running `open` again while one's alive is an error (close first).

`--repo` overrides the arch file's `repo` field. `--dev` launches against the
electron-vite dev server (port 5173 by default) instead of the built bundle.

### `close`
SIGTERMs the running GUI and clears the PID lock. Idempotent.

### `validate`
Parses an arch file with the tolerant parser and reports. Exit codes: `0` ok,
`2` ok-with-warnings, `1` hard error. `--json` emits machine-readable output.

### `comments list` / `comments read`
Reads the sidecar `<arch-file>.comments.json`. `list` prints a compact
human-readable table; `read` emits one JSON object per line (or a single object
with `--id`). This is the agent's read-back path.

## Electron resolution

`open` finds the Electron binary in this order:

1. `$WALKINGCODE_ELECTRON` (absolute path override)
2. `packages/app/node_modules/electron`
3. `<repo>/node_modules/electron`
4. fallback to `npx electron`

In production (built app), it loads `packages/app/out/main/index.js`. In dev, it
loads `http://localhost:<devPort>`.

## Development

```bash
npm run build:cli     # via repo root, runs tsup
node packages/cli/dist/index.js --help
```
