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
      className="wc-node-surface relative overflow-hidden rounded-md border border-border-subtle/60 bg-surface-inset/60"
    >
      {/* layer label — sits in the reserved BAND_LABEL_HEIGHT strip at the top */}
      <div
        className="absolute left-4 right-4 top-0 flex items-center gap-2 border-b border-border-subtle/40"
        style={{ height: 32 }}
      >
        <span className="text-ink-300 text-[10px] uppercase tracking-[0.16em] font-semibold whitespace-nowrap">
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
