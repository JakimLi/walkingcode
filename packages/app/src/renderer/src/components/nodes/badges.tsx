/** Small visual helpers for node components — icons + comment badges. */
import type { ReactNode } from 'react'

/**
 * Tiny inline glyphs keyed by element kind. Flat monochrome chips — Codex-style
 * keeps syntax indicators subtle rather than colorful.
 */
export function ElementKindIcon({ kind }: { kind?: string }): ReactNode {
  const cls = 'inline-flex h-[14px] w-[14px] items-center justify-center text-[9px] font-bold leading-none text-ink-500'
  switch (kind) {
    case 'function':
    case 'method':
      return (
        <span title={kind} className={cls}>ƒ</span>
      )
    case 'class':
      return (
        <span title="class" className={cls}>C</span>
      )
    case 'interface':
      return (
        <span title="interface" className={cls}>I</span>
      )
    case 'type':
      return (
        <span title="type" className={cls}>T</span>
      )
    case 'handler':
      return (
        <span title="handler" className={`${cls} text-edge-event`}>▸</span>
      )
    case 'hook':
      return (
        <span title="hook" className={cls}>⎈</span>
      )
    case 'component':
      return (
        <span title="component" className={cls}>◧</span>
      )
    default:
      return <span className="text-ink-500 font-mono text-[10px]">•</span>
  }
}

/** External node icon by kind. */
export function ExternalKindIcon({ kind }: { kind?: string }): ReactNode {
  switch (kind) {
    case 'store':
      return <span title="data store" className="text-edge-event text-[13px]">🗄</span>
    case 'queue':
      return <span title="queue" className="text-warning text-[13px]">≡</span>
    case 'external-service':
      return <span title="external service" className="text-edge-call text-[13px]">⬡</span>
    case 'cdn':
      return <span title="cdn" className="text-edge-call text-[13px]">☁</span>
    default:
      return <span className="text-ink-400 text-[13px]">◇</span>
  }
}

/** Participant icon by kind (sequence diagrams). */
export function ParticipantKindIcon({ kind }: { kind?: string }): ReactNode {
  switch (kind) {
    case 'client':
      return <span title="client" className="text-edge-call text-[13px]">🖥</span>
    case 'actor':
      return <span title="actor" className="text-edge-call text-[13px]">🙂</span>
    case 'service':
      return <span title="service" className="text-edge-event text-[13px]">⚙</span>
    case 'database':
      return <span title="database" className="text-warning text-[13px]">🗄</span>
    case 'external':
      return <span title="external" className="text-ink-400 text-[13px]">⬡</span>
    default:
      return <span className="text-ink-400 text-[13px]">◇</span>
  }
}

/** A small badge showing the count of comments anchored to this node. */
export function CommentBadge({ count }: { count: number }): ReactNode {
  if (!count) return null
  return (
    <span
      title={`${count} comment${count === 1 ? '' : 's'}`}
      className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-sm bg-accent-blue/20 text-accent-blue text-[10px] font-medium"
    >
      {count}
    </span>
  )
}
