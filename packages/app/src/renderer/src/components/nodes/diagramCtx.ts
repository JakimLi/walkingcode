/**
 * Diagram interaction context — lets custom nodes report clicks back to the
 * DiagramView without prop-drilling through React Flow's node registry.
 */
import { createContext, useContext } from 'react'
import type { WCNode } from '../../lib/model.js'

export interface DiagramInteraction {
  /** Called when a module, element, or external node is clicked. */
  onSelect: (node: WCNode) => void
  /** Currently-selected element id (within a module) for highlight, if any. */
  selectedElementId: string | null
  /** Comment counts keyed by composite node id. */
  commentCounts: Map<string, number>
}

export const DiagramCtx = createContext<DiagramInteraction>({
  onSelect: () => {},
  selectedElementId: null,
  commentCounts: new Map(),
})

export function useDiagram(): DiagramInteraction {
  return useContext(DiagramCtx)
}
