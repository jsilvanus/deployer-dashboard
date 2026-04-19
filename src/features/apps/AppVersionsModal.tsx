import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { getAppVersions, postUpdate } from '../../lib/api'

export default function AppVersionsModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [versions, setVersions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    getAppVersions(appId).then(v => { if (mounted) setVersions(v) }).catch(() => { if (mounted) setVersions([]) }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [open, appId])

  async function updateLatest() {
    if (!confirm('Update to latest version?')) return
    setUpdating(true)
    try {
      await postUpdate(appId)
      onClose()
    } catch (e) {
      // ignore
    } finally { setUpdating(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">App versions</h3>
      {loading ? (
        <div>Loading versions…</div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-auto">
          {versions.length === 0 && <div className="text-sm text-[color:var(--muted)]">No versions available</div>}
          {versions.map(v => (
            <div key={v.id} className="p-2 border rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-mono text-sm">{v.version}</div>
                  {v.notes && <div className="text-xs text-[color:var(--muted)]">{v.notes}</div>}
                </div>
                {v.upstream && <div className="text-xs px-2 py-1 bg-gray-100 rounded">upstream</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        <Button variant="primary" size="sm" onClick={updateLatest} disabled={updating || versions.length===0}>{updating ? 'Updating...' : 'Update to latest'}</Button>
      </div>
    </Modal>
  )
}
