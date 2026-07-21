/**
 * Layered layout: turn the WCModel into positioned React Flow nodes + edges.
 *
 * Layout rules (MVP):
 *   - Each layer is a horizontal band stacked top→bottom (order 0 on top).
 *   - Modules sit in a row inside their band.
 *   - Elements are rendered *inside* the module node's body (as a list), not as
 *     separate positioned nodes. Edges still target element composite ids; we
 *     map them to the owning module for positioning, but keep the element-level
 *     label/anchor for clicks.
 *   - External nodes form an implicit "External" band below all layers.
 *   - Edges connect module positions; element endpoints snap to their module.
 *
 * This keeps the diagram calm (no per-element node sprawl) while keeping the
 * clicks per-element. A future iteration can promote elements to real nodes
 * behind a "detailed" toggle.
 */
import type { Edge, Node } from '@xyflow/react'
import type { WCEntry, WCModel, WCNode } from './model.js'

// Visual constants (px).
// These are calibrated to match the rendered DOM in ModuleNode/BandNode —
// header padding + font line heights + element row padding + borders. If you
// change the Tailwind classes in ModuleNode, re-measure and update these so
// module cards stay inside their band.
const BAND_PADDING_Y = 36 // vertical gap between consecutive bands
const BAND_LABEL_HEIGHT = 30 // space reserved at the top of a band for its label
const BAND_BOTTOM_PADDING = 16 // space below the modules, inside the band
const BAND_SIDE_PADDING = 24 // band left/right inset (band x offset = 20; modules start at 20+24=44)
const MODULES_LEFT = 44 // x where the first module starts (= band x 20 + side 24)
const MODULE_WIDTH = 230
const MODULE_GAP_X = 40
const MODULE_MIN_HEIGHT = 96
// Measured module header (px-3 pt-2 pb-1.5 + name row + file path row + border):
const MODULE_HEADER_HEIGHT = 50
// Measured element row (px-3 py-1 + text-[12px] line + list py-1 amortised):
const ELEMENT_ROW_HEIGHT = 28
const MODULE_BORDER = 2 // top + bottom border on the module card
const EXTERNAL_BAND_ID = '__external__'

export interface PositionedModel {
  nodes: Node[]
  edges: Edge[]
  /** Total canvas height, for sizing the background. */
  height: number
  /** Total canvas width. */
  width: number
}

/** Extra data we attach to each RF node — surfaces in the custom node component. */
export interface WCNodeData extends Record<string, unknown> {
  wc: WCNode
  /** Elements that belong to a module (only set on module nodes). */
  elements?: WCNode[]
  selectedElementId?: string | null
}

/** Reverse-map element id -> owning module id, for edge endpoint snapping. */
function buildElementToModuleMap(model: WCModel): Map<string, string> {
  const m = new Map<string, string>()
  for (const n of model.nodes) {
    if (n.kind === 'element' && n.parentId) m.set(n.id, n.parentId)
  }
  return m
}

/** Find a node by id. */
function byId(model: WCModel): Map<string, WCNode> {
  return new Map(model.nodes.map((n) => [n.id, n]))
}

/** Resolve an edge endpoint to the module-level id that should be positioned. */
function resolveEndpoint(id: string, elementToModule: Map<string, string>, index: Map<string, WCNode>): string | null {
  if (index.has(id)) {
    // element or external or module — snap to module for elements
    const node = index.get(id)!
    if (node.kind === 'element') return elementToModule.get(id) ?? node.parentId ?? null
    return id
  }
  // unknown endpoint — ignore this edge
  return null
}

