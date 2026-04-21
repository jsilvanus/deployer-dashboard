import React, { useState } from 'react'
import Button from './components/ui/Button'
import Pill from './components/ui/Pill'
import Sparkline from './components/ui/Sparkline'
import AreaChart from './components/ui/AreaChart'
import MetricTile from './components/MetricTile'
import TraefikSetupModal from './features/setup/TraefikSetupModal'
import SelfUpdateModal from './features/setup/SelfUpdateModal'
import ServerEnvDrawer from './features/setup/ServerEnvDrawer'
import { useDeployers } from './stores/deployers'

export default function App() {
  const data = [3, 5, 4, 6, 8, 7, 9]
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [traefikOpen, setTraefikOpen] = useState(false)
  const [selfUpdateOpen, setSelfUpdateOpen] = useState(false)
  const [serverDrawerOpen, setServerDrawerOpen] = useState(false)
  const { deployers } = useDeployers()

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg)] text-[color:var(--fg)]">
      <header className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">Deployer Dashboard</h1>
        </div>

        <div className="relative">
          <Button variant="secondary" onClick={() => setMenuOpen(v => !v)}>Setup</Button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md py-1">
              {deployers.length === 0 ? (
                <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setServerDrawerOpen(true); setMenuOpen(false) }}>Server config</button>
              ) : (
                <>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setTraefikOpen(true); setMenuOpen(false) }}>Traefik setup</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setSelfUpdateOpen(true); setMenuOpen(false) }}>Self update</button>
                  <button className="w-full text-left px-3 py-2 hover:bg-gray-50" onClick={() => { setServerDrawerOpen(true); setMenuOpen(false) }}>Server config</button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-8 flex items-center justify-center">
        <div className="space-y-6 text-center">
          <p className="text-sm text-[color:var(--muted)]">UI primitives demo</p>
          <div className="flex items-center gap-3 justify-center">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="icon">⚙️</Button>
            <Pill>JD</Pill>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <MetricTile label="Deploys" value="42" data={data} />
            <div className="bg-white p-4 rounded-md">
              <div className="mb-2 text-xs text-[color:var(--muted)]">History</div>
              <Sparkline data={data} width={160} height={40} />
              <AreaChart data={data} width={200} height={72} />
            </div>
          </div>
        </div>
      </main>

      <TraefikSetupModal open={traefikOpen} onClose={() => setTraefikOpen(false)} />
      <SelfUpdateModal open={selfUpdateOpen} onClose={() => setSelfUpdateOpen(false)} />
      <ServerEnvDrawer open={serverDrawerOpen} onClose={() => setServerDrawerOpen(false)} onRestartRequested={() => setSelfUpdateOpen(true)} />
    </div>
  )
}
