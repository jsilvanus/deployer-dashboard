import React, { useEffect, useRef, useState } from 'react'
import MetricTile from '../../components/MetricTile'
import useQuery from '../../lib/useQuery'
import { getAppStatus, getAppMetrics } from '../../lib/api'
import type { App } from '../../lib/types'
import AppMenu from './AppMenu'
import { useAppActions } from './AppActions'
import AppVersionDetail from './AppVersionDetail'

function useIsVisible<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      for (const e of entries) setVisible(e.isIntersecting)
    }, { root: null, threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

export default function AppRow({ app }: { app: App }) {
  const { ref, visible } = useIsVisible<HTMLDivElement>()

  const actions = useAppActions(app.id)

  const statusQ = useQuery(['status', app.id], () => getAppStatus(app.id), { enabled: visible, refetchInterval: visible ? 3000 : false })
  const metricsQ = useQuery(['metrics', app.id], () => getAppMetrics(app.id), { enabled: visible })

  const status = statusQ.data ?? app.status
  const metrics = metricsQ.data ?? []
  const [verOpen, setVerOpen] = useState(false)

  const status24 = metrics.find(m => m.name === 'status-24h')?.values ?? []
  const cpu1h = metrics.find(m => m.name === 'cpu-1h')?.values ?? []
  const mem1h = metrics.find(m => m.name === 'mem-1h')?.values ?? []

  return (
    <div
      ref={ref}
      tabIndex={0}
      className="flex items-center gap-4 px-4 py-3 border-b border-dashed bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
      role="row"
      aria-label={`app ${app.name}`}
    >
      <div className="w-56">
        <div className="text-sm font-semibold">{app.name}</div>
        <div className="text-xs text-[color:var(--muted)] font-mono">{app.type}</div>
        <div className="text-xs text-[color:var(--muted)] mt-1">
          Version: {app.version ? (
            <button className="font-mono text-xs text-indigo-600 hover:underline" onClick={() => setVerOpen(true)}>{app.version}</button>
          ) : '—'}
        </div>
      </div>

      <div className="w-28">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: status === 'running' ? '#10B981' : status === 'failed' ? '#EF4444' : '#F59E0B' }} aria-hidden />
          <span className="text-xs font-mono">{status}</span>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="w-40">
          <MetricTile label="status-24h" value="" data={status24} />
        </div>
        <div className="w-40">
          <MetricTile label="cpu-1h" value="" data={cpu1h} />
        </div>
        <div className="w-40">
          <MetricTile label="mem-1h" value="" data={mem1h} />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <actions.DeploymentProgressInline />
        <AppMenu app={app} />
      </div>
      {/* Version detail modal trigger */}
      {app.version && (
        <AppVersionDetail appId={app.id} versionId={app.version} open={verOpen} onClose={() => setVerOpen(false)} />
      )}
    </div>
  )
}

