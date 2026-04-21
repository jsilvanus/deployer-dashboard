import React, { useEffect, useState } from 'react'

export default function ConnectionIndicator() {
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        // Use the health endpoint to determine connectivity
        const res = await fetch('/health', { cache: 'no-store' })
        if (!mounted) return
        setConnected(res.ok)
      } catch (_) {
        if (!mounted) return
        setConnected(false)
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
