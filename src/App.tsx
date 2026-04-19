import React from 'react'
import Button from './components/ui/Button'

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[color:var(--bg)] text-[color:var(--fg)]">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Deployer Dashboard</h1>
        <p className="text-sm text-[color:var(--muted)]">Scaffold ready</p>
        <Button>Primary</Button>
      </div>
    </div>
  )
}
