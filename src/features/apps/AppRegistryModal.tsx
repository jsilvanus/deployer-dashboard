import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { postAppRegistryTest } from '../../lib/api'
import { RegistryAuth } from '../../lib/types'

export default function AppRegistryModal({ appId, open, onClose }: { appId: string; open: boolean; onClose: () => void }) {
  const [registryUrl, setRegistryUrl] = useState('')
  const [authType, setAuthType] = useState<'none'|'token'|'basic'>('token')
  const [token, setToken] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function testCredentials() {
    setTesting(true)
    setResult(null)
    const credentials: RegistryAuth = { type: authType }
    if (authType === 'token') credentials.token = token
    if (authType === 'basic') { credentials.username = username; credentials.password = password }
    try {
      const res = await postAppRegistryTest(appId, { registryUrl, credentials })
      setResult(res?.message ?? (res?.ok ? 'OK' : 'Failed'))
    } catch (e: any) {
      setResult(String(e?.message || e))
    } finally { setTesting(false) }
  }

  return (
    <Modal isOpen={open} onClose={onClose}>
      <h3 className="text-lg font-semibold mb-3">Registry</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[color:var(--muted)]">Registry URL</label>
          <input value={registryUrl} onChange={e=>setRegistryUrl(e.target.value)} className="w-full border rounded px-2 py-1" />
        </div>

        <div>
          <label className="block text-xs text-[color:var(--muted)]">Auth type</label>
          <select value={authType} onChange={e=>setAuthType(e.target.value as any)} className="w-full border rounded px-2 py-1">
            <option value="none">None</option>
            <option value="token">Token</option>
            <option value="basic">Basic</option>
          </select>
        </div>

        {authType === 'token' && (
          <div>
            <label className="block text-xs text-[color:var(--muted)]">Token</label>
            <input value={token} onChange={e=>setToken(e.target.value)} className="w-full border rounded px-2 py-1" />
          </div>
        )}

        {authType === 'basic' && (
          <>
            <div>
              <label className="block text-xs text-[color:var(--muted)]">Username</label>
              <input value={username} onChange={e=>setUsername(e.target.value)} className="w-full border rounded px-2 py-1" />
            </div>
            <div>
              <label className="block text-xs text-[color:var(--muted)]">Password</label>
              <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded px-2 py-1" />
            </div>
          </>
        )}

        {result && <div className="text-sm text-[color:var(--muted)]">Result: {result}</div>}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        <Button variant="primary" size="sm" onClick={testCredentials} disabled={testing}>{testing ? 'Testing…' : 'Test credentials'}</Button>
      </div>
    </Modal>
  )
}
