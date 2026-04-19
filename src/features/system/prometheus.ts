export type MetricSample = {
  labels: Record<string, string>
  value: number
  ts?: number
}

export type SystemMetrics = {
  cpu?: { current?: number; series?: number[] }
  mem?: { used?: number; total?: number; percent?: number; series?: number[] }
  disk?: { percent?: number; series?: number[] }
  uptime?: { seconds?: number }
  raw: Record<string, MetricSample[]>
}

function parseLabels(raw: string | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw) return out
  const inner = raw.replace(/^{|}$/g, '')
  // split by commas not inside quotes
  const parts = inner.match(/(?:[^,\\"]+|"(?:\\.|[^"])*")+/g) || []
  for (const p of parts) {
    const idx = p.indexOf('=')
    if (idx === -1) continue
    const k = p.slice(0, idx).trim()
    let v = p.slice(idx + 1).trim()
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/\\"/g, '"')
    }
    out[k] = v
  }
  return out
}

export function parsePrometheusText(text: string): SystemMetrics {
  const lines = text.split(/\r?\n/)
  const raw: Record<string, MetricSample[]> = {}

  const metricRe = /^([a-zA-Z_:][a-zA-Z0-9_:]*)(\{[^}]*\})?\s+([0-9eE+\-\.]+)(?:\s+([0-9]+))?$/

  for (const line of lines) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const m = t.match(metricRe)
    if (!m) continue
    const name = m[1]
    const labels = parseLabels(m[2])
    const value = Number(m[3])
    const tsRaw = m[4]
    const ts = tsRaw ? Number(tsRaw) : undefined
    if (!raw[name]) raw[name] = []
    raw[name].push({ labels, value, ts })
  }

  const out: SystemMetrics = { raw }

  // Helper to pick latest sample array for a metric
  function latestSamples(name: string) {
    const arr = raw[name]
    if (!arr || arr.length === 0) return undefined
    return arr.slice().sort((a, b) => (b.ts ?? 0) - (a.ts ?? 0))
  }

  // CPU: prefer explicit percent metric
  const cpuNames = ['host_cpu_percent', 'cpu_usage_percent', 'host_cpu_usage']
  for (const n of cpuNames) {
    const s = latestSamples(n)
    if (s) {
      out.cpu = { current: s[0].value, series: s.map(x => x.value) }
      break
    }
  }

  // Memory: used + total
  const memUsedName = 'host_memory_used_bytes'
  const memTotalName = 'host_memory_total_bytes'
  const used = latestSamples(memUsedName)?.[0]
  const total = latestSamples(memTotalName)?.[0]
  if (used || total) {
    const usedVal = used?.value
    const totalVal = total?.value
    const percent = usedVal != null && totalVal ? (usedVal / totalVal) * 100 : undefined
    out.mem = { used: usedVal, total: totalVal, percent: percent ? Math.round(percent * 100) / 100 : undefined, series: used ? latestSamples(memUsedName)!.map(x=>x.value) : undefined }
  }

  // Disk: percent or compute from bytes
  const diskPercentNames = ['host_disk_free_percent', 'host_disk_used_percent', 'host_disk_percent']
  for (const n of diskPercentNames) {
    const s = latestSamples(n)
    if (s) {
      let val = s[0].value
      // if free percent provided, convert to used percent if name contains 'free'
      if (n.includes('free')) val = 100 - val
      out.disk = { percent: val, series: s.map(x => x.value) }
      break
    }
  }

  // Uptime: look for process_start_time_seconds or process_uptime_seconds
  const startNames = ['process_start_time_seconds', 'node_boot_time_seconds']
  const uptimeName = 'process_uptime_seconds'
  const nowFromSamples = (() => {
    // take the latest timestamp among samples (ms)
    let max = 0
    for (const arr of Object.values(raw)) {
      for (const s of arr) if (s.ts && s.ts > max) max = s.ts
    }
    return max || Date.now()
  })()

  const uptimeSample = latestSamples(uptimeName)?.[0]
  if (uptimeSample) {
    out.uptime = { seconds: uptimeSample.value }
  } else {
    for (const n of startNames) {
      const s = latestSamples(n)?.[0]
      if (s) {
        // prometheus timestamps are ms; start time is seconds
        const nowSec = Math.floor((nowFromSamples ?? Date.now()) / 1000)
        const started = Math.floor(s.value)
        out.uptime = { seconds: Math.max(0, nowSec - started) }
        break
      }
    }
  }

  return out
}

export default parsePrometheusText
