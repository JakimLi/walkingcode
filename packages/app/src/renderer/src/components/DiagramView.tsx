/**
 * DiagramView — hosts React Flow, registers custom node types, and feeds the
 * interaction context so node clicks bubble up to the App.
 *
 * Branches on `doc.kind`: `layered` uses the band/module/external pipeline;
 * `sequence` uses the participant/message pipeline. Both share the same React
 * Flow chrome (Background, MiniMap, Controls) and interaction context.
 */
import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import type { LayeredDocument, SequenceDocument } from '@wc-schema'
import type { Comment } from '@wc-schema'
import { buildModel } from '../lib/model.js'
import { layout } from '../lib/layout.js'
import { buildSequenceModel } from '../lib/sequenceModel.js'
import { layoutSequence } from '../lib/sequenceLayout.js'
import type { WCNode } from '../lib/model.js'
import type { PositionedModel } from '../lib/layout.js'
import { BandNode } from './nodes/BandNode.js'
import { ModuleNode } from './nodes/ModuleNode.js'
import { ExternalNode } from './nodes/ExternalNode.js'
import { ParticipantNode } from './nodes/ParticipantNode.js'
import { MessageNode } from './nodes/MessageNode.js'
import { DiagramCtx } from './nodes/diagramCtx.js'

const nodeTypes: NodeTypes = {
  wcBand: BandNode as unknown as NodeTypes[string],
  wcModule: ModuleNode as unknown as NodeTypes[string],
  wcExternal: ExternalNode as unknown as NodeTypes[string],
  wcParticipant: ParticipantNode as unknown as NodeTypes[string],
  wcMessage: MessageNode as unknown as NodeTypes[string],
}

export interface DiagramViewProps {
  doc: LayeredDocument | SequenceDocument
  comments: Comment[]
  selectedElementId: string | null
  onSelect: (node: WCNode) => void
}

function DiagramInner(props: DiagramViewProps): React.JSX.Element {
  const { doc, comments, selectedElementId, onSelect } = props

  const positioned = useMemo<PositionedModel>(() => {
    if (doc.kind === 'sequence') {
      return layoutSequence(buildSequenceModel(doc))
    }
    return layout(buildModel(doc))
  }, [doc])

  const commentCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of comments) m.set(c.nodeId, (m.get(c.nodeId) ?? 0) + 1)
    return m
  }, [comments])

  const interactions = useMemo(
    () => ({ onSelect, selectedElementId, commentCounts }),
    [onSelect, selectedElementId, commentCounts]
  )

  // React Flow mutates nodes internally; pass plain snapshots.
  const nodes = positioned.nodes as Node[]
  const edges = positioned.edges as Edge[]

  return (
    <DiagramCtx.Provider value={interactions}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.24, maxZoom: 1.0, minZoom: 0.4 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="#262626" />
        <MiniMap
          pannable
          zoomable
          maskColor="rgba(20,20,20,0.7)"
          style={{ background: 'transparent' }}
          nodeColor={(n) => {
            const kind = (n.data as { wc?: { kind?: string } })?.wc?.kind
            if (kind === 'module') return '#2d2d2d'
            if (kind === 'external') return '#333333'
            return '#252526'
          }}
          nodeStrokeWidth={1}
          nodeStroke="#3c3c3c"
        />
        <Controls showInteractive={false} position={6 /* BottomRight */} />
      </ReactFlow>
    </DiagramCtx.Provider>
  )
}

export function DiagramView(props: DiagramViewProps): React.JSX.Element {
  const noop = useCallback(() => {}, [])
  void noop
  return (
    <ReactFlowProvider>
      <DiagramInner {...props} />
    </ReactFlowProvider>
  )
}
