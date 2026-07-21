---
name: walkingcode-arch
description: Generate a WalkingCode architecture description file for a code repository. Use when the user asks to "describe", "map", "review the architecture of", or produce a code-walkthrough diagram for a repo — the output is a single JSON file the WalkingCode GUI can render as an interactive diagram with clickable code locations.
---

# WalkingCode Architecture Skill

You are generating a **WalkingCode architecture description file**: a single JSON
document that the WalkingCode GUI renders as an interactive diagram. Every node
in the diagram can carry a **code location** (`file` + line range), and clicking
that node opens the exact code in an embedded editor. Your job is to read the
repo and produce that document accurately.

## When to use this skill

Trigger when the user wants a *visual* architecture walkthrough of a repo — phrasings
like "describe the architecture of repo X", "map the request flow", "make a
code-review diagram", or any ask to visualize how a system is layered or how calls
flow through it. If the user only wants prose, don't use this skill.

## The two outputs

1. **The description file** (always): write `<something>.arch.json`. This is what
   the GUI opens.
2. **(Optional) launch the GUI**: after writing the file, you may run
   `walkingcode open <path-to-file>` so the user immediately sees the diagram.

## How to produce the file

### 1. Pick a diagram kind

- **`layered`** — vertical bands (UI → controller → service → repository → store).
  Default for most web/service apps. **This is the only fully-supported kind
  today.** See [`schema/layered.md`](./schema/layered.md).
- `sequence` — stubbed, not yet supported. Avoid unless explicitly asked.

When unsure, pick `layered`.

### 2. Read the repo and find the layers

Identify the layers top-to-bottom by *responsibility*, not by folder name. Common
patterns:

- Web/service app: UI → HTTP/controller → service/business-logic → repository/data-access → datastore
- Frontend-only: components → hooks/stores → API clients → external services
- Library: public API → internal modules → low-level primitives

You don't need every layer the codebase technically has — pick the ones that make
the *story you're telling* clear. Three to five layers is usually right.

### 3. Fill in modules and elements

- A **module** is the unit that groups related code inside a layer (e.g.
  `UserController`, `WebClient`).
- An **element** is a specific function / class / method / handler *inside* a
  module. Only add elements when they're individually interesting (an entry point,
  a key method, a business rule). Skip boilerplate.

### 4. **Get the code locations right** — this is the whole point

For every node you want to be clickable, fill `location`:

```jsonc
"location": {
  "file": "server/service/UserService.ts",   // repo-relative path
  "startLine": 18,                            // 1-based, inclusive
  "endLine": 22,
  "symbol": "UserService.findAll"             // optional, human-readable
}
```

Rules:
- **Verify the line numbers.** Open the file, find the actual lines for the symbol,
  and record them precisely. Inaccurate ranges break the walkthrough.
- `endLine` defaults to `startLine` if omitted (single line).
- `file` is **relative to the repo root** set in the document's `repo` field.
- If a node has no meaningful code (e.g. an external database), omit `location`
  entirely — it will render as a non-clickable node. That's fine.
- A `location` may carry its own `repo` override if an element lives in a
  different repository than the document default.

### 5. Add edges for the flow

Edges connect nodes by **composite id**: `layerId/moduleId` or
`layerId/moduleId/elementId`. Examples: `"ui/web-client"`,
`"controller/UserController/listUsers"`. Add a `label` for the call/data
relationship (e.g. `"GET /api/users"`, `"findAll()"`). Add `kind`:
`call | data | event | depends | implements | extends | uses | other`.

Edges are what make the diagram tell a *story*. Prefer a small set of meaningful
edges over an exhaustive dependency graph.

## Tolerance — don't over-engineer

The schema is **deliberately forgiving**. Almost every field is optional. If you
don't know a value, **omit it** rather than guessing. Specifically:

- Missing `order` on a layer → the GUI uses array order.
- Missing `name` → falls back to `id`.
- Missing `location` → node renders but isn't clickable.
- Missing `edges` → nodes render without connections.
- Missing `repo` → the GUI may ask the user for the repo root.

**Never fabricate line numbers.** If you can't verify a location, omit it.

## Required reading before you generate

- [`schema/layered.md`](./schema/layered.md) — the full layered schema with field
  semantics and examples. **Read this first.**
- [`examples/layered.example.json`](./examples/layered.example.json) — a complete,
  valid example you can copy and adapt.

## Output checklist (self-check before finishing)

- [ ] `kind` is `"layered"` (unless you have a strong reason otherwise).
- [ ] `repo` points at the repository root (relative path is fine).
- [ ] Each layer has a stable, unique `id`; layers have a sensible `order` or are
      in the right array order.
- [ ] Every clickable node has a `location` with a real `file` and verified line
      range.
- [ ] Edges reference existing node composite ids and have a readable `label`.
- [ ] You opened at least one referenced file to confirm line numbers are correct.
- [ ] The file is valid JSON (no comments, no trailing commas).

## After writing the file

Tell the user the path to the file. If the `walkingcode` CLI is available, offer
to run `walkingcode open <path>`. If they've already reviewed and left comments,
read them with `walkingcode comments list <path>` before iterating.
