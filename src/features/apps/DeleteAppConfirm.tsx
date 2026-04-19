import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { deleteApp } from '../../lib/api'

export default function DeleteAppConfirm({ appId, appName, open, onClose, onDeleted }: { appId: string; appName: string; open: boolean; onClose: () => void; onDeleted?: () => void }) {
  const [typed, setTyped] = useState('')
  const [loading, setLoading] = useState(false)

  async function confirm() {
    if (typed !== appName) return
    setLoading(true)
    try {
      await deleteApp(appId)
      onDeleted?.()
      onClose()
    } catch (e) {
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Delete app</h3>
      <div className="text-sm text-[color:var(--muted)] mb-3">Type the app name <span className="font-mono">{appName}</span> to confirm deletion. This action cannot be undone.</div>
      <input value={typed} onChange={e=>setTyped(e.target.value)} className="w-full border rounded px-2 py-1 font-mono" />
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={confirm} disabled={loading || typed !== appName}>{loading ? 'Deleting...' : 'Delete'}</Button>
      </div>
    </Modal>
  )
}
