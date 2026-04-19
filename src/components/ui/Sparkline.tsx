import React from 'react'

/**
 * Sparkline - small inline svg sparkline
 * @prop data - array of numbers
 * @prop color - stroke color
 */
export default function Sparkline({ data = [], color = 'currentColor', width = 100, height = 24 }: { data?: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return <svg width={width} height={height} />
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline fill="none" stroke={color} strokeWidth={1.5} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
