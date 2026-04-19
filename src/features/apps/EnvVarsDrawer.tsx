import React, { useEffect, useState } from 'react'
import Drawer from '../../components/ui/Drawer'
import Button from '../../components/ui/Button'
import { getAppEnv, putAppEnv, deleteAppEnv } from '../../lib/api'

function parseBulk(text: string) {
  const out: Record<string,string> = {}
  text.split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
    const idx = line.indexOf('=')
    if (idx > 0) {
      const k = line.slice(0, idx).trim()
      const v = line.slice(idx + 1)
      out[k] = v
    }
  })
  return out
}

export default function EnvVarsDrawer({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [env, setEnv] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [bulk, setBulk] = useState('')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getAppEnv(appId).then(e => setEnv(e)).catch(()=>{}).finally(()=>setLoading(false))
  }, [open, appId])

  async function saveBulk() {
    const parsed = parseBulk(bulk)
    setLoading(true)
    try {
      const updated = await putAppEnv(appId, { ...env, ...parsed })
      setEnv(updated)
      setBulk('')
    } catch (e) {
    } finally { setLoading(false) }
  }

  async function removeKey(k: string) {
    setLoading(true)
    try {
      await deleteAppEnv(appId, k)
      const copy = { ...env }
      delete copy[k]
      setEnv(copy)
    } catch (e) {
    } finally { setLoading(false) }
  }

  return (
    <Drawer isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Environment variables</h3>
      <div className="mb-2 text-sm text-[color:var(--muted)]">Values are hidden by default. Use bulk paste to add many variables.</div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={reveal} onChange={e=>setReveal(e.target.checked)} /> Reveal values</label>
        </div>
        <div className="space-y-2 max-h-56 overflow-auto">
          {loading ? <div className="text-sm text-[color:var(--muted)]">Loading...</div> : Object.keys(env).length === 0 ? <div className="text-sm text-[color:var(--muted)]">No env vars set</div> : Object.entries(env).map(([k,v]) => (
            <div key={k} className="flex items-center justify-between gap-2 border-b pb-2">
              <div>
                <div className="text-sm font-mono">{k}</div>
                <div className="text-xs text-[color:var(--muted)] font-mono">{reveal ? v : '••••••••'}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={()=>navigator.clipboard?.writeText(v)}>Copy</Button>
                <Button variant="secondary" size="sm" onClick={()=>removeKey(k)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs text-[color:var(--muted)]">Bulk paste (KEY=VALUE per line)</label>
          <textarea value={bulk} onChange={e=>setBulk(e.target.value)} className="w-full h-28 border rounded px-2 py-1 font-mono" />
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={()=>setBulk('')}>Clear</Button>
            <Button variant="primary" size="sm" onClick={saveBulk}>Apply</Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
