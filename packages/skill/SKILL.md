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
  Best for showing *how a system is structured*. Default for most web/service
  apps. See [`schema/layered.md`](./schema/layered.md).
- **`sequence`** — participants across the top with messages flowing top-to-bottom.
  Best for showing *how a single request/flow unfolds over time*. Use it when the
  story is "first A calls B, then B calls C, then C returns…". See
  [`schema/sequence.md`](./schema/sequence.md).

When unsure, pick `layered`. Choose `sequence` when the call order and the
back-and-forth between components matter more than the static layering.

### 2. Read the repo and lay out the structure

#### If `layered` — find the layers

Identify the layers top-to-bottom by *responsibility*, not by folder name. Common
patterns:

- Web/service app: UI → HTTP/controller → service/business-logic → repository/data-access → datastore
- Frontend-only: components → hooks/stores → API clients → external services
- Library: public API → internal modules → low-level primitives

You don't need every layer the codebase technically has — pick the ones that make
the *story you're telling* clear. Three to five layers is usually right.

Then fill in **modules** (units that group related code inside a layer, e.g.
`UserController`, `WebClient`) and **elements** (specific function / class /
method / handler *inside* a module). Only add elements when they're individually
interesting (an entry point, a key method, a business rule). Skip boilerplate.

#### If `sequence` — find the participants and the flow

List the **participants** — every component the flow touches, left-to-right in
call order. A participant is one actor/service/database; give it a `kind`
(`client | actor | service | database | external | other`) so the right icon
shows. Then write the **messages** in order: each is one interaction
(`from → to`) with a `label` (the method or request), a `kind`
(`call | return | event | async | other`), and an `order` if they're not already
in array order. Returns flow right-to-left and render as dashed arrows.

Pick a single, concrete flow to trace (e.g. "user logs in", "order is placed").
A good sequence diagram tells one story end-to-end; don't try to map every
possible interaction.

### 3. **Get the code locations right** — this is the whole point

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

### 4. Connect the flow

#### If `layered` — add edges

Edges connect nodes by **composite id**: `layerId/moduleId` or
`layerId/moduleId/elementId`. Examples: `"ui/web-client"`,
`"controller/UserController/listUsers"`. Add a `label` for the call/data
relationship (e.g. `"GET /api/users"`, `"findAll()"`). Add `kind`:
`call | data | event | depends | implements | extends | uses | other`.

Edges are what make the diagram tell a *story*. Prefer a small set of meaningful
edges over an exhaustive dependency graph.

#### If `sequence` — messages are the flow

You already wrote the messages in step 2. Each message's `location` should point
at the **line where the call actually happens** (the statement that invokes the
target), so clicking a message arrow opens that exact call site. A return
message's location can point at the `return` statement or the data hand-off.

## Tolerance — don't over-engineer

The schema is **deliberately forgiving**. Almost every field is optional. If you
don't know a value, **omit it** rather than guessing. Specifically:

- Missing `order` on a layer → the GUI uses array order.
- Missing `order` on a sequence message → the GUI uses array order.
- Missing `name` → falls back to `id`.
- Missing `location` → node renders but isn't clickable.
- Missing `edges` (layered) → nodes render without connections.
- Missing `repo` → the GUI may ask the user for the repo root.

**Never fabricate line numbers.** If you can't verify a location, omit it.

## Required reading before you generate

Read the schema reference for the kind you've chosen, then skim its example:

- [`schema/layered.md`](./schema/layered.md) — the full layered schema with field
  semantics and examples. Read this if `kind` is `layered`.
- [`schema/sequence.md`](./schema/sequence.md) — the full sequence schema. Read
  this if `kind` is `sequence`.
- [`examples/layered.example.json`](./examples/layered.example.json) — a complete,
  valid layered example you can copy and adapt.
- [`examples/sequence.example.json`](./examples/sequence.example.json) — a complete,
  valid sequence example.

## Output checklist (self-check before finishing)

- [ ] `kind` is `"layered"` or `"sequence"`.
- [ ] `repo` points at the repository root (relative to this file is fine).
- [ ] Every clickable node has a `location` with a real `file` and verified line
      range.
- [ ] **Layered:** layers have stable unique ids and a sensible `order`; edges
      reference existing composite ids with readable labels.
- [ ] **Sequence:** participants have stable unique ids; messages reference
      existing participant ids in `from`/`to` and are in the right order.
- [ ] You opened at least one referenced file to confirm line numbers are correct.
- [ ] The file is valid JSON (no comments, no trailing commas).

## After writing the file

Tell the user the path to the file. If the `walkingcode` CLI is available, offer
to run `walkingcode open <path>`. If they've already reviewed and left comments,
read them with `walkingcode comments list <path>` before iterating.
