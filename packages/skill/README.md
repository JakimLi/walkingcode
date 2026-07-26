# @walkingcode/skill

The agent-facing skill for generating WalkingCode architecture description files.

This package contains **no code** — it's a documentation asset bundle:

- [`SKILL.md`](./SKILL.md) — the skill instructions an agent follows.
- [`schema/layered.md`](./schema/layered.md) — the human-readable layered schema
  reference.
- [`schema/sequence.md`](./schema/sequence.md) — the human-readable sequence
  schema reference.
- [`examples/layered.example.json`](./examples/layered.example.json) — a complete,
  valid layered example an agent can copy and adapt.
- [`examples/sequence.example.json`](./examples/sequence.example.json) — a complete,
  valid sequence example.

## How an agent uses it

1. Read [`SKILL.md`](./SKILL.md) end-to-end.
2. Read the schema reference for the chosen kind:
   - [`schema/layered.md`](./schema/layered.md) for `kind: "layered"`, or
   - [`schema/sequence.md`](./schema/sequence.md) for `kind: "sequence"`.
3. Look at the matching example as a template:
   - [`examples/layered.example.json`](./examples/layered.example.json), or
   - [`examples/sequence.example.json`](./examples/sequence.example.json).
4. Walk the target repo, fill in layers/modules/elements (or
   participants/messages) with **verified** code locations, and write the result
   as `<name>.arch.json`.

The machine-readable schema (zod) lives in
[`@walkingcode/schema`](../schema); the GUI parses documents with that package.
These `*.md` references and the machine schema are kept in sync by hand for now.
