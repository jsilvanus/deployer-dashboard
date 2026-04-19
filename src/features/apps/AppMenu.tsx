import React, { useState, useRef, useEffect } from 'react'
import EditConfigModal from './EditConfigModal'
import EnvVarsDrawer from './EnvVarsDrawer'
import DeploymentHistoryModal from './DeploymentHistoryModal'
import MigrationsModal from './MigrationsModal'
import DeleteAppConfirm from './DeleteAppConfirm'
import AppVersionsModal from './AppVersionsModal'
import SchedulerModal from './SchedulerModal'
import AppRegistryModal from './AppRegistryModal'
import { copyToClipboard } from '../../lib/clipboard'
import Button from '../../components/ui/Button'
import { postAppShutdown } from '../../lib/api'
import { showToast } from '../../lib/toast'

export default function AppMenu({ app }: { app: any }) {
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [envOpen, setEnvOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [migOpen, setMigOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [schedulerOpen, setSchedulerOpen] = useState(false)
  const [registryOpen, setRegistryOpen] = useState(false)

  const btnRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!btnRef.current) return
      if (e.target instanceof Node && btnRef.current.contains(e.target)) return
      setOpen(false)
    }
    if (open) document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])

  async function handleCopyKey() {
    // try to copy `app.key` or fallback to app.id
    const key = app?.key ?? app?.apiKey ?? app?.id
    if (!key) return
    await copyToClipboard(String(key))
    setOpen(false)
  }

  return (
    <div className="relative inline-block">
      <button ref={btnRef} onClick={()=>setOpen(v=>!v)} className="p-2 rounded hover:bg-gray-100 focus:outline-none">⋯</button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow z-50">
          <div className="flex flex-col">
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setVersionsOpen(true); setOpen(false) }}>Versions</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setSchedulerOpen(true); setOpen(false) }}>Scheduler</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setRegistryOpen(true); setOpen(false) }}>Registry</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ /* TODO: cache/invalidate action */ setOpen(false) }}>Cache</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={async ()=>{ if (!confirm('Shutdown app now?')) return; try { await postAppShutdown(app.id); showToast('Shutdown request sent'); } catch (e) { showToast('Shutdown failed') } setOpen(false) }}>Shutdown now</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setEditOpen(true); setOpen(false) }}>Edit config</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setEnvOpen(true); setOpen(false) }}>Env vars</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setHistOpen(true); setOpen(false) }}>Deployment history</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={()=>{ setMigOpen(true); setOpen(false) }}>Run migrations</button>
            <button className="text-left px-3 py-2 hover:bg-gray-50" onClick={handleCopyKey}>Copy API key</button>
            <button className="text-left px-3 py-2 hover:bg-red-50 text-red-600" onClick={()=>{ setDelOpen(true); setOpen(false) }}>Delete</button>
          </div>
        </div>
      )}

      <EditConfigModal appId={app.id} open={editOpen} onClose={()=>setEditOpen(false)} />
      <EnvVarsDrawer appId={app.id} open={envOpen} onClose={()=>setEnvOpen(false)} />
      <DeploymentHistoryModal appId={app.id} open={histOpen} onClose={()=>setHistOpen(false)} />
      <MigrationsModal appId={app.id} open={migOpen} onClose={()=>setMigOpen(false)} />
      <DeleteAppConfirm appId={app.id} appName={app.name} open={delOpen} onClose={()=>setDelOpen(false)} onDeleted={()=>{ /* TODO: refresh list */ }} />
      <AppVersionsModal appId={app.id} open={versionsOpen} onClose={()=>setVersionsOpen(false)} />
      <SchedulerModal appId={app.id} open={schedulerOpen} onClose={()=>setSchedulerOpen(false)} />
      <AppRegistryModal appId={app.id} open={registryOpen} onClose={()=>setRegistryOpen(false)} />
    </div>
  )
}
