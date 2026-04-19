import React from 'react'

/**
 * Drawer - slide-in panel from the right
 * @prop isOpen - whether drawer is visible
 * @prop onClose - close handler
 */
export default function Drawer({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children?: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-40 pointer-events-none ${isOpen ? '' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black/30 pointer-events-auto" onClick={onClose} />
      <aside className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg p-4 pointer-events-auto`}>{children}</aside>
    </div>
  )
}
