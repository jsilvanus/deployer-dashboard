import React, { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'

export default function SelfUpdateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [confirmText, setConfirmText] = useState('')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let t: any
    if (running) {
      t = setInterval(() => setProgress(p => Math.min(98, p + Math.random() * 12)), 700)
    }
    return () => clearInterval(t)
  }, [running])

  if (!open) return null

  async function startUpdate() {
    setRunning(true)
    setMessage(null)
    try {
      setProgress(4)
      const resp = await fetch('/setup/self-update', { method: 'POST' })
      setProgress(100)
      if (!resp.ok) {
        const txt = await resp.text()
        setMessage(txt || `Request failed: ${resp.status}`)
      } else {
        const data = await resp.json().catch(()=>null)
        setMessage((data && data.message) || 'Update completed')
        setTimeout(() => {
          setRunning(false)
          onClose()
        }, 900)
      }
    } catch (err: any) {
      setRunning(false)
      setMessage(String(err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-6 rounded-md w-[480px]">
        <h3 className="text-lg font-semibold mb-3">Self Update</h3>
        <p className="text-sm text-[color:var(--muted)]">Type <strong>UPDATE</strong> to confirm and run the self-update process.</p>

        <input className="w-full border p-2 rounded mt-3" value={confirmText} onChange={e => setConfirmText(e.target.value)} />

        {running && (
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded overflow-hidden">
              <div style={{ width: `${progress}%` }} className="h-full bg-[color:var(--accent)] transition-all" />
            </div>
            <div className="text-sm mt-2 text-[color:var(--muted)]">Running update... {Math.round(progress)}%</div>
          </div>
        )}

        {message && <div className="mt-3 text-sm text-[color:var(--muted)]">{message}</div>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={running}>Cancel</Button>
          <Button onClick={startUpdate} disabled={confirmText !== 'UPDATE' || running}>{running ? 'Updating...' : 'Start Update'}</Button>
        </div>
      </div>
    </div>
  )
}
