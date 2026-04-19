import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { patchApp, getApp } from '../../lib/api'

export default function EditConfigModal({ appId, open, onClose, onSaved }: { appId: string; open: boolean; onClose: () => void; onSaved?: (val: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')

  React.useEffect(() => {
    if (!open) return
    let mounted = true
    getApp(appId).then(a => {
      if (!mounted) return
      setName(a.name || '')
      setImage(a.image || '')
    }).catch(() => {})
    return () => { mounted = false }
  }, [open, appId])

  async function save() {
    setLoading(true)
    try {
      const updated = await patchApp(appId, { name, image })
      onSaved?.(updated)
      onClose()
    } catch (e) {
      // ignore for now
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Edit app configuration</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Name</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Image</label>
          <input value={image} onChange={e=>setImage(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </div>
    </Modal>
  )
}
