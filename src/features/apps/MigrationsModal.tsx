import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { postAppMigrationsRun } from '../../lib/api'

export default function MigrationsModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [target, setTarget] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function run() {
    setRunning(true)
    try {
      const res = await postAppMigrationsRun(appId, { target: target || undefined })
      setResult(res)
    } catch (e) {
      setResult({ error: (e as any)?.message ?? String(e) })
    } finally { setRunning(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Run migrations</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Target (optional)</label>
          <input value={target} onChange={e=>setTarget(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <Button variant="primary" size="sm" onClick={run} disabled={running}>{running ? 'Running...' : 'Run'}</Button>
        </div>
        {result && (
          <pre className="bg-gray-100 p-2 rounded text-xs max-h-40 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
