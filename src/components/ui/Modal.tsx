import React, { useEffect, useRef } from 'react'

/**
 * Modal - controlled dialog
 * @prop isOpen - whether modal is shown
 * @prop onClose - close handler
 */
export default function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // focus the modal container
    containerRef.current?.querySelector<HTMLElement>('button, [tabindex]')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      try { prev?.focus() } catch (e) { /* noop */ }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" role="presentation">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div ref={containerRef} role="dialog" aria-modal="true" className="relative bg-white rounded-md p-6 shadow-lg z-50 max-w-lg w-full" aria-label="Dialog">
        {children}
      </div>
    </div>
  )
}
