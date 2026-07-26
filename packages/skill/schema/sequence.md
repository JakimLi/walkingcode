# Sequence Diagram Schema (`walkingcode.sequence.v1`)

The sequence kind renders **participants** across the top (each owning a vertical
lifeline) and **messages** flowing top-to-bottom between them. Time runs downward;
each message is one interaction (`from → to`). Every participant and message can
carry a **CodeLocation** so the diagram stays clickable — same contract as
`layered`.

> **Tolerance:** every field below is optional except `kind`, the message
> `from`/`to`, and `file` (when a `location` is present). Unknown fields are
> preserved, not rejected. If you're unsure of a value, omit it.

## Top-level document

```jsonc
{
  "$schema": "walkingcode.sequence.v1",  // optional, conventional
  "kind": "sequence",                    // REQUIRED — must be the literal "sequence"
  "schemaVersion": "v1",                 // optional, defaults to "v1"
  "repo": "../path/to/repo",             // optional, repo root (relative to this file or absolute)
  "title": "Checkout — Payment Flow",    // optional
  "description": "...",                  // optional
  "participants": [ /* Participant[] */ ], // optional, defaults to []
  "messages": [ /* Message[] */ ],       // optional, defaults to []
  "meta": { /* any */ }                  // optional, free-form (timestamp, model, etc.)
}
```

## CodeLocation (shared building block)

Used by participants and messages. `file` is **repo-relative**.

```jsonc
{
  "repo": "../other-repo",   // optional override of the document-level repo
  "file": "src/foo.ts",      // REQUIRED when a location object is present
  "startLine": 14,           // optional, 1-based inclusive
  "endLine": 21,             // optional, defaults to startLine
  "symbol": "Foo.bar"        // optional, human-readable
}
```

## Participant

A participant is one actor in the sequence, drawn as a header card with a dashed
lifeline below it. `id` is referenced by message `from`/`to`.

```jsonc
{
  "id": "authService",               // REQUIRED, unique within the document
  "name": "Auth Service",            // optional, falls back to id
  "kind": "service",                 // optional: actor | service | database | client | external | other
  "description": "...",              // optional
  "location": { /* CodeLocation */ },// optional, e.g. the file the service lives in
  "tags": ["core"]                   // optional
}
```

`kind` controls the icon:
- `client` — a browser/app initiating calls
- `actor` — a human user
- `service` — a backend service/controller
- `database` — a data store
- `external` — a third-party system
- `other` — fallback

## Message

A message is one interaction between two participants. Rendered as a horizontal
arrow from the sender's lifeline to the receiver's at the message's vertical
position. `from`/`to` reference participant `id`s directly (flat — no composite
path).

```jsonc
{
  "id": "m3",                    // optional, defaults to "from->to#n"
  "from": "authService",         // REQUIRED, a participant id
  "to": "userRepo",              // REQUIRED, a participant id
  "label": "findByEmail(email)", // optional, shown on the arrow
  "kind": "call",                // optional: call | return | event | async | other
  "description": "...",          // optional
  "location": { /* CodeLocation */ }, // optional, the line where the call happens
  "order": 2,                    // optional, lower = higher; falls back to array order
  "tags": ["db"]                 // optional
}
```

`kind` controls the arrow style:
- `call` — solid arrow with a filled head (the default)
- `return` — dashed arrow flowing right-to-left
- `async` — dashed arrow (fire-and-forget)
- `event` — solid arrow, distinct colour
- `other` — solid arrow, muted colour

**Tip:** a `return` message should have `to` < `from` in participant order so the
arrow visually flows backward along the same lifelines.

## A complete minimal example

```jsonc
{
  "kind": "sequence",
  "repo": "./my-repo",
  "title": "Login Flow",
  "participants": [
    { "id": "client", "name": "Web Client", "kind": "client",
      "location": { "file": "src/api.ts", "startLine": 5, "symbol": "login" } },
    { "id": "auth", "name": "Auth Service", "kind": "service",
      "location": { "file": "server/auth.ts", "startLine": 12, "symbol": "AuthService" } },
    { "id": "db", "name": "User DB", "kind": "database" }
  ],
  "messages": [
    { "from": "client", "to": "auth", "label": "login(email, pwd)", "kind": "call",
      "location": { "file": "src/api.ts", "startLine": 8, "symbol": "login.fetch" }, "order": 0 },
    { "from": "auth", "to": "db", "label": "findUser(email)", "kind": "call",
      "location": { "file": "server/auth.ts", "startLine": 15, "symbol": "AuthService.login" }, "order": 1 },
    { "from": "db", "to": "auth", "label": "user row", "kind": "return", "order": 2 },
    { "from": "auth", "to": "client", "label": "token", "kind": "return",
      "location": { "file": "server/auth.ts", "startLine": 20, "symbol": "AuthService.login.return" }, "order": 3 }
  ]
}
```

See [`examples/sequence.example.json`](../examples/sequence.example.json) for a
realistic multi-participant example.
