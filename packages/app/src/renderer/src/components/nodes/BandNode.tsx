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
      className="rounded-xl border border-ink-700/70 bg-ink-900/50 relative overflow-hidden"
    >
      {/* layer label — sits in the reserved BAND_LABEL_HEIGHT strip at the top,
          vertically centred within it so the uppercase name + description have
          comfortable space and never get clipped by the band's top edge. */}
      <div
        className="absolute left-3 right-3 top-0 flex items-center gap-2 border-b border-ink-700/40"
        style={{ height: 32 }}
      >
        <span className="text-ink-400 text-[11px] uppercase tracking-[0.12em] font-semibold whitespace-nowrap">
          {wc.name}
        </span>
        {wc.description ? (
          <span className="text-ink-600 text-[10px] truncate">{wc.description}</span>
        ) : null}
      </div>
    </div>
  )
}

export const BandNode = memo(BandImpl)
