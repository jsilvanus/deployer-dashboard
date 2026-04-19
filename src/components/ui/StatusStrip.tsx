import React from 'react'

/**
 * StatusStrip - small horizontal status bars
 * @prop segments - array of {value:number, color:string}
 */
export default function StatusStrip({ segments = [], height = 8 }: { segments?: { value: number; color?: string }[]; height?: number }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1
  return (
    <div className="w-full flex overflow-hidden rounded" style={{ height }}>
      {segments.map((s, i) => (
        <div key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color || 'var(--accent)' }} />
      ))}
    </div>
  )
}
