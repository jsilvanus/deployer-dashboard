import React, { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as api from '../../lib/api'
import DeploymentProgressInline, { useDeploymentPoll } from './DeploymentProgressInline'
import { showToast } from '../../lib/toast'

function showErrorWithRetry(message: string, onRetry: () => void) {
  showToast(message, { actionLabel: 'Retry', onAction: onRetry, duration: 6000 })
}

export function useAppActions(appId: string) {
  const poll = useDeploymentPoll()

  const deployMutation = useMutation({
    mutationFn: () => api.postDeploy(appId),
    onSuccess(data: any) {
      if (data && (data as any).deploymentId) {
        poll.start((data as any).deploymentId)
      }
    },
    onError() {
      showErrorWithRetry('Deploy failed', () => deployMutation.mutate())
    }
  })

  const updateMutation = useMutation({
    mutationFn: () => api.postUpdate(appId),
    onSuccess(data: any) {
      if (data && (data as any).deploymentId) {
        poll.start((data as any).deploymentId)
      }
    },
    onError() {
      showErrorWithRetry('Update failed', () => updateMutation.mutate())
    }
  })

  const rollbackMutation = useMutation({
    mutationFn: () => api.postRollback(appId),
    onSuccess(data: any) {
      if (data && (data as any).deploymentId) {
        poll.start((data as any).deploymentId)
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
    const s = api.streamAppLogs(appId, (ev) => {
      try {
        const payload = typeof ev.data === 'string' ? ev.data : JSON.stringify(ev.data)
        onMessage(payload)
      } catch (err) {
        // ignore
      }
    }, () => {
      // noop
    })
    return s
  }

  return { logs, isLoading, error, stream }
}

export default function AppActionsPlaceholder() {
  return null
}
