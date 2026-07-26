# WalkingCode

> Turn a codebase into an interactive architecture diagram your team can actually review.

AI coding agents ship code fast — faster than humans can keep up. The harder
problem has shifted from *writing* code to **reviewing** it: diffs pile up,
context is scattered, and the big picture — how the pieces fit, where the flow
goes — gets lost. WalkingCode closes that gap.

A coding agent reads the repo and emits a small **architecture description
file**. WalkingCode renders it as an interactive diagram — layered or sequence —
where **every node links to the exact code behind it**. Click a node, read the
code, leave a comment. The agent reads the comments back and iterates. Review
regains its spine.

```
   agent ──generates──▶ architecture ──▶ GUI: diagram + code
   reads repo             description         │
                                            ┌──┴──┐
                          user reviews ◀──── │     │ leaves comments
                            the diagram      │     │
                                                ▼
   agent ◀── reads comments ── sidecar.json ◀─┘
```

## The problem

Code review was already hard. AI-generated code makes it harder:

- **Diff-first, structure-last.** Reviewers meet a change as a wall of diffs,
  not as a coherent addition to an architecture. The "why" drowns in the "what".
- **No map.** Even a clean diff doesn't show how a request flows through the
  system or which layer owns what. Reviewers reconstruct this in their heads,
  every time.
- **Feedback is disconnected.** Comments live in a PR thread, detached from the
  code locations they're about, and invisible to the agent that wrote the code.

WalkingCode gives reviewers a **map** — a diagram with clickable code locations
and anchored comments that feed straight back into the agent loop.

## How it works

1. **The agent maps the repo.** Using the bundled
   [`walkingcode-arch` skill](./packages/skill/SKILL.md), a coding agent walks
   the codebase and writes a single JSON file: the architecture description.
   Every node carries a `CodeLocation` — a real `file` + line range, verified
   against the source.
2. **WalkingCode renders it.** The GUI (Electron + React + React Flow + Monaco)
   turns that file into an interactive diagram. Two kinds are supported:
   - **Layered** — vertical bands (UI → controller → service → repository).
     Best for *"how is this structured?"*
   - **Sequence** — participants across the top, messages flowing top-to-bottom.
     Best for *"how does this request unfold?"*
3. **You review with code one click away.** Click any module, element, or
   message to open the exact source in an embedded editor. The node you're
   inspecting is highlighted; its line range is pinned.
4. **You leave comments, anchored to nodes.** Comments persist to a sidecar
   `.comments.json` file — keyed by node id + optional line number.
5. **The agent reads them back.** The CLI exposes the comments, so the agent
   picks up your review notes and iterates. The loop closes.

## Install

### One line (macOS & Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/JakimLi/walkingcode/main/scripts/install.sh | bash
```

This clones the repo, installs dependencies (including the Electron binary),
builds everything, and links the `walkingcode` command onto your `PATH`.
Re-running it updates to the latest version.

> **Windows** — the one-line installer isn't supported yet. Clone the repo and
> build manually (see below).

### Manual

```bash
git clone https://github.com/JakimLi/walkingcode.git
cd walkingcode
npm install
npm run build:schema
npm run build:cli
npm run build:app
```

Then invoke the CLI via `node packages/cli/dist/index.js …`, or symlink it
yourself:

```bash
sudo ln -s "$(pwd)/packages/cli/dist/index.js" /usr/local/bin/walkingcode
```

**Requirements:** Node.js >= 20, git.

## Quick start

Open the bundled example and explore it:

```bash
walkingcode validate examples/layered-arch.json   # sanity-check the file
walkingcode open examples/layered-arch.json        # launch the GUI
```

Once the window is open:

- **Click a node** (module, element, or external system) to read its code on the
  right.
- **Drop a comment** in the comments panel — `⌘↵` (or `Ctrl+↵`) to send.
- **Collapse panes** with the chevrons in each panel header to focus on one view.

Read the comments back (what the agent consumes to iterate):

```bash
walkingcode comments list examples/layered-arch.json
```

Try the sequence diagram too:

```bash
walkingcode open examples/sequence-auth.json
```

## The agent loop

WalkingCode is built to sit inside an agent workflow, not beside it.

**Generating a description file.** Point your coding agent at the
[`walkingcode-arch` skill](./packages/skill/SKILL.md). It will read the target
repo, pick a diagram kind, and write a `<name>.arch.json` with **verified** code
locations. The skill enforces one rule above all: *never fabricate line numbers*
— if a location can't be confirmed, omit it.

The description file format is documented in:

- [`packages/skill/schema/layered.md`](./packages/skill/schema/layered.md) — the
  layered schema.
- [`packages/skill/schema/sequence.md`](./packages/skill/schema/sequence.md) — the
  sequence schema.

**Closing the loop.** After you review the diagram and leave comments, the agent
reads them and continues:

```bash
walkingcode comments list <your-file>.arch.json            # all comments
walkingcode comments list <your-file>.arch.json --status open   # just open ones
walkingcode comments read <your-file>.arch.json --id c-3   # one as JSON
```

Comments land in `<your-file>.arch.json.comments.json`, anchored by node id and
optional line number — the agent knows exactly what to act on.

## Diagram kinds

| Kind | Answers | Layout |
|------|---------|--------|
| `layered` | *How is this system structured?* | Vertical bands of layers → modules → elements. |
| `sequence` | *How does this request unfold over time?* | Participants across the top; messages flow top-to-bottom. |

Both share the same `CodeLocation` contract, so every node stays clickable and
the comments panel works identically.

## Repository layout

```
walkingcode/
├── packages/
│   ├── schema/   # shared zod schemas + types (the contract)
│   ├── skill/    # agent-facing SKILL.md + schema docs + examples
│   ├── cli/      # `walkingcode` CLI: open / close / validate / comments
│   └── app/      # Electron + React + React Flow + Monaco GUI
├── examples/     # hand-written arch files (layered + sequence)
├── stubs/        # stub repos that example arch files point into
└── scripts/      # install.sh — one-line installer
```

## Status & roadmap

WalkingCode is at **MVP**. Today it supports layered and sequence diagrams with
clickable code, anchored comments, and the agent read-back loop.

On the roadmap:

- **More diagram kinds** — component and deployment views.
- **Packaged releases** — signed `.dmg` / `.exe` / `.AppImage` builds, so the
  GUI installs without a local build step. (Today the Electron app is built
  from source; the CLI launches the local build.)
- **`npm install -g`** — global CLI install once the app is distributed as a
  downloadable artifact.

See [`docs/VISION.md`](./docs/VISION.md) for the full vision.

## License

[MIT](./LICENSE)
