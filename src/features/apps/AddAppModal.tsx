import React, { useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { showToast } from '../../lib/toast'

type Props = { open: boolean; onClose: () => void }

type AppType = 'node' | 'python' | 'docker' | 'compose'

function localBaseURL(): string | null {
  try {
    const v = localStorage.getItem('deployer:active')
    if (!v) return null
    const parsed = JSON.parse(v)
    return parsed?.baseURL ?? null
  } catch (e) {
    return null
  }
}

function localToken(): string | null {
  try { return sessionStorage.getItem('deployer:token') } catch { return null }
}


export default function AddAppModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AppType>('node')
  const [entry, setEntry] = useState('main')
  const [image, setImage] = useState('')
  const [composeFile, setComposeFile] = useState('docker-compose.yml')
  const [allowedInput, setAllowedInput] = useState<string>('.')
  const [envBulk, setEnvBulk] = useState('')
  const [envPreview, setEnvPreview] = useState<Record<string,string>>({})
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const allowedDeployPaths = useMemo(() => {
    return allowedInput.split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean)
  }, [allowedInput])

  function validateAllowed(paths: string[]) {
    // simple validation: no spaces only, not empty
    return paths.every(p => !!p && !/\s{2,}/.test(p))
  }

  function parseEnvBulk(text: string) {
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean)
    const out: Record<string,string> = {}
    for (const l of lines) {
      const idx = l.indexOf('=')
      if (idx === -1) continue
      const k = l.slice(0, idx).trim()
      const v = l.slice(idx+1).trim()
      if (k) out[k] = v
    }
    return out
  }

  function onParseEnv() {
    const parsed = parseEnvBulk(envBulk)
    setEnvPreview(parsed)
    showToast('Parsed env vars')
  }

  function defaultsForType(t: AppType) {
    if (t === 'node') return { entry: 'main' }
    if (t === 'python') return { entry: 'app.py' }
    if (t === 'docker') return { image: '' }
    if (t === 'compose') return { composeFile: 'docker-compose.yml', allowedInput: 'docker-compose.yml' }
    return {}
  }

  function applyTypeDefaults(t: AppType) {
    const d = defaultsForType(t) as any
    if (d.entry) setEntry(d.entry)
    if (d.image !== undefined) setImage(d.image)
    if (d.composeFile) setComposeFile(d.composeFile)
    if (d.allowedInput) setAllowedInput(d.allowedInput)
  }

  async function submit() {
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }
    if (!validateAllowed(allowedDeployPaths)) { setError('Invalid allowed deploy paths'); return }
    if (type === 'node' && !entry.trim()) { setError('Entry is required for node') ; return }
    if (type === 'python' && !entry.trim()) { setError('Entry is required for python') ; return }
    if (type === 'docker' && !image.trim()) { setError('Image is required for docker') ; return }
    if (type === 'compose' && !composeFile.trim()) { setError('Compose file required') ; return }

    const body: any = { name: name.trim(), type, allowedDeployPaths }
    if (Object.keys(envPreview).length) body.env = envPreview
    if (type === 'node' || type === 'python') body.entry = entry.trim()
    if (type === 'docker') body.image = image.trim()
    if (type === 'compose') body.composeFile = composeFile.trim()

    const base = localBaseURL()
    if (!base) { setError('No active deployer configured'); return }

    const token = localToken()
    setLoading(true)
    try {
      const url = base.replace(/\/+$/,'') + '/apps'
      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
      const text = await resp.text()
      let data: any = null
      try { data = text ? JSON.parse(text) : null } catch { data = text }
      if (resp.status === 201) {
        showToast('App created')
        onClose()
        if (data && data.id) window.location.reload()
        return
      }
      if (resp.status === 202) {
        showToast('App accepted for processing')
        onClose()
        return
      }
      // other 2xx
      if (resp.ok) {
        showToast('App created')
        onClose()
        if (data && data.id) window.location.reload()
        return
      }
      const errMsg = (data && data.message) ? data.message : `Request failed: ${resp.status}`
      setError(errMsg)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-2">Add App</h3>
      <div className="space-y-3">
        <div>
          <label className="block">Name<input className="w-full" value={name} onChange={e=>setName(e.target.value)} /></label>
        </div>
        <div>
          <label className="block">Type
            <select className="w-full" value={type} onChange={e=>{ const t = e.target.value as AppType; setType(t); applyTypeDefaults(t) }}>
              <option value="node">node</option>
              <option value="python">python</option>
              <option value="docker">docker</option>
              <option value="compose">compose</option>
            </select>
          </label>
        </div>

        {(type === 'node' || type === 'python') && (
          <div>
            <label className="block">Entry point<input className="w-full" value={entry} onChange={e=>setEntry(e.target.value)} /></label>
          </div>
        )}

        {type === 'docker' && (
          <div>
            <label className="block">Image<input className="w-full" value={image} onChange={e=>setImage(e.target.value)} placeholder="nginx:latest" /></label>
          </div>
        )}

        {type === 'compose' && (
          <div>
            <label className="block">Compose file<input className="w-full" value={composeFile} onChange={e=>setComposeFile(e.target.value)} /></label>
          </div>
        )}

        <div>
          <label className="block">Allowed deploy paths (one per line or comma-separated)
            <textarea className="w-full" rows={3} value={allowedInput} onChange={e=>setAllowedInput(e.target.value)} />
          </label>
          <div className="text-sm text-slate-600">Preview: {JSON.stringify(allowedDeployPaths)}</div>
        </div>

        <div>
          <label className="block">Environment vars (bulk paste KEY=VALUE per line)
            <textarea className="w-full" rows={4} value={envBulk} onChange={e=>setEnvBulk(e.target.value)} placeholder={`DB_HOST=localhost\nDEBUG=true`} />
          </label>
          <div className="flex gap-2 mt-2">
            <button onClick={onParseEnv} className="px-3 py-1 bg-slate-800 text-white rounded">Parse bulk</button>
            <button onClick={()=>{ setEnvBulk(''); setEnvPreview({}) }} className="px-3 py-1 border rounded">Clear</button>
          </div>
          {Object.keys(envPreview).length > 0 && (
            <div className="mt-2 text-sm bg-slate-50 p-2 rounded">
              <strong>Preview:</strong>
              <pre className="whitespace-pre-wrap">{JSON.stringify(envPreview, null, 2)}</pre>
            </div>
          )}
        </div>

        {error && <div className="text-red-600">{error}</div>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={submit} disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
        </div>
      </div>
    </Modal>
  )
}
