# WalkingCode — Product Vision

> Walk an architecture diagram and the code behind it, side by side.

## The problem

When you read an unfamiliar codebase — or you ask an agent to review one — the gap
between **architecture** ("the request flows from the controller into the service,
then the repository, then the database") and **code** ("which exact lines of
`UserController.ts` implement that flow?") is painful. Diagrams live in one tool,
code in another, and the two are connected only by a human's memory.

When an agent proposes a refactor, the reviewer has to mentally rebuild that mapping
before they can judge it. That round-trip is where momentum dies.

## The vision

WalkingCode closes that gap with three cooperating pieces:

1. **A skill + schema (the "first part").** A coding agent reads a repo and emits a
   *single structured description file* that names the diagram type and the
   building blocks of the architecture — layers, modules, classes, calls, data
   flows. Critically, every block carries a **code location** (file + line range).
   The schema is **tolerant by design**: a partially-filled document still renders;
   missing fields degrade gracefully instead of failing.

2. **An Electron GUI (the "second part").** The description file is rendered as an
   interactive diagram — layered architecture for the MVP, later sequence,
   component, and others. Click any node → the exact code opens inline in a real
   editor (Monaco), scrolled and highlighted to the node's line range. You read a
   layer's job and its code at the same time.

3. **A CLI + comments loop (the "third part").** The CLI lets an agent open and
   close the GUI right after generating a description, so a "generate a code-review
   session" command ends with the diagram in front of the user. On the diagram, the
   user drops **comments** anchored to nodes (and optional lines). Comments persist
   to a sidecar file the agent reads back, driving the next round of refactoring.

The result is a tight human↔agent loop:

```
   agent ──generates──▶ description ──▶ GUI shows diagram + code
                                                │
                          user adds comments ◀──┤
                                                │
   agent ◀──reads comments── sidecar.json ◀─────┘
```

## Diagram types (roadmap)

- **Layered** (MVP) — vertical bands: UI → Controller → Service → Repository → Store.
  Modules live inside bands; calls/data flows are edges. The classic web stack.
- **Sequence** (next) — participants across the top, time flowing down; messages
  reference the methods that send/handle them.
- **Component** (later) — bounded contexts and their dependencies.
- **Deployment** (later) — runtime topology, processes, queues, data stores.

All types share `CodeLocation` so every kind is clickable.

## Why "walking"

You *walk* the architecture: layer by layer, call by call, reading the code at
each stop. It's a guided tour of a codebase, narrated by structure and grounded in
the real lines that implement it.

## Non-goals (for now)

- General-purpose UML tooling.
- Authoring diagrams by hand — the diagram is **generated** by an agent from code.
- Multi-repo, auth, packaged installers, online collaboration.
- Auto-applying refactors — the agent reads comments and *proposes* changes; the
  human still approves them.
