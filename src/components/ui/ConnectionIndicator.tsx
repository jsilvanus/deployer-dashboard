import React, { useEffect, useState } from 'react'
import { setStatus, subscribe as subscribeConnection } from '../../stores/connection'

export default function ConnectionIndicator() {
  const [state, setState] = useState<{ lastStatus: boolean | null; lastSuccess: number | null; lastChecked: number | null } | null>(null)

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        // Use the health endpoint to determine connectivity
        const res = await fetch('/health', { cache: 'no-store' })
        if (!mounted) return
        setStatus(res.ok)
      } catch (_) {
        if (!mounted) return
        setStatus(false)
      }
    }

    const unsub = subscribeConnection(s => setState(s))
    check()
    const id = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(id); unsub() }
  }, [])
  const now = Date.now()
  let color = '#d1d5db'
  let title = 'Checking connection…'
  if (state == null || state.lastStatus === null) {
    color = '#d1d5db'
    title = 'Checking connection…'
  } else if (state.lastStatus === false) {
    color = '#ef4444' // red
    title = 'Not connected'
  } else {
    // lastStatus === true
    if (state.lastSuccess && (now - state.lastSuccess) <= 5 * 60 * 1000) {
      color = '#16a34a' // green if within 5 minutes
      title = 'Connected (recent)'
    } else {
      color = '#f59e0b' // yellow if succeeded earlier in session but not within 5m
      title = 'Connected (stale)'
    }
  }
  function fmt(ts: number | null) {
    if (!ts) return 'never'
    const d = new Date(ts)
    const diff = Math.round((now - ts) / 1000)
    if (diff < 60) return `${d.toLocaleString()} (${diff}s ago)`
    if (diff < 3600) return `${d.toLocaleString()} (${Math.round(diff/60)}m ago)`
    return `${d.toLocaleString()} (${Math.round(diff/3600)}h ago)`
  }

  const details = []
  if (state?.lastSuccess) details.push(`Last success: ${fmt(state.lastSuccess)}`)
  if (state?.lastChecked) details.push(`Last checked: ${fmt(state.lastChecked)}`)
  const fullTitle = `${title}${details.length ? '\n' + details.join('\n') : ''}`

  return (
    <span title={fullTitle} style={{display:'inline-block', width:12, height:12, borderRadius:6, backgroundColor: color, marginLeft:8, verticalAlign:'middle'}} />
  )
}
