import React from 'react'
import Sparkline from './ui/Sparkline'

/**
 * MetricTile - value with sparkline
 * @prop label - metric label
 * @prop value - display value
 * @prop data - sparkline data
 */
export default function MetricTile({ label, value, data = [] }: { label?: React.ReactNode; value?: React.ReactNode; data?: number[] }) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm w-56">
      <div className="text-xs text-[color:var(--muted)]">{label}</div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">{value}</div>
        <div className="w-24">
          <Sparkline data={data} width={80} height={28} color="var(--fg)" />
        </div>
      </div>
    </div>
  )
}
