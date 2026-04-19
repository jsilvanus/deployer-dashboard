import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { patchApp, getApp } from '../../lib/api'
import AppRegistryModal from './AppRegistryModal'

export default function EditConfigModal({ appId, open, onClose, onSaved }: { appId: string; open: boolean; onClose: () => void; onSaved?: (val: any) => void }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [registryOpen, setRegistryOpen] = useState(false)
  const [corsEnabled, setCorsEnabled] = useState(false)
  const [allowedOriginsInput, setAllowedOriginsInput] = useState('')

  React.useEffect(() => {
    if (!open) return
    let mounted = true
    getApp(appId).then(a => {
      if (!mounted) return
      setName(a.name || '')
      setImage(a.image || '')
      try {
        const c = (a as any)?.cors || {}
        setCorsEnabled(!!c.enabled)
        setAllowedOriginsInput((c.allowedOrigins || []).join('\n'))
      } catch (e) {
        // ignore
      }
    }).catch(() => {})
    return () => { mounted = false }
  }, [open, appId])

  async function save() {
    setLoading(true)
    try {
      const cors = { enabled: corsEnabled, allowedOrigins: allowedOriginsInput.split(/\r?\n+/).map(s=>s.trim()).filter(Boolean) }
      const updated = await patchApp(appId, { name, image, cors })
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
      <div className="mt-3">
        <label className="block text-xs text-[color:var(--muted)]">Registry</label>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={()=>setRegistryOpen(true)}>Manage registry</Button>
          <div className="text-sm text-[color:var(--muted)] self-center">Configure per-app registry & test credentials</div>
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-xs text-[color:var(--muted)]">CORS</label>
        <div className="flex items-center gap-2 mb-2">
          <input id="cors-enabled" type="checkbox" checked={corsEnabled} onChange={e=>setCorsEnabled(e.target.checked)} />
          <label htmlFor="cors-enabled" className="text-sm">Enable CORS</label>
        </div>
        <label className="block text-xs text-[color:var(--muted)]">Allowed origins (one per line)</label>
        <textarea className="w-full border rounded px-2 py-1" rows={3} value={allowedOriginsInput} onChange={e=>setAllowedOriginsInput(e.target.value)} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
      </div>
      <AppRegistryModal appId={appId} open={registryOpen} onClose={()=>setRegistryOpen(false)} />
    </Modal>
  )
}
