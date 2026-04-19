import { describe, it, expect } from 'vitest'
import parsePrometheusText from '../prometheus'

describe('parsePrometheusText', () => {
  it('parses basic host metrics and series', () => {
    const payload = `# HELP host_cpu_percent CPU percent\nhost_cpu_percent 12.5 1610000000000\nhost_cpu_percent 13.0 1610000060000\n# memory\nhost_memory_used_bytes 2147483648 1610000060000\nhost_memory_total_bytes 4294967296 1610000060000\n# disk free percent\nhost_disk_free_percent 64 1610000060000\n# start time (seconds)\nprocess_start_time_seconds 1600000000 1610000060000\n`
    const m = parsePrometheusText(payload)
    expect(m.cpu).toBeDefined()
    expect(m.cpu!.series).toHaveLength(2)
    expect(m.cpu!.current).toBeCloseTo(13.0)
    expect(m.mem).toBeDefined()
    expect(m.mem!.used).toBe(2147483648)
    expect(m.mem!.total).toBe(4294967296)
    expect(m.mem!.percent).toBeGreaterThan(49)
    expect(m.disk).toBeDefined()
    // host_disk_free_percent 64 -> used = 36
    expect(Math.round(m.disk!.percent!)).toBe(36)
    expect(m.uptime).toBeDefined()
    // uptime computed from sample ts (1610000060000 ms) minus start seconds
    expect(m.uptime!.seconds).toBe(1610000060 - 1600000000)
  })

  it('handles missing gauges gracefully', () => {
    const payload = `# no cpu here\nhost_memory_used_bytes 1024 1610000000000\n`
    const m = parsePrometheusText(payload)
    expect(m.cpu).toBeUndefined()
    expect(m.mem).toBeDefined()
    expect(m.mem!.used).toBe(1024)
    expect(m.disk).toBeUndefined()
  })
})
