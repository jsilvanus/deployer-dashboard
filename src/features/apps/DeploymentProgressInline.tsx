import React, { useEffect, useRef, useState } from 'react'
import * as api from '../../lib/api'
import type { Deployment } from '../../lib/types'

export type Progress = { current: number; total: number; steps?: Deployment['steps'] } | null

// useDeploymentPoll - polls deployment until finished, exposes progress and control
export function useDeploymentPoll() {
  const [progress, setProgress] = useState<Progress>(null)
  const timeoutRef = useRef<number | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    return () => {
      stoppedRef.current = true
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  function computeProgress(d: Deployment | null) {
    if (!d || !Array.isArray(d.steps)) return null
    const total = d.steps.length
    const runningIndex = d.steps.findIndex(s => s.status === 'running')
    let current = 0
    if (runningIndex >= 0) current = runningIndex + 1
    else current = d.steps.filter(s => s.status === 'success').length
    return { current, total, steps: d.steps }
  }

  function start(deploymentId: string) {
    stoppedRef.current = false
    const startAt = Date.now()

    async function tick() {
      if (stoppedRef.current) return
      try {
        const d = await api.getDeployment(deploymentId)
        const p = computeProgress(d)
        setProgress(p)
        if (d && (d.status === 'success' || d.status === 'failed')) {
          return // terminal - stop scheduling
        }
      } catch (err) {
        // ignore transient errors
      }

      const elapsed = Date.now() - startAt
      const delay = elapsed >= 60000 ? 2000 : 1000
      if (stoppedRef.current) return
      timeoutRef.current = window.setTimeout(tick, delay)
    }

    // initial fire
    void tick()
  }

  function stop() {
    stoppedRef.current = true
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  return { progress, start, stop }
}

export default function DeploymentProgressInline({ progress }: { progress: Progress }) {
  const [open, setOpen] = useState(false)
  if (!progress) return null
  const { current, total, steps } = progress

  return (
    <div className="inline-block align-middle">
      <button onClick={() => setOpen(v => !v)} className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-[color:var(--accent)] text-white font-semibold">
        UPD {current}/{total}
      </button>
      {open && steps && (
        <div className="mt-1 p-2 bg-white border rounded shadow text-xs w-64">
          <ul className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className={`flex justify-between ${s.status === 'running' ? 'font-semibold' : ''}`}>
                <span>{s.name}</span>
                <span className="text-[color:var(--muted)]">{s.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
