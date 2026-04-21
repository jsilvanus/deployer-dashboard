import React, { useEffect, useState } from 'react'
import { setConnected as setGlobalConnected } from '../../stores/connection'

export default function ConnectionIndicator() {
  const [connected, setLocalConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        // Use the health endpoint to determine connectivity
        const res = await fetch('/health', { cache: 'no-store' })
        if (!mounted) return
        setLocalConnected(res.ok)
        // also update shared store
        setGlobalConnected(res.ok)
      } catch (_) {
        if (!mounted) return
        setLocalConnected(false)
        setGlobalConnected(false)
      }
    }

    check()
    const id = setInterval(check, 10000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const color = connected === null ? '#d1d5db' : connected ? '#16a34a' : '#ef4444'
  const title = connected === null ? 'Checking connection…' : connected ? 'Connected to server' : 'Not connected'

  return (
    <span title={title} style={{display:'inline-block', width:12, height:12, borderRadius:6, backgroundColor: color, marginLeft:8, verticalAlign:'middle'}} />
  )
}
