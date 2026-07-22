/** Small visual helpers for node components — icons + comment badges. */
import type { ReactNode } from 'react'

/**
 * Tiny inline SVG glyphs keyed by element kind. Rendered in a 14px box so the
 * element rows stay aligned even when an icon is absent.
 */
export function ElementKindIcon({ kind }: { kind?: string }): ReactNode {
  const cls = 'inline-flex h-[14px] w-[14px] items-center justify-center text-[9px] font-bold rounded-[3px] leading-none'
  switch (kind) {
    case 'function':
    case 'method':
      return (
        <span title={kind} className={`${cls} bg-violet-500/15 text-violet-300`}>
          ƒ
        </span>
      )
    case 'class':
      return (
        <span title="class" className={`${cls} bg-amber-500/15 text-amber-300`}>
          C
        </span>
      )
    case 'interface':
      return (
        <span title="interface" className={`${cls} bg-sky-500/15 text-sky-300`}>
          I
        </span>
      )
    case 'type':
      return (
        <span title="type" className={`${cls} bg-sky-500/15 text-sky-300`}>
          T
        </span>
      )
    case 'handler':
      return (
        <span title="handler" className={`${cls} bg-emerald-500/15 text-emerald-300`}>
          ▸
        </span>
      )
    case 'hook':
      return (
        <span title="hook" className={`${cls} bg-pink-500/15 text-pink-300`}>
          ⎈
        </span>
      )
    case 'component':
      return (
        <span title="component" className={`${cls} bg-pink-500/15 text-pink-300`}>
          ◧
        </span>
      )
    default:
      return <span className="text-ink-500 font-mono text-[10px]">•</span>
  }
}

/** External node icon by kind. */
export function ExternalKindIcon({ kind }: { kind?: string }): ReactNode {
  switch (kind) {
    case 'store':
      return <span title="data store" className="text-emerald-300 text-[13px]">🗄</span>
    case 'queue':
      return <span title="queue" className="text-amber-300 text-[13px]">≡</span>
    case 'external-service':
      return <span title="external service" className="text-sky-300 text-[13px]">⬡</span>
    case 'cdn':
      return <span title="cdn" className="text-sky-300 text-[13px]">☁</span>
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
      className="inline-flex items-center justify-center min-w-[16px] h-[15px] px-1 rounded-full bg-accent/20 text-accent text-[10px] font-semibold ring-1 ring-inset ring-accent/30"
    >
      {count}
    </span>
  )
}
