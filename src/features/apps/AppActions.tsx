import React, { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as api from '../../lib/api'

type Progress = { current: number; total: number } | null

function DeploymentProgressInline({ progress }: { progress: Progress }) {
  if (!progress) return null
  const { current, total } = progress
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-[color:var(--accent)] text-white font-semibold">
      UPD {current}/{total}
    </span>
  )
}

// useDeploymentPoll - polls deployment until finished, exposes progress
function useDeploymentPoll() {
  const [progress, setProgress] = useState<Progress>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
    }
  }, [])

  function start(deploymentId: string) {
    // initial fetch
    let stopped = false
    async function tick() {
      try {
        const d: any = await api.getDeployment(deploymentId)
        if (d && d.progress) {
          setProgress({ current: d.progress.current ?? 0, total: d.progress.total ?? 0 })
        }
        if (d && (d.status === 'succeeded' || d.status === 'failed' || d.status === 'cancelled')) {
          // stop polling
          if (intervalRef.current) {
            window.clearInterval(intervalRef.current)
            intervalRef.current = null
          }
          stopped = true
        }
      } catch (err) {
        // ignore transient errors
      }
    }

    tick()
    if (!stopped) {
      intervalRef.current = window.setInterval(tick, 1000)
    }
  }

  function stop() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  return { progress, start, stop }
}

// lightweight retry toast using window.confirm for now
function showErrorWithRetry(message: string, onRetry: () => void) {
  const tryAgain = window.confirm(`${message}\nRetry?`)
  if (tryAgain) onRetry()
}

export function useAppActions(appId: string) {
  const poll = useDeploymentPoll()

  const deployMutation = useMutation(() => api.postDeploy(appId), {
    onSuccess(data: any) {
      if (data && data.deploymentId) {
        poll.start(data.deploymentId)
      }
    },
    onError(err: any, _vars, context) {
      showErrorWithRetry('Deploy failed', () => deployMutation.mutate())
    }
  })

  const updateMutation = useMutation(() => api.postUpdate(appId), {
    onSuccess(data: any) {
      if (data && data.deploymentId) {
        poll.start(data.deploymentId)
      }
    },
    onError() {
      showErrorWithRetry('Update failed', () => updateMutation.mutate())
    }
  })

  const rollbackMutation = useMutation(() => api.postRollback(appId), {
    onSuccess(data: any) {
      if (data && data.deploymentId) {
        poll.start(data.deploymentId)
      }
    },
    onError() {
      showErrorWithRetry('Rollback failed', () => rollbackMutation.mutate())
    }
  })

  function openLogs(drawerOpenFn: () => void) {
    // open logs drawer provided by caller
    drawerOpenFn()
  }

  return {
    deploy: () => deployMutation.mutate(),
    updating: updateMutation.mutate,
    rollback: () => rollbackMutation.mutate(),
    isDeploying: deployMutation.isLoading || updateMutation.isLoading || rollbackMutation.isLoading,
    progress: poll.progress,
    DeploymentProgressInline: (props: { className?: string }) => <DeploymentProgressInline progress={poll.progress} />,
    openLogs,
  }
}

// useAppLogs hook: fetch historical logs and provide a stream attach helper
export function useAppLogs(appId: string) {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    api.getAppLogs(appId)
      .then((data: any) => {
        if (!mounted) return
        setLogs(Array.isArray(data) ? data : (data.lines || []))
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
        setLoading(false)
      })
    return () => { mounted = false }
  }, [appId])

  function stream(onMessage: (line: string) => void) {
    const es = api.streamAppLogs(appId)
    es.onmessage = (ev) => {
      try {
        const payload = typeof ev.data === 'string' ? ev.data : JSON.stringify(ev.data)
        onMessage(payload)
      } catch (err) {
        // ignore
      }
    }
    es.onerror = () => {
      // noop; caller can close/es.close()
    }
    return es
  }

  return { logs, isLoading, error, stream }
}

export default function AppActionsPlaceholder() {
  return null
}
