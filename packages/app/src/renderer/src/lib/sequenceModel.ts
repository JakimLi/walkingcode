/**
 * Sequence model: flatten a SequenceDocument into the shared WCModel shape.
 *
 * Participants become WCNodes (kind 'participant'); messages become WCEntries.
 * Messages also carry a CodeLocation so each interaction is clickable — same
 * contract as layered elements. A message without an explicit `id` gets a
 * synthesised `from->to#n` id so it can be anchored by comments.
 *
 * The layout engine (sequenceLayout.ts) consumes this model just like the
 * layered layout consumes buildModel()'s output.
 */
import type { SequenceDocument, Participant, Message } from '@wc-schema'
import type { WCModel, WCNode, WCEntry } from './model.js'

export type WCParticipantKind = Participant['kind']

export function buildSequenceModel(doc: SequenceDocument): WCModel {
  const nodes: WCNode[] = []
  const entries: WCEntry[] = []

  // participants → nodes (render order = array order)
  const participants = doc.participants ?? []
  participants.forEach((p: Participant, i: number) => {
    nodes.push({
      id: p.id,
      kind: 'participant',
      name: p.name ?? p.id,
      subKind: p.kind,
      description: p.description,
      location: p.location,
      tags: p.tags,
      order: i,
    })
  })

  // messages → entries; stable-render by optional `order`, else array order
  const messages = doc.messages ?? []
  const indexed = messages.map((m: Message, arrayIdx: number) => ({ m, arrayIdx }))
  indexed.sort((a, b) => {
    const ao = a.m.order ?? Number.MAX_SAFE_INTEGER
    const bo = b.m.order ?? Number.MAX_SAFE_INTEGER
    if (ao !== bo) return ao - bo
    return a.arrayIdx - b.arrayIdx
  })

  let seq = 0
  for (const { m, arrayIdx } of indexed) {
    const id = m.id ?? `${m.from}->${m.to}#${seq + 1}`
    entries.push({
      id,
      from: m.from,
      to: m.to,
      label: m.label,
      kind: m.kind,
      description: m.description,
      location: m.location,
    })
    seq++
  }

  return { nodes, layerOrder: [], entries }
}
