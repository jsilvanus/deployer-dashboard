import React, { useState } from 'react'
import Button from './components/ui/Button'
import Pill from './components/ui/Pill'
import Sparkline from './components/ui/Sparkline'
import AreaChart from './components/ui/AreaChart'
import MetricTile from './components/MetricTile'

export default function App() {
  const data = [3, 5, 4, 6, 8, 7, 9]
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg)] text-[color:var(--fg)] p-8">
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold">Deployer Dashboard</h1>
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
    </div>
  )
}
