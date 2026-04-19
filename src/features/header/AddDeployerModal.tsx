import React, { useState } from 'react'
import { checkHealth } from '../../lib/api'
import { useDeployers } from '../../stores/deployers'

type Props = {
  open: boolean
  onClose: () => void
}

export default function AddDeployerModal({ open, onClose }: Props) {
  const add = useDeployers(s => s.add)
  const setToken = useDeployers(s => s.setToken)

  const [baseURL, setBaseURL] = useState('')
  const [token, setTokenLocal] = useState('')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const submit = async () => {
    try {
      await addDeployer({ baseURL, token, label, add, setToken })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Network or CORS error. See troubleshooting.')
    }
  }

  return (
    <div role="dialog" data-testid="add-modal">
      <h3>Add Deployer</h3>
      <div>
        <label>Base URL<input value={baseURL} onChange={e=>setBaseURL(e.target.value)} data-testid="input-base"/></label>
      </div>
      <div>
        <label>Admin Token<input value={token} onChange={e=>setTokenLocal(e.target.value)} data-testid="input-token"/></label>
      </div>
      <div>
        <label>Label<input value={label} onChange={e=>setLabel(e.target.value)} data-testid="input-label"/></label>
      </div>
      {error && <div data-testid="error">{error}</div>}
      <div>
        <button onClick={submit} disabled={loading} data-testid="submit">Add</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}

export type AddDeployerParams = {
  baseURL: string
  token?: string
  label?: string
  add: (m: any) => void
  setToken: (id: string, token: string) => void
}

export async function addDeployer({ baseURL, token, label, add, setToken }: AddDeployerParams) {
  try { new URL(baseURL) } catch { throw new Error('Invalid URL') }
  await checkHealth(baseURL, token)
  const id = `${Date.now()}`
  const meta = { id, label: label || baseURL, baseURL, lastSeen: new Date().toISOString() }
  add(meta)
  setToken(id, token || '')
  return id
}
