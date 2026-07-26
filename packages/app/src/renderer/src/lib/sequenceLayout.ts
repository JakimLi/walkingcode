/**
 * Sequence layout: turn the WCModel (built from a SequenceDocument) into
 * positioned React Flow nodes + edges.
 *
 * Layout rules:
 *   - Participants are placed in a row across the top, evenly spaced.
 *   - Each participant node is tall enough to span the whole diagram so its
 *     body draws a dashed lifeline downward.
 *   - Each message becomes both:
 *       (a) a React Flow edge (source=from participant, target=to participant)
 *           with the message label and an arrow — this draws the horizontal
 *           arrow at the message's y position;
 *       (b) a small invisible "tap point" node at the same y, carrying the
 *           message's CodeLocation so clicking the message selects + opens code.
 *   - Time flows top→down: message y increases with render order.
 *
 * Output is the same PositionedModel shape the layered layout produces, so the
 * downstream React Flow wiring is identical.
 */
import type { Node } from '@xyflow/react'
import type { WCModel, WCNode } from './model.js'
import type { PositionedModel, WCNodeData } from './layout.js'

// Visual constants (px).
const CHART_PADDING_X = 60
const CHART_TOP = 56 // space above the first participant card
const PARTICIPANT_WIDTH = 180
const PARTICIPANT_GAP_X = 64
const PARTICIPANT_CARD_HEIGHT = 56 // the visible header card
const MESSAGE_GAP_Y = 72 // vertical distance between consecutive messages
const LIFELINE_BOTTOM_PAD = 80 // extra height below the last message

export function layoutSequence(model: WCModel): PositionedModel {
  const participants = model.nodes.filter((n) => n.kind === 'participant')
  const messages = model.entries
  const index = new Map(participants.map((p) => [p.id, p]))

  // ---- participant x positions ----
  const xOf = (i: number): number => CHART_PADDING_X + i * (PARTICIPANT_WIDTH + PARTICIPANT_GAP_X)

  const totalMessages = messages.length
  const lifelineHeight =
    CHART_TOP + PARTICIPANT_CARD_HEIGHT + Math.max(1, totalMessages) * MESSAGE_GAP_Y + LIFELINE_BOTTOM_PAD

  const rfNodes: Node[] = []
  let maxWidth = 0

  // ---- participant nodes (lifelines) ----
  participants.forEach((p, i) => {
    const x = xOf(i)
    const node: Node = {
      id: p.id,
      type: 'wcParticipant',
      position: { x, y: CHART_TOP },
      data: { wc: p } as WCNodeData,
      width: PARTICIPANT_WIDTH,
      height: lifelineHeight,
      // participants aren't draggable (consistent with layered modules)
      draggable: false,
    }
    rfNodes.push(node)
    maxWidth = Math.max(maxWidth, x + PARTICIPANT_WIDTH + CHART_PADDING_X)
  })

  // ---- message tap-point nodes ----
  // Each message is a node spanning the from→to x range at its y. The node
  // draws the arrow + label internally (cheaper than RF edge routing across
  // tall lifeline nodes) and carries the message's CodeLocation for clicks.
  messages.forEach((msg, mi) => {
    const fromP = index.get(msg.from)
    const toP = index.get(msg.to)
    if (!fromP || !toP) return // unknown participant — skip

    const fromIdx = participants.indexOf(fromP)
    const toIdx = participants.indexOf(toP)
    const fromX = xOf(fromIdx) + PARTICIPANT_WIDTH / 2
    const toX = xOf(toIdx) + PARTICIPANT_WIDTH / 2

    const y = CHART_TOP + PARTICIPANT_CARD_HEIGHT + 24 + mi * MESSAGE_GAP_Y

    const tapId = `msg:${msg.id ?? mi}`
    const minX = Math.min(fromX, toX)
    const maxX = Math.max(fromX, toX)
    const isReturn = toX < fromX // right-to-left → a return message
    rfNodes.push({
      id: tapId,
      type: 'wcMessage',
      position: { x: minX, y: y - 14 },
      data: {
        wc: {
          id: msg.id ?? tapId,
          kind: 'message' as unknown as WCNode['kind'],
          name: msg.label ?? `${msg.from} → ${msg.to}`,
          subKind: msg.kind,
          description: msg.description,
          location: msg.location,
          order: mi,
        } as WCNode,
        messageMeta: { fromX, toX, kind: msg.kind, isReturn },
      } as WCNodeData & { messageMeta: { fromX: number; toX: number; kind?: string; isReturn: boolean } },
      width: maxX - minX || 20,
      height: 28,
      draggable: false,
      selectable: true,
      zIndex: 5,
    })
  })

  return {
    nodes: rfNodes,
    edges: [],
    height: lifelineHeight + CHART_PADDING_X,
    width: maxWidth,
  }
}
