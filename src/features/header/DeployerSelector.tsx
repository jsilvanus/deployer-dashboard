import React, { useState } from 'react'
import { useDeployers } from '../../stores/deployers'

type Props = {
  openServerConfig?: () => void
}

export default function DeployerSelector({ openServerConfig }: Props) {
  const { deployers, active, switchActive } = useDeployers()
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button onClick={() => setOpen(v => !v)} data-testid="deployer-toggle">Targets ({deployers.length})</button>
      {open && (
        <div role="menu" data-testid="deployer-menu">
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
  )
}
