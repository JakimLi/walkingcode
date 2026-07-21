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
      className="rounded-xl border border-ink-700/70 bg-ink-900/50 relative"
    >
      {/* layer label — sits in the reserved BAND_LABEL_HEIGHT strip at the top */}
      <div className="absolute left-3 top-1.5 right-3 flex items-baseline gap-2">
        <span className="text-ink-400 text-xs uppercase tracking-wider font-semibold">
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
