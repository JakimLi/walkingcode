/**
 * Renderer-internal model: the layered document flattened into a list of WCNodes
 * keyed by composite id, plus a list of WCEdges. The layout engine turns this
 * into React Flow nodes + edges with concrete x/y positions.
 *
 * Composite id convention (matches the schema's edge from/to):
 *   "layerId"                       — a layer band (rendered as a background group)
 *   "layerId/moduleId"              — a module node
 *   "layerId/moduleId/elementId"    — an element node
 *   "<externalId>"                  — an external node (no layer prefix)
 *
 * We carry `kind` so the renderer can style each node type differently.
 */
import type {
  LayeredDocument,
  Module,
  Element,
  ExternalNode,
} from '@wc-schema'

export type WCNodeKind = 'layer' | 'module' | 'element' | 'external'
export type WCExternalKind = ExternalNode['kind']

export interface WCNode {
  id: string
  kind: WCNodeKind
  /** Display name. */
  name: string
  /** Original element kind (function/class/...) for elements; external kind for externals. */
  subKind?: string
  description?: string
  /** Clickable code location, if present. */
  location?: { repo?: string; file: string; startLine?: number; endLine?: number; symbol?: string }
  tags?: string[]
  /** Stable parent id (layer id for modules, module id for elements). */
  parentId?: string
  /** Render order within its parent. */
  order: number
  /** Whether at least one comment is anchored here (set after comments load). */
  commentCount?: number
}

export interface WCEntry {
  from: string
  to: string
  label?: string
  kind?: string
  description?: string
}

export interface WCModel {
  /** A flat list of nodes (layers, modules, elements, externals), stable order. */
  nodes: WCNode[]
  /** Layers in render order (top to bottom). */
  layerOrder: string[]
  /** Edges as-authored. */
  entries: WCEntry[]
}

/** Build the flat model from a parsed layered document. */
export function buildModel(doc: LayeredDocument): WCModel {
  const nodes: WCNode[] = []
  const layerOrder: string[] = []

  // sort layers by explicit order then array order
  const sortedLayers = [...(doc.layers ?? [])].sort((a, b) => {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER
    const bo = b.order ?? Number.MAX_SAFE_INTEGER
    return ao - bo
  })

  sortedLayers.forEach((layer, layerIdx) => {
    layerOrder.push(layer.id)
    nodes.push({
      id: layer.id,
      kind: 'layer',
      name: layer.name ?? layer.id,
      description: layer.description,
      order: layerIdx,
      tags: layer.tags,
    })
    ;(layer.modules ?? []).forEach((mod, mi) => {
      pushModule(nodes, mod, layer.id, mi)
    })
  })

  ;(doc.externalNodes ?? []).forEach((ext, i) => {
    nodes.push({
      id: ext.id,
      kind: 'external',
      name: ext.name ?? ext.id,
      subKind: ext.kind,
      description: ext.description,
      location: ext.location,
      tags: ext.tags,
      order: i,
    })
  })

  const entries: WCEntry[] = (doc.edges ?? []).map((e) => ({
    from: e.from,
    to: e.to,
    label: e.label,
    kind: e.kind,
    description: e.description,
  }))

  return { nodes, layerOrder, entries }
}

function pushModule(nodes: WCNode[], mod: Module, layerId: string, idx: number): void {
  const id = `${layerId}/${mod.id}`
  nodes.push({
    id,
    kind: 'module',
    name: mod.name ?? mod.id,
    description: mod.description,
    location: mod.location,
    tags: mod.tags,
    parentId: layerId,
    order: idx,
  })
  ;(mod.elements ?? []).forEach((el, ei) => pushElement(nodes, el, id, ei))
}

function pushElement(nodes: WCNode[], el: Element, moduleId: string, idx: number): void {
  nodes.push({
    id: `${moduleId}/${el.id}`,
    kind: 'element',
    name: el.name ?? el.id,
    subKind: el.kind,
    description: el.description,
    location: el.location,
    tags: el.tags,
    parentId: moduleId,
    order: idx,
  })
}