export function layout(model: WCModel): PositionedModel {
  const index = byId(model)
  const elementToModule = buildElementToModuleMap(model)

  // group modules by layer, in render order
  const modulesByLayer = new Map<string, WCNode[]>()
  const elementsByModule = new Map<string, WCNode[]>()
  const externals: WCNode[] = []

  for (const n of model.nodes) {
    if (n.kind === 'module') {
      const arr = modulesByLayer.get(n.parentId!) ?? []
      arr.push(n)
      modulesByLayer.set(n.parentId!, arr)
    } else if (n.kind === 'element') {
      const arr = elementsByModule.get(n.parentId!) ?? []
      arr.push(n)
      elementsByModule.set(n.parentId!, arr)
    } else if (n.kind === 'external') {
      externals.push(n)
    }
  }

  const rfNodes: Node[] = []
  let y = 20
  let maxWidth = 0

  // ---- layer bands ----
  for (const layerId of model.layerOrder) {
    const layer = index.get(layerId)
    if (!layer) continue
    const mods = modulesByLayer.get(layerId) ?? []

    // Compute each module's height from its element count, calibrated against
    // the real rendered DOM (header + rows + border). The band must be tall
    // enough to contain the TALLEST module + the label + bottom padding.
    const bandModules = mods.map((m) => {
      const els = elementsByModule.get(m.id) ?? []
      const height = Math.max(
        MODULE_MIN_HEIGHT,
        MODULE_HEADER_HEIGHT + els.length * ELEMENT_ROW_HEIGHT + MODULE_BORDER
      )
      return { mod: m, els, height }
    })

    const tallestModule = bandModules.length
      ? Math.max(...bandModules.map((b) => b.height))
      : MODULE_MIN_HEIGHT
    const bandHeight = BAND_LABEL_HEIGHT + tallestModule + BAND_BOTTOM_PADDING

    // Position modules in a row, starting at MODULES_LEFT.
    let x = MODULES_LEFT
    for (const { mod, els, height } of bandModules) {
      rfNodes.push({
        id: mod.id,
        type: 'wcModule',
        position: { x, y: y + BAND_LABEL_HEIGHT },
        data: { wc: mod, elements: els } as WCNodeData,
        width: MODULE_WIDTH,
        height,
      })
      x += MODULE_WIDTH + MODULE_GAP_X
    }
    // rowWidth spans from the band's left edge to the right edge of the last
    // module, plus the symmetric right padding.
    const modulesRight =
      MODULES_LEFT + bandModules.length * MODULE_WIDTH + Math.max(0, bandModules.length - 1) * MODULE_GAP_X
    const rowWidth = bandModules.length ? modulesRight + BAND_SIDE_PADDING : 200
    maxWidth = Math.max(maxWidth, rowWidth)

    // layer band background node (rendered behind modules). Width is sized to
    // exactly wrap the module row + side padding, height to wrap label +
    // tallest module + bottom padding.
    rfNodes.unshift({
      id: `band:${layerId}`,
      type: 'wcBand',
      position: { x: 20, y },
      data: { wc: layer, bandHeight } as WCNodeData & { bandHeight: number },
      draggable: false,
      selectable: false,
      width: rowWidth,
      height: bandHeight,
      zIndex: -1,
    })

    y += bandHeight + BAND_PADDING_Y
  }

  // ---- external band ----
  if (externals.length > 0) {
    let x = MODULES_LEFT
    const bandTop = y
    const externalWidth = 200
    const externalHeight = 80
    for (const ext of externals) {
      rfNodes.push({
        id: ext.id,
        type: 'wcExternal',
        position: { x, y: bandTop + BAND_LABEL_HEIGHT },
        data: { wc: ext } as WCNodeData,
        width: externalWidth,
        height: externalHeight,
      })
      x += externalWidth + MODULE_GAP_X
    }
    const modulesRight =
      MODULES_LEFT + externals.length * externalWidth + Math.max(0, externals.length - 1) * MODULE_GAP_X
    const rowWidth = modulesRight + BAND_SIDE_PADDING
    maxWidth = Math.max(maxWidth, rowWidth)

    rfNodes.unshift({
      id: `band:${EXTERNAL_BAND_ID}`,
      type: 'wcBand',
      position: { x: 20, y: bandTop },
      data: {
        wc: { id: EXTERNAL_BAND_ID, kind: 'layer', name: 'External', order: 999 } as WCNode,
        bandHeight: externalHeight + BAND_LABEL_HEIGHT + BAND_BOTTOM_PADDING,
      } as WCNodeData & { bandHeight: number },
      draggable: false,
      selectable: false,
      width: rowWidth,
      height: externalHeight + BAND_LABEL_HEIGHT + BAND_BOTTOM_PADDING,
      zIndex: -1,
    })
    y += externalHeight + BAND_LABEL_HEIGHT + BAND_BOTTOM_PADDING + BAND_PADDING_Y
  }

  // ---- edges (snapped to modules) ----
  const rfEdges: Edge[] = []
  for (const e of model.entries) {
    const from = resolveEndpoint(e.from, elementToModule, index)
    const to = resolveEndpoint(e.to, elementToModule, index)
    if (!from || !to) continue
    const id = `e:${e.from}->${e.to}`
    rfEdges.push({
      id,
      source: from,
      target: to,
      label: e.label,
      type: 'smoothstep',
      animated: e.kind === 'call' || e.kind === 'data',
      labelStyle: { fontSize: 11, fill: '#7a8497' },
      labelBgStyle: { fill: '#141821' },
      style: { stroke: edgeColor(e.kind), strokeWidth: 1.5 },
      data: { kind: e.kind, description: e.description },
    })
  }

  return {
    nodes: rfNodes,
    edges: rfEdges,
    height: y + 40,
    width: maxWidth,
  }
}

function edgeColor(kind?: string): string {
  switch (kind) {
    case 'call':
      return '#5b8def'
    case 'data':
      return '#a78bfa'
    case 'event':
      return '#34d399'
    default:
      return '#3a4250'
  }
}
