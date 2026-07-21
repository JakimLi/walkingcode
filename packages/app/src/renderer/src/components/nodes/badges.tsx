/** Small visual helpers for node components — icons + comment badges. */
import type { ReactNode } from 'react'

/** Tiny inline SVG icons keyed by element kind. */
export function ElementKindIcon({ kind }: { kind?: string }): ReactNode {
  switch (kind) {
    case 'function':
    case 'method':
      return <span title={kind} className="text-violet-300 font-mono text-[10px]">ƒ</span>
    case 'class':
      return <span title="class" className="text-amber-300 font-mono text-[10px]">C</span>
    case 'interface':
      return <span title="interface" className="text-sky-300 font-mono text-[10px]">I</span>
    case 'type':
      return <span title="type" className="text-sky-300 font-mono text-[10px]">T</span>
    case 'handler':
      return <span title="handler" className="text-emerald-300 font-mono text-[10px]">▸</span>
    case 'hook':
      return <span title="hook" className="text-pink-300 font-mono text-[10px]">⎈</span>
    case 'component':
      return <span title="component" className="text-pink-300 font-mono text-[10px]">◧</span>
    default:
      return <span className="text-ink-400 font-mono text-[10px]">•</span>
  }
}

/** External node icon by kind. */
export function ExternalKindIcon({ kind }: { kind?: string }): ReactNode {
  switch (kind) {
    case 'store':
      return <span title="data store" className="text-emerald-300">🗄</span>
    case 'queue':
      return <span title="queue" className="text-amber-300">≡</span>
    case 'external-service':
      return <span title="external service" className="text-sky-300">⬡</span>
    case 'cdn':
      return <span title="cdn" className="text-sky-300">☁</span>
    default:
      return <span className="text-ink-400">◇</span>
  }
}

/** A small badge showing the count of comments anchored to this node. */
export function CommentBadge({ count }: { count: number }): ReactNode {
  if (!count) return null
  return (
    <span
      title={`${count} comment${count === 1 ? '' : 's'}`}
      className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-accent text-white text-[10px] font-medium"
    >
      {count}
    </span>
  )
}
