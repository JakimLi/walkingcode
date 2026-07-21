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
      className="rounded-xl border border-ink-700/60 bg-ink-900/40 relative"
    >
      <div className="absolute left-3 top-2 text-ink-400 text-xs uppercase tracking-wider font-medium">
        {wc.name}
      </div>
      {wc.description ? (
        <div className="absolute left-3 bottom-2 text-ink-600 text-[10px] max-w-[60%] truncate">
          {wc.description}
        </div>
      ) : null}
    </div>
  )
}

export const BandNode = memo(BandImpl)
