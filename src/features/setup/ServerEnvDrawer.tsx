import React, { useEffect, useState } from 'react'
import { subscribe as subscribeConnection } from '../../stores/connection'
import Button from '../../components/ui/Button'
import { getConfigEnv, putConfigEnv } from '../../lib/api'

const KNOWN_VARS: { key: string; desc: string; sensitive?: boolean }[] = [
  { key: 'PORT', desc: 'Port the server listens on' },
  { key: 'DEPLOYER_ADDR', desc: 'Deployer address (domain or IP)' },
  { key: 'ADMIN_TOKEN', desc: 'Admin API token', sensitive: true }
]

function genRandomHex(len = 32) {
  const arr = new Uint8Array(len)
  crypto.getRandomValues(arr)
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function ServerEnvDrawer({ open, onClose, onRestartRequested }: { open: boolean; onClose: () => void; onRestartRequested?: () => void }) {
  const [env, setEnv] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [restartRequired, setRestartRequired] = useState(false)
  const [connState, setConnState] = useState<{ lastStatus: boolean | null; lastSuccess: number | null; lastChecked: number | null } | null>(null)
  const [useRemote, setUseRemote] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('deployer:active')
      if (!v) return false
      const parsed = JSON.parse(v)
      return !!parsed?.baseURL
    } catch (e) {
      return false
    }
  })

  useEffect(() => {
    if (!open) return
    setLoading(true)
    ;(async () => {
      try {
        if (useRemote) {
          const data = await getConfigEnv()
          setEnv(data || {})
        } else {
          const r = await fetch('/config/env', { cache: 'no-store' })
          if (!r.ok) {
            setEnv({})
          } else {
            const data = await r.json().catch(()=> ({}))
            setEnv(data || {})
          }
        }
      } catch (err) {
        // fallback: attempt same-origin
        try {
          const r = await fetch('/config/env', { cache: 'no-store' })
          if (!r.ok) setEnv({})
          else setEnv(await r.json().catch(()=> ({})) || {})
        } catch (e) {
          setEnv({})
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [open, useRemote])

  useEffect(() => {
    const unsub = subscribeConnection(v => setConnState(v))
    return unsub
  }, [])

  function setVar(k: string, v: string) {
    setEnv(prev => ({ ...prev, [k]: v }))
  }

  function toggleShow(k: string) {
    // no-op: we render password fields; user can toggle via built-in browser controls
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (useRemote) {
        const data = await putConfigEnv(env)
        setRestartRequired(!!(data && (data as any).restartRequired))
      } else {
        const res = await fetch('/config/env', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(env) })
        if (!res.ok) return
        const data = await res.json().catch(()=>null)
        setRestartRequired(!!(data && data.restartRequired))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleRestartNow() {
    try {
      await fetch('/setup/self-update', { method: 'POST' })
      setRestartRequired(false)
      onRestartRequested?.()
    } catch (err) {
      console.error(err)
    }
  }

  if (!open) return null

  const seen = new Set<string>()
  const ordered: { key: string; value: string; desc?: string; sensitive?: boolean }[] = []

  // known first
  for (const k of KNOWN_VARS) {
    // hide DEPLOYER_ADDR when using same-origin (it's redundant)
    if (!useRemote && k.key === 'DEPLOYER_ADDR') continue
    ordered.push({ key: k.key, value: env[k.key] || '', desc: k.desc, sensitive: !!k.sensitive })
    seen.add(k.key)
  }

  // If connected, include all server config keys from the fetched env
  if (connState?.lastStatus === true) {
    const extra = Object.keys(env).sort()
    for (const k of extra) {
      if (seen.has(k)) continue
      ordered.push({ key: k, value: env[k] || '', desc: undefined, sensitive: false })
      seen.add(k)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="ml-auto w-[520px] h-full bg-white shadow-lg p-6 overflow-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Server Config</h3>
          <div className="flex gap-3 items-center">
            <div className="text-sm flex items-center gap-3">
              <span className="font-medium">Deployer host:</span>
              <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
                <button
                  className={`px-3 py-1 rounded-full ${!useRemote ? 'bg-white shadow' : 'text-gray-500'}`}
                  onClick={() => setUseRemote(false)}
                >
                  same-origin
                </button>
                <button
                  className={`px-3 py-1 rounded-full ${useRemote ? 'bg-white shadow' : 'text-gray-500'}`}
                  onClick={() => setUseRemote(true)}
                >
                  remote
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>Close</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            </div>
          </div>
        </div>

        {loading && <div className="mt-4 text-sm text-[color:var(--muted)]">Loading...</div>}

        {restartRequired && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center justify-between">
              <div>
                <strong>Restart required</strong>
                <div className="text-sm text-[color:var(--muted)]">Changes require a server restart to take effect.</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setRestartRequired(false)}>Dismiss</Button>
                <Button onClick={handleRestartNow}>Restart now</Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {ordered.map(item => (
            <div key={item.key} className="border-b pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{item.key}</div>
                  {item.desc && <div className="text-sm text-[color:var(--muted)]">{item.desc}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {item.sensitive ? (
                    <input
                      type="password"
                      value={env[item.key] || ''}
                      onChange={e => setVar(item.key, e.target.value)}
                      className="border p-2 rounded w-[260px]"
                    />
                  ) : (
                    <input
                      value={env[item.key] || ''}
                      onChange={e => setVar(item.key, e.target.value)}
                      className="border p-2 rounded w-[260px]"
                    />
                  )}

                  {(item.key === 'ADMIN_TOKEN' || item.key === 'ENCRYPTION_KEY') && (
                    <Button variant="icon" onClick={() => setVar(item.key, genRandomHex(24))}>⎘</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
      <div className="flex-1" onClick={onClose} />
    </div>
  )
}
