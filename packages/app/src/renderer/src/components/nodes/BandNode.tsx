/** wcBand — the layer background band. Shows the layer name on the left. */
import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { WCNodeData } from '../../lib/layout.js'

function BandImpl({ data, width, height }: NodeProps): React.JSX.Element {
  const wcData = data as WCNodeData & { bandHeight?: number }
  const wc = wcData.wc
  return (
    <div
      style={{ width, height }}
      className="wc-node-surface relative overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.015]"
    >
      {/* faint left accent rule + top highlight so the band reads as a tray */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* layer label — sits in the reserved BAND_LABEL_HEIGHT strip at the top,
          vertically centred within it so the uppercase name + description have
          comfortable space and never get clipped by the band's top edge. */}
      <div
        className="absolute left-4 right-4 top-0 flex items-center gap-2.5 border-b border-white/[0.04]"
        style={{ height: 32 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-accent/70 shadow-[0_0_8px_rgba(107,160,255,0.6)]" />
        <span className="text-ink-300 text-[11px] uppercase tracking-[0.14em] font-semibold whitespace-nowrap">
          {wc.name}
        </span>
        {wc.description ? (
          <span className="text-ink-500 text-[10px] truncate">{wc.description}</span>
        ) : null}
      </div>
    </div>
  )
}

export const BandNode = memo(BandImpl)
