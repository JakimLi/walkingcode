# Layered Architecture Schema (`walkingcode.layered.v1`)

The layered kind renders a vertical stack of **layers**, each containing
**modules**, each containing **elements**. **Edges** connect any two nodes by
composite id. External systems (databases, queues) live in `externalNodes`.

> **Tolerance:** every field below is optional except `kind` and `file` (when a
> `location` is present). Unknown fields are preserved, not rejected. If you're
> unsure of a value, omit it.

## Top-level document

```jsonc
{
  "$schema": "walkingcode.layered.v1",   // optional, conventional
  "kind": "layered",                     // REQUIRED — must be the literal "layered"
  "schemaVersion": "v1",                 // optional, defaults to "v1"
  "repo": "../path/to/repo",             // optional, repo root (relative to this file or absolute)
  "title": "My App — Request Flow",      // optional
  "description": "...",                  // optional
  "layers": [ /* Layer[] */ ],           // optional, defaults to []
  "externalNodes": [ /* ExternalNode[] */ ], // optional
  "edges": [ /* Edge[] */ ],             // optional
  "meta": { /* any */ }                  // optional, free-form (timestamp, model, etc.)
}
```

## CodeLocation (shared building block)

Used by modules, elements, edges, and external nodes. `file` is **repo-relative**.

```jsonc
{
  "repo": "../other-repo",   // optional override of the document-level repo
  "file": "src/foo.ts",      // REQUIRED when a location object is present
  "startLine": 14,           // optional, 1-based inclusive
  "endLine": 21,             // optional, defaults to startLine
  "symbol": "Foo.bar"        // optional, human-readable
}
```

## Layer

```jsonc
{
  "id": "service",            // REQUIRED, unique within document
  "name": "Service Layer",    // optional, falls back to id
  "order": 2,                 // optional, lower = higher in stack; falls back to array order
  "description": "...",       // optional
  "modules": [ /* Module[] */ ],
  "tags": ["core"]            // optional
}
```

## Module

```jsonc
{
  "id": "UserService",        // REQUIRED, unique within its layer
  "name": "User Service",     // optional
  "description": "...",       // optional
  "location": { /* CodeLocation */ },   // optional, module-level (e.g. the file)
  "elements": [ /* Element[] */ ],
  "tags": ["..."]
}
```

## Element

```jsonc
{
  "id": "findAll",            // REQUIRED, unique within its module
  "name": "findAll()",        // optional
  "kind": "method",           // optional: function | class | method | interface | type | handler | hook | component | other
  "description": "...",       // optional
  "location": { /* CodeLocation */ },
  "tags": ["async"]
}
```

## ExternalNode

A node that lives outside the layers (a database, queue, external service). It's
referenced by edges just like any other node, using its `id` directly.

```jsonc
{
  "id": "postgres",           // REQUIRED, unique within document
  "name": "PostgreSQL",       // optional
  "kind": "store",            // optional: store | queue | external-service | cdn | other
  "description": "...",       // optional
  "location": { /* CodeLocation */ },   // usually omitted
  "tags": ["..."]
}
```

## Edge

Connects two nodes. `from` / `to` are **composite ids**:

- layer: `"service"`
- module: `"service/UserService"`
- element: `"service/UserService/findAll"`
- external node: `"postgres"`

```jsonc
{
  "from": "ui/web-client/fetchUsers",
  "to": "controller/UserController/listUsers",
  "label": "GET /api/users",          // optional, shown on the edge
  "kind": "call",                     // optional: call | data | event | depends | implements | extends | uses | other
  "description": "...",               // optional
  "location": { /* CodeLocation */ }  // optional, where the call is made
}
```

## Composite id format

`layerId` / `moduleId` / `elementId`, trailing parts omitted as needed.
Never use raw slashes inside an id component — keep ids slug-like
(`UserController`, not `User Controller` or `user/controller`).

## A complete minimal example

```jsonc
{
  "kind": "layered",
  "repo": "./my-repo",
  "title": "Minimal",
  "layers": [
    { "id": "ui", "name": "UI", "modules": [
      { "id": "app", "elements": [
        { "id": "render", "location": { "file": "src/app.tsx", "startLine": 1 } }
      ] }
    ] },
    { "id": "api", "name": "API", "modules": [
      { "id": "handler", "location": { "file": "src/handler.ts", "startLine": 10, "endLine": 20 } }
    ] }
  ],
  "edges": [
    { "from": "ui/app/render", "to": "api/handler", "label": "fetch" }
  ]
}
```

See [`examples/layered.example.json`](../examples/layered.example.json) for a
realistic 4-layer example.
