import React, { useEffect, useState, useRef } from 'react'
import parsePrometheusText, { SystemMetrics } from './prometheus'
import { getPrometheusMetrics, getApps } from '../../lib/api'

function fmtBytes(n?: number) {
  if (n == null) return ''
  const units = ['B','KB','MB','GB','TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${Math.round(v * 10) / 10}${units[i]}`
}

export default function SystemMetricsStrip(): JSX.Element {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const mounted = useRef(true)

  async function fetchOnce() {
    setLoading(true)
    try {
      const txt = await getPrometheusMetrics()
      const parsed = parsePrometheusText(txt)
      if (!mounted.current) return
      setMetrics(parsed)
      setLastUpdated(Date.now())
    } catch (e) {
      // swallow — component should be resilient
      console.warn('Failed to fetch prometheus metrics', e)
    } finally {
      if (mounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    mounted.current = true
    fetchOnce()
    const id = setInterval(fetchOnce, 15_000)
    return () => {
      mounted.current = false
      clearInterval(id)
    }
  }, [])

  // derive app counts from global TanStack Query client if available, otherwise fall back to fetching
  const [appCounts, setAppCounts] = useState({ running: 0, updating: 0, failed: 0 })

  useEffect(() => {
    let canceled = false
    async function loadCounts() {
      try {
        // try to read a global query client placed on window by the app
        const qc: any = (globalThis as any).__REACT_QUERY_CLIENT__
        if (qc && typeof qc.getQueryData === 'function') {
          const apps = qc.getQueryData(['apps']) || []
          if (!canceled) compute(apps)
          return
        }
        // fallback: call API
        const apps = await getApps()
        if (!canceled) compute(apps)
      } catch (e) {
        // ignore
      }
    }
    function compute(apps: any[]) {
      const running = apps.filter(a => a.status === 'running').length
      const updating = apps.filter(a => a.status === 'updating').length
      const failed = apps.filter(a => a.status === 'failed').length
      setAppCounts({ running, updating, failed })
    }
    loadCounts()
    const id = setInterval(loadCounts, 15_000)
    return () => { canceled = true; clearInterval(id) }
  }, [])

  const cpuTile = metrics?.cpu
  const memTile = metrics?.mem
  const diskTile = metrics?.disk
  const uptimeSec = metrics?.uptime?.seconds

  return (
    <div style={{display:'flex',gap:12,alignItems:'center',padding:8}}>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <div style={{minWidth:120}}>
          <div style={{fontSize:12,color:'#666'}}>host cpu</div>
          <div style={{fontSize:16,fontWeight:600}}>{cpuTile?.current != null ? `${Math.round(cpuTile.current)}%` : '—'}</div>
        </div>
        <div style={{minWidth:140}}>
          <div style={{fontSize:12,color:'#666'}}>host memory</div>
          <div style={{fontSize:16,fontWeight:600}}>{memTile?.used != null ? `${fmtBytes(memTile.used)} / ${fmtBytes(memTile.total)}` : '—'}</div>
        </div>
        <div style={{minWidth:120}}>
          <div style={{fontSize:12,color:'#666'}}>host disk</div>
          <div style={{fontSize:16,fontWeight:600}}>{diskTile?.percent != null ? `${Math.round(diskTile.percent)}%` : '—'}</div>
        </div>
      </div>

      <div style={{display:'flex',gap:8,marginLeft:8}}>
        <div style={{textAlign:'center',minWidth:80}}>
          <div style={{fontSize:12,color:'#666'}}>running</div>
          <div style={{fontSize:16,fontWeight:600}}>{appCounts.running}</div>
        </div>
        <div style={{textAlign:'center',minWidth:80}}>
          <div style={{fontSize:12,color:'#666'}}>updating</div>
          <div style={{fontSize:16,fontWeight:600,color:'#f59e0b'}}>{appCounts.updating}</div>
        </div>
        <div style={{textAlign:'center',minWidth:80}}>
          <div style={{fontSize:12,color:'#666'}}>failed</div>
          <div style={{fontSize:16,fontWeight:600,color:'#ef4444'}}>{appCounts.failed}</div>
        </div>
        <div style={{textAlign:'center',minWidth:80}}>
          <div style={{fontSize:12,color:'#666'}}>uptime</div>
          <div style={{fontSize:16,fontWeight:600}}>{uptimeSec != null ? `${Math.floor(uptimeSec/86400)}d` : '—'}</div>
        </div>
      </div>

      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
        <div style={{fontSize:12,color:'#666'}}>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : ''}</div>
        <div style={{width:10,height:10,borderRadius:999,background: loading ? '#f59e0b' : '#94a3b8'}} aria-hidden />
      </div>
    </div>
  )
}
