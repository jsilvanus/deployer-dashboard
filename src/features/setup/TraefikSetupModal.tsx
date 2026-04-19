import React, { useState } from 'react'
import Button from '../../components/ui/Button'

export default function TraefikSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [entrypoint, setEntrypoint] = useState('web')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const payload = { domain, email, entrypoint }
      const resp = await fetch('/setup/traefik', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!resp.ok) {
        const txt = await resp.text()
        setMessage(txt || `Request failed: ${resp.status}`)
      } else {
        setMessage('Traefik configuration submitted successfully')
        setTimeout(() => onClose(), 900)
      }
    } catch (err: any) {
      setMessage(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md w-[420px]">
        <h3 className="text-lg font-semibold mb-4">Traefik Setup</h3>
        <div className="space-y-3">
          <label className="block text-sm">Domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} className="w-full border p-2 rounded" />

          <label className="block text-sm">Email (for ACME)</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 rounded" />

          <label className="block text-sm">Entrypoint</label>
          <input value={entrypoint} onChange={e => setEntrypoint(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Setup'}</Button>
        </div>
        {message && <div className="mt-3 text-sm text-[color:var(--muted)]">{message}</div>}
      </form>
    </div>
  )
}
