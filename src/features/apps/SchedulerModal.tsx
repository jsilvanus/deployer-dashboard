import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { getApp, postAppSchedule, postAppShutdown } from '../../lib/api'

export default function SchedulerModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [cron, setCron] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!open) return
    let mounted = true
    setLoading(true)
    getApp(appId).then(a => {
      if (!mounted) return
      const s = (a as any)?.schedule || {}
      setCron(s.cron || '')
      setTimezone(s.timezone || 'UTC')
      setEnabled(!!s.enabled)
    }).catch(() => {
      // ignore
    }).finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [open, appId])

  async function save() {
    setLoading(true)
    try {
      await postAppSchedule(appId, { enabled, cron, timezone })
      onClose()
    } catch (e) {
      // ignore
    } finally { setLoading(false) }
  }

  async function shutdownNow() {
    if (!confirm('Shutdown app now?')) return
    setLoading(true)
    try {
      await postAppShutdown(appId)
      onClose()
    } catch (e) {
      // ignore
    } finally { setLoading(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Scheduler</h3>
      {loading ? <div>Loading…</div> : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[color:var(--muted)]">Cron expression</label>
            <input value={cron} onChange={e=>setCron(e.target.value)} className="w-full border rounded px-2 py-1" placeholder="0 3 * * *" />
          </div>
          <div>
            <label className="block text-xs text-[color:var(--muted)]">Timezone</label>
            <input value={timezone} onChange={e=>setTimezone(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} />
            <div className="text-sm">Enabled</div>
          </div>
          <div className="mt-2 text-sm text-[color:var(--muted)]">Tip: provide a cron expression or use the API to validate complex schedules.</div>
        </div>
      )}

      <div className="mt-4 flex justify-between">
        <div>
          <Button variant="secondary" size="sm" onClick={shutdownNow}>Shutdown now</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </Modal>
  )
}
