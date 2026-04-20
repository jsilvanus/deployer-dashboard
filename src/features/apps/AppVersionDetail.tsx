import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { getAppVersion } from '../../lib/api'
import type { AppVersion } from '../../lib/types'

export default function AppVersionDetail({ appId, versionId, open, onClose }: { appId: string; versionId: string; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [version, setVersion] = useState<AppVersion | null>(null)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    getAppVersion(appId, versionId).then(v => { if (mounted) setVersion(v) }).catch(() => { if (mounted) setVersion(null) }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [open, appId, versionId])

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Version {versionId}</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm font-mono">{version?.version ?? versionId}</div>
          {version?.createdAt && <div className="text-xs text-[color:var(--muted)]">Created: {version.createdAt}</div>}
          {version?.notes && <div className="text-sm whitespace-pre-wrap">{version.notes}</div>}
          {!version && <div className="text-sm text-[color:var(--muted)]">No metadata available</div>}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
