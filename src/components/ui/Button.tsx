import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode
}

export default function Button({ children, className = '', ...rest }: Props) {
  return (
    <button
      className={"px-4 py-2 rounded-md bg-[color:var(--accent)] text-white font-medium " + className}
      {...rest}
    >
      {children}
    </button>
  )
}
