import React, { useState, useEffect } from 'react'
import { useDeployers } from '../../stores/deployers'

type Props = {
  openServerConfig?: () => void
}

export default function DeployerSelector({ openServerConfig }: Props) {
  const { deployers, active, switchActive } = useDeployers()
  const [open, setOpen] = useState(false)
  const [env, setEnv] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    // If no deployers configured, fetch server env to display address/port/admin
    if (deployers.length === 0) {
      fetch('/config/env').then(async r => {
        if (!r.ok) return setEnv(null)
        const data = await r.json().catch(() => ({}))
        setEnv(data || {})
      }).catch(() => setEnv(null))
    }
  }, [deployers.length])

  return (
    <div>
      <button onClick={() => setOpen(v => !v)} data-testid="deployer-toggle">Targets ({deployers.length})</button>
      {open && (
        <div role="menu" data-testid="deployer-menu">
          {deployers.length === 0 ? (
            <div style={{padding:12}}>
              <div style={{fontSize:13,marginBottom:8}}>No deployer targets configured.</div>
              <div style={{fontSize:12,color:'#333',marginBottom:6}}>Address: <strong>{env?.DEPLOYER_ADDR || '—'}</strong></div>
              <div style={{fontSize:12,color:'#333',marginBottom:6}}>Port: <strong>{env?.PORT || '—'}</strong></div>
              <div style={{fontSize:12,color:'#333'}}>Admin key: <strong>{env?.ADMIN_TOKEN ? '••••••••' : '—'}</strong></div>
              <div style={{marginTop:10}}>
                <button onClick={() => openServerConfig && openServerConfig()} data-testid="server-config">Server config</button>
              </div>
            </div>
          ) : (
            <div>
              {deployers.map(d => (
                <div key={d.id} style={{padding:8,borderBottom:'1px solid #eee'}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}>
                    <div>
                      <div><strong>{d.label}</strong></div>
                      <div style={{fontSize:12,color:'#666'}}>{d.baseURL}</div>
                    </div>
                    <div>
                      <button onClick={() => switchActive(d.id)} data-testid={`select-${d.id}`}>{active===d.id? 'Active':'Use'}</button>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:'#999'}}>Last seen: {d.lastSeen}</div>
                </div>
              ))}
              <div style={{padding:8}}>
                <button onClick={() => openServerConfig && openServerConfig()} data-testid="server-config">Server config</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
