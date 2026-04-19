import React from 'react'

/**
 * AreaChart - small filled area chart
 * @prop data - number[]
 */
export default function AreaChart({ data = [], color = 'rgba(3,102,214,0.15)', width = 200, height = 60 }: { data?: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const path = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={color} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
