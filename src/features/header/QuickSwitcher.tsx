import React, { useEffect, useState } from 'react'
import { useDeployers } from '../../stores/deployers'

export default function QuickSwitcher() {
  const [open, setOpen] = useState(false)
  const { deployers, switchActive } = useDeployers()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!open) return null
  return (
    <div role="dialog" data-testid="quick-switcher" style={{position:'fixed',left:'50%',top:'20%',transform:'translateX(-50%)',background:'#fff',padding:12}}>
      <div style={{fontWeight:600}}>Switch Target</div>
      <div>
        {deployers.map(d => (
          <div key={d.id} style={{padding:6}}>
            <button onClick={() => { switchActive(d.id); setOpen(false) }} data-testid={`qs-${d.id}`}>{d.label}</button>
          </div>
        ))}
      </div>
      <div><button onClick={()=>setOpen(false)}>Close</button></div>
    </div>
  )
}
