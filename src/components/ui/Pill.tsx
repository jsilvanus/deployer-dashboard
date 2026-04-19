import React from 'react'

/**
 * Pill - compact uppercase monogram
 * @prop children - content (string or node)
 * @prop size - 'sm' | 'md'
 */
export default function Pill({ children, size = 'sm', className = '' }: { children: React.ReactNode; size?: 'sm' | 'md'; className?: string }) {
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-xs rounded-full' : 'px-3 py-1 text-sm rounded-full'
  return (
    <span className={[
      'inline-flex items-center justify-center uppercase tracking-widest bg-[color:var(--accent)] text-white font-semibold',
      sizeCls,
      className
    ].join(' ')}>
      {children}
    </span>
  )
}
