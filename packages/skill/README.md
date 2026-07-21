# @walkingcode/skill

The agent-facing skill for generating WalkingCode architecture description files.

This package contains **no code** — it's a documentation asset bundle:

- [`SKILL.md`](./SKILL.md) — the skill instructions an agent follows.
- [`schema/layered.md`](./schema/layered.md) — the human-readable layered schema
  reference.
- [`examples/layered.example.json`](./examples/layered.example.json) — a complete,
  valid example an agent can copy and adapt.

## How an agent uses it

1. Read [`SKILL.md`](./SKILL.md) end-to-end.
2. Read [`schema/layered.md`](./schema/layered.md) for the exact field semantics.
3. Look at [`examples/layered.example.json`](./examples/layered.example.json) as a
   template.
4. Walk the target repo, fill in layers / modules / elements with **verified** code
   locations, and write the result as `<name>.arch.json`.

The machine-readable schema (zod) lives in
[`@walkingcode/schema`](../schema); the GUI parses documents with that package.
This `*.md` reference and the machine schema are kept in sync by hand for now.
