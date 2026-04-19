import React, { useEffect, useRef, useState } from 'react'

/**
 * Menu - accessible dropdown menu
 * @prop label - button label
 * @prop items - array of { key, label, onClick }
 */
export default function Menu({ label, items }: { label: React.ReactNode; items: { key: string; label: React.ReactNode; onClick?: () => void }[] }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) menuRef.current?.querySelector('button')?.focus()
  }, [open])

  return (
    <div className="relative inline-block text-left">
      <button ref={btnRef} onClick={() => setOpen(v => !v)} className="px-3 py-1 bg-white border rounded-md">
        {label}
      </button>
      {open && (
        <ul ref={menuRef} className="absolute mt-2 w-48 bg-white border rounded-md shadow-sm">
          {items.map(it => (
            <li key={it.key}>
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-50"
                onClick={() => {
                  it.onClick?.()
                  setOpen(false)
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
