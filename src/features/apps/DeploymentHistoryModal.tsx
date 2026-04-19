import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { getDeployments, getDeployment } from '../../lib/api'

export default function DeploymentHistoryModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getDeployments(appId).then(d => setItems(d)).catch(()=>{}).finally(()=>setLoading(false))
  }, [open, appId])

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Deployment history</h3>
      {loading ? <div className="text-sm text-[color:var(--muted)]">Loading...</div> : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {items.map(it => (
            <div key={it.id} className="border-b pb-2">
              <div className="text-sm font-mono">{it.id}</div>
              <div className="text-xs text-[color:var(--muted)]">{it.status} · {it.createdAt}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button className="px-3 py-1 bg-white border rounded" onClick={onClose}>Close</button>
      </div>
    </Modal>
  )
}
