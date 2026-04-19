import React from 'react'

/**
 * Modal - controlled dialog
 * @prop isOpen - whether modal is shown
 * @prop onClose - close handler
 */
export default function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children?: React.ReactNode }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-md p-6 shadow-lg z-50 max-w-lg w-full">
        {children}
      </div>
    </div>
  )
}
