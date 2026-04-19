import React, { useState } from 'react'
import { useDeployers } from '../../stores/deployers'

type Props = { open: boolean; onClose: () => void }

export default function ManageTargetsModal({ open, onClose }: Props) {
  const { deployers, remove, rename, setDefault } = useDeployers()
  const [editing, setEditing] = useState<Record<string,string>>({})

  if (!open) return null

  return (
    <div role="dialog" data-testid="manage-modal">
      <h3>Manage Targets</h3>
      <div>
        {deployers.map(d => (
          <div key={d.id} style={{padding:8,borderBottom:'1px solid #eee'}} data-testid={`target-${d.id}`}>
            <div>
              {editing[d.id] ? (
                <input value={editing[d.id]} onChange={e=>setEditing({...editing,[d.id]:e.target.value})} data-testid={`rename-${d.id}`}/>
              ) : (
                <strong>{d.label}</strong>
              )}
            </div>
            <div style={{fontSize:12}}>{d.baseURL}</div>
            <div>
              {editing[d.id] ? (
                <button onClick={()=>{rename(d.id, editing[d.id]); setEditing({...editing,[d.id]:undefined})}} data-testid={`save-${d.id}`}>Save</button>
              ) : (
                <button onClick={()=>setEditing({...editing,[d.id]:d.label})} data-testid={`edit-${d.id}`}>Rename</button>
              )}
              <button onClick={()=>remove(d.id)} data-testid={`delete-${d.id}`}>Delete</button>
              <button onClick={()=>setDefault(d.id)} data-testid={`default-${d.id}`}>Set default</button>
            </div>
          </div>
        ))}
      </div>
      <div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
