import React from 'react'

type Variant = 'primary' | 'secondary' | 'icon'
type Size = 'sm' | 'md' | 'lg'

/**
 * Button primitive
 * @param props - HTML button props with `variant` and `size`
 */
export default function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; }) {
  const variantCls = {
    primary: 'bg-[color:var(--accent)] text-white shadow-[0_6px_0_rgba(0,0,0,0.06)] hover:brightness-95',
    secondary: 'bg-white text-[color:var(--fg)] border border-gray-200',
    icon: 'bg-transparent text-[color:var(--fg)] p-1'
  }[variant]

  const sizeCls = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }[size]

  const accentOffset = variant === 'primary' ? 'ring-2 ring-[color:var(--accent)]/20' : ''

  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-md font-medium transition-transform transition-shadow duration-150 ease-out focus:outline-none',
        variantCls,
        sizeCls,
        accentOffset,
        'hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30',
        className
      ].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
